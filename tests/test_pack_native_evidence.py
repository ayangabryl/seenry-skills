"""Lossless packing, strict budgets, fail-closed traversal and corruption tests."""

import contextlib
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import pack_native_evidence as packer


def sha(data):
    return hashlib.sha256(data).hexdigest()


class PlatformTests(unittest.TestCase):
    def test_unsupported_platform_fails_closed(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary).resolve()
            with mock.patch.object(packer, "supported_platform", return_value=False):
                result = packer.pack(root / "source", root / "out")
            self.assertFalse(result["complete"])
            self.assertIn("POSIX", result["error"])
            self.assertFalse((root / "out").exists())

    def test_limits_cannot_exceed_production_caps(self):
        for field, maximum in (("part_bytes", packer.MAX_PART_BYTES),
                               ("input_bytes", packer.MAX_INPUT_BYTES),
                               ("files", packer.MAX_FILES),
                               ("parts", packer.MAX_PARTS),
                               ("directories", packer.MAX_DIRECTORIES)):
            with self.subTest(field=field):
                with self.assertRaises(packer.PackError):
                    packer.Limits(**{field: maximum + 1}).validate()


@unittest.skipUnless(packer.supported_platform(),
                     "secure packing requires macOS/Linux descriptor-relative no-follow I/O")
class PackingTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        # macOS /var and /tmp aliases are canonicalized by the caller, never
        # silently traversed by the packer itself.
        self.root = Path(self.temporary.name).resolve()
        self.source = self.root / "source"
        self.out = self.root / "out"
        self.source.mkdir()

    def file(self, name="a.bin", content=b"native\x00\xffevidence"):
        target = self.source / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return target

    def run_pack(self, **limits):
        return packer.pack(self.source, self.out, limits=packer.Limits(**limits))

    def failed(self, result, message, *, manifest=True):
        self.assertFalse(result["complete"], result)
        self.assertEqual(result["status"], "failed")
        self.assertIn(message, result["error"])
        if manifest:
            self.assertEqual(json.loads((self.out / "manifest.json").read_text()), result)

    def symlink(self, path, target, *, directory=False):
        try:
            path.symlink_to(target, target_is_directory=directory)
        except (OSError, NotImplementedError) as error:
            self.skipTest(f"OS does not permit symlink creation: {error}")

    def test_reconstructs_every_raw_byte_unicode_path_and_empty_directory(self):
        originals = {"a.bin": bytes(range(256)), "nested/café/画面.png": b"\x89PNG\x00\xff",
                     ".metadata.json": b'{"value":1}\n', "zero": b""}
        for name, content in originals.items():
            self.file(name, content)
        (self.source / "empty").mkdir()
        result = self.run_pack(part_bytes=500)
        self.assertTrue(result["complete"], result)
        self.assertTrue(result["inventory_complete"])
        self.assertTrue(result["source_verified"])
        self.assertTrue(result["archives_verified"])
        reconstructed, directories = {}, set()
        for record in result["parts"]:
            data = (self.out / record["name"]).read_bytes()
            self.assertLessEqual(len(data), 500)
            self.assertEqual(record["sha256"], sha(data))
            self.assertEqual(record["size_bytes"], len(data))
            self.assertTrue(record["verified"])
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                for member in archive.infolist():
                    self.assertEqual(member.compress_type, zipfile.ZIP_STORED)
                    self.assertEqual(member.date_time, (1980, 1, 1, 0, 0, 0))
                    if member.is_dir():
                        directories.add(member.filename)
                    else:
                        self.assertNotIn(member.filename, reconstructed)
                        reconstructed[member.filename] = archive.read(member)
        self.assertEqual(reconstructed, originals)
        self.assertEqual(directories, {"nested/", "nested/café/", "empty/"})
        self.assertEqual({e["path"]: e["sha256"] for e in result["inventory"]
                          if e["type"] == "file"},
                         {name: sha(data) for name, data in originals.items()})
        self.assertEqual(json.loads((self.out / "manifest.json").read_text()), result)

    def test_output_bytes_and_manifest_are_deterministic(self):
        self.file("é.png", b"image")
        self.file("a.json", b"{}")
        first = self.run_pack(part_bytes=180)
        original_output = {p.name: p.read_bytes() for p in self.out.iterdir()}
        os.utime(self.source / "a.json", (1234567890, 1234567890))
        second_out = self.root / "second"
        second = packer.pack(self.source, second_out, limits=packer.Limits(part_bytes=180))
        self.assertTrue(first["complete"])
        self.assertEqual(first, second)
        self.assertEqual(original_output, {p.name: p.read_bytes() for p in second_out.iterdir()})

    def test_exact_archive_bound_includes_unicode_headers(self):
        self.file("画面.png", b"12345")
        exact = 22 + 76 + 2 * len("画面.png".encode("utf-8")) + 5
        result = self.run_pack(part_bytes=exact)
        self.assertTrue(result["complete"], result)
        self.assertEqual((self.out / "part-000.zip").stat().st_size, exact)
        too_small = self.root / "small"
        result = packer.pack(self.source, too_small, limits=packer.Limits(part_bytes=exact - 1))
        self.assertFalse(result["complete"])
        self.assertIn("individual entry", result["error"])
        self.assertEqual(list(too_small.glob("part-*.zip")), [])

    def test_greedy_parts_are_bounded_and_named_through_007(self):
        for index in range(8):
            self.file(f"{index}.bin", bytes([index]) * 10)
        result = self.run_pack(part_bytes=118)
        self.assertTrue(result["complete"], result)
        self.assertEqual([p["name"] for p in result["parts"]],
                         [f"part-{i:03d}.zip" for i in range(8)])
        self.assertTrue(all(p["size_bytes"] == 118 for p in result["parts"]))

    def test_part_count_overflow_does_not_silently_drop_files(self):
        for index in range(3):
            self.file(f"{index}.bin", b"1234567890")
        result = self.run_pack(part_bytes=118, parts=2)
        self.failed(result, "part count")
        self.assertEqual(len(result["inventory"]), 3)
        self.assertTrue(result["inventory_complete"])
        self.assertEqual(result["parts"], [])
        self.assertEqual(len(list(self.source.iterdir())), 3)

    def test_total_input_budget_exact_and_over(self):
        self.file("a", b"123")
        self.file("b", b"45")
        self.assertTrue(self.run_pack(input_bytes=5)["complete"])
        self.out = self.root / "over"
        result = self.run_pack(input_bytes=4)
        self.failed(result, "total input byte budget")
        self.assertFalse(result["inventory_complete"])
        self.assertEqual((self.source / "b").read_bytes(), b"45")

    def test_file_count_budget(self):
        self.file("a", b"a")
        self.file("b", b"b")
        self.failed(self.run_pack(files=1), "file count")

    def test_directory_count_budget(self):
        self.file("a", b"a")
        (self.source / "one").mkdir()
        (self.source / "two").mkdir()
        self.failed(self.run_pack(directories=1), "directory count")

    def test_large_flat_inventory_is_bounded_before_sorting(self):
        for name in ("a", "b", "c"):
            self.file(name)
        self.failed(self.run_pack(files=1, directories=1), "directory entry budget")

    def test_missing_source_still_gets_failure_manifest(self):
        self.source = self.root / "missing"
        self.failed(self.run_pack(), "FileNotFoundError")

    def test_empty_source_rejected(self):
        self.failed(self.run_pack(), "no regular files")

    def test_directories_only_source_rejected(self):
        (self.source / "empty").mkdir()
        self.failed(self.run_pack(), "no regular files")

    def test_all_overlap_directions_rejected_without_writes(self):
        self.file()
        for output in (self.source, self.source / "out", self.root):
            with self.subTest(output=output):
                result = packer.pack(self.source, output)
                self.failed(result, "overlap", manifest=False)
        self.assertEqual([p.name for p in self.source.iterdir()], ["a.bin"])
        self.assertFalse((self.root / "manifest.json").exists())

    def test_existing_nonempty_output_remains_untouched(self):
        self.file()
        self.out.mkdir()
        (self.out / "manifest.json").write_bytes(b"previous manifest")
        (self.out / "part-000.zip").write_bytes(b"previous part")
        before = {p.name: p.read_bytes() for p in self.out.iterdir()}
        self.failed(self.run_pack(), "not empty", manifest=False)
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.out.iterdir()})

    def test_source_symlink_is_rejected(self):
        real = self.source
        self.file()
        self.source = self.root / "linked-source"
        self.symlink(self.source, real, directory=True)
        self.failed(self.run_pack(), "Error")

    def test_nested_file_symlink_is_rejected(self):
        external = self.root / "external"
        external.write_bytes(b"do not copy")
        self.file()
        self.symlink(self.source / "link", external)
        self.failed(self.run_pack(), "symlink rejected")
        self.assertEqual(external.read_bytes(), b"do not copy")
        self.assertEqual(list(self.out.glob("part-*.zip")), [])

    def test_nested_directory_symlink_is_rejected(self):
        self.file()
        self.symlink(self.source / "outside", self.root, directory=True)
        self.failed(self.run_pack(), "symlink rejected")

    def test_symlink_in_source_ancestor_is_rejected(self):
        self.file()
        self.symlink(self.root / "alias", self.root, directory=True)
        self.source = self.root / "alias" / "source"
        self.failed(self.run_pack(), "Error")

    def test_output_symlink_and_symlink_ancestor_preserve_targets(self):
        self.file()
        external = self.root / "external"
        external.mkdir()
        self.symlink(self.out, external, directory=True)
        self.failed(self.run_pack(), "symlink", manifest=False)
        self.out = self.out / "nested"
        self.failed(self.run_pack(), "Error", manifest=False)
        self.assertEqual(list(external.iterdir()), [])

    @unittest.skipUnless(hasattr(os, "mkfifo"), "FIFO creation unavailable")
    def test_special_file_rejected_without_opening_or_blocking(self):
        self.file()
        os.mkfifo(self.source / "pipe")
        self.failed(self.run_pack(), "special file")

    def test_unsafe_member_paths_rejected(self):
        for index, name in enumerate(("bad\\name", "C:drive", "line\nbreak")):
            with self.subTest(name=name):
                source, output = self.root / f"case-{index}", self.root / f"out-{index}"
                source.mkdir()
                (source / name).write_bytes(b"x")
                result = packer.pack(source, output)
                self.assertFalse(result["complete"])
                self.assertIn("unsafe relative path", result["error"])

    def test_path_budget_is_enforced(self):
        self.file("nested/a", b"x")
        with mock.patch.object(packer, "MAX_PATH_BYTES", 5):
            self.failed(self.run_pack(), "length/depth")

    def test_changed_source_before_copy_cannot_complete(self):
        target = self.file(content=b"before")
        original = packer.write_part

        def change_then_copy(*args):
            target.write_bytes(b"after!")
            return original(*args)

        with mock.patch.object(packer, "write_part", side_effect=change_then_copy):
            result = self.run_pack()
        self.failed(result, "source changed")
        self.assertEqual(target.read_bytes(), b"after!")

    def test_final_source_hash_verification_detects_even_same_stat_fingerprint(self):
        target = self.file(content=b"before")
        original = packer.SourceTree.verify

        def change_before_final_check(tree, limits, inventory):
            target.write_bytes(b"after!")
            # Simulate a filesystem that reports unchanged stat information:
            # final source hashing must independently catch different bytes.
            tree.signatures["a.bin"] = packer.signature(target.stat())
            return original(tree, limits, inventory)

        with mock.patch.object(packer.SourceTree, "verify", new=change_before_final_check):
            result = self.run_pack()
        self.failed(result, "final source hash mismatch")
        self.assertFalse(result["source_verified"])

    def test_source_added_after_copy_is_not_omitted(self):
        self.file()
        original = packer.write_part

        def add_after_copy(*args):
            original(*args)
            self.file("late", b"new")

        with mock.patch.object(packer, "write_part", side_effect=add_after_copy):
            result = self.run_pack()
        self.failed(result, "source root changed")

    def test_source_removed_after_copy_retains_part_but_cannot_complete(self):
        target = self.file(content=b"captured before removal")
        original = packer.write_part

        def remove_after_copy(*args):
            original(*args)
            target.unlink()  # Model a separate writer removing captured input.

        with mock.patch.object(packer, "write_part", side_effect=remove_after_copy):
            result = self.run_pack()
        self.failed(result, "FileNotFoundError")
        self.assertFalse(result["source_verified"])
        self.assertTrue(result["parts"][0]["written"])
        with zipfile.ZipFile(self.out / "part-000.zip") as archive:
            self.assertEqual(archive.read("a.bin"), b"captured before removal")

    def test_replaced_directory_with_symlink_is_not_followed(self):
        self.file("nested/a", b"inside")
        outside = self.root / "outside"
        outside.mkdir()
        (outside / "a").write_bytes(b"secret")
        original = packer.write_part

        def replace_before_copy(*args):
            (self.source / "nested").rename(self.source / "retained")
            self.symlink(self.source / "nested", outside, directory=True)
            return original(*args)

        with mock.patch.object(packer, "write_part", side_effect=replace_before_copy):
            result = self.run_pack()
        self.failed(result, "Error")
        self.assertEqual((outside / "a").read_bytes(), b"secret")
        self.assertEqual((self.source / "retained" / "a").read_bytes(), b"inside")

    def test_corrupted_copy_with_valid_zip_crc_fails_sha_verification(self):
        target = self.file(content=b"original")
        original = packer.SourceTree.read_file

        def corrupt_copy(tree, entry, sink=None):
            if sink is None:
                return original(tree, entry)

            class CorruptingSink:
                def write(self, block):
                    return sink.write(bytes([block[0] ^ 1]) + block[1:])

            return original(tree, entry, CorruptingSink())

        with mock.patch.object(packer.SourceTree, "read_file", new=corrupt_copy):
            result = self.run_pack()
        self.failed(result, "archive hash mismatch")
        self.assertFalse(result["archives_verified"])
        self.assertEqual(target.read_bytes(), b"original")

    def test_archive_write_corruption_is_not_complete(self):
        self.file()
        original = packer.write_part

        def corrupt_zip(*args):
            original(*args)
            path = self.out / args[2]
            data = path.read_bytes()
            path.write_bytes(data[:-22] + b"X" * 22)

        with mock.patch.object(packer, "write_part", side_effect=corrupt_zip):
            result = self.run_pack()
        self.failed(result, "BadZipFile")
        self.assertTrue(result["parts"][0]["written"])
        self.assertFalse(result["parts"][0]["verified"])

    def test_partial_write_failure_reports_all_retained_parts(self):
        self.file("a", b"abc")
        self.file("b", b"def")
        original = packer.write_part

        def fail_second(tree, out_fd, name, entries):
            if name == "part-001.zip":
                (self.out / name).write_bytes(b"partial")
                raise OSError("injected disk failure")
            original(tree, out_fd, name, entries)

        with mock.patch.object(packer, "write_part", side_effect=fail_second):
            result = self.run_pack(part_bytes=103)
        self.failed(result, "injected disk failure")
        self.assertTrue(result["parts"][0]["written"])
        self.assertFalse(result["parts"][1]["written"])
        self.assertEqual(result["parts"][1]["sha256"], sha(b"partial"))
        self.assertEqual(result["parts"][1]["size_bytes"], 7)
        self.assertEqual((self.source / "a").read_bytes(), b"abc")
        self.assertEqual((self.source / "b").read_bytes(), b"def")

    def test_complete_manifest_write_corruption_falls_back_to_failed_manifest(self):
        self.file()
        original = packer.os.fdopen

        class CorruptingManifest:
            def __init__(self, stream):
                self.stream = stream

            def __getattr__(self, name):
                return getattr(self.stream, name)

            def __enter__(self):
                self.stream.__enter__()
                return self

            def __exit__(self, *args):
                return self.stream.__exit__(*args)

            def write(self, data):
                if data.startswith(b"{"):
                    data = data.replace(b'"complete": true', b'"complete": null')
                return self.stream.write(data)

        def corrupt_manifest(fd, mode, *args, **kwargs):
            stream = original(fd, mode, *args, **kwargs)
            return CorruptingManifest(stream) if mode == "w+b" else stream

        with mock.patch.object(packer.os, "fdopen", side_effect=corrupt_manifest):
            result = self.run_pack()
        self.failed(result, "manifest write verification failed")
        self.assertFalse(json.loads((self.out / "manifest.json").read_text())["complete"])
        self.assertTrue((self.out / ".manifest.pending.json").exists())
        self.assertTrue((self.out / ".manifest.failed.json").exists())

    def test_concurrently_created_part_is_never_overwritten(self):
        self.file()
        original = packer.write_part

        def conflict_before_copy(tree, out_fd, name, entries):
            (self.out / name).write_bytes(b"concurrent output")
            original(tree, out_fd, name, entries)

        with mock.patch.object(packer, "write_part", side_effect=conflict_before_copy):
            result = self.run_pack()
        self.failed(result, "FileExistsError")
        self.assertEqual((self.out / "part-000.zip").read_bytes(), b"concurrent output")

    def test_concurrently_created_manifest_is_never_overwritten(self):
        self.file()
        original = packer.write_manifest

        def conflict_before_manifest(out_fd, manifest, **kwargs):
            if not kwargs:
                (self.out / "manifest.json").write_bytes(b"concurrent manifest")
            return original(out_fd, manifest, **kwargs)

        with mock.patch.object(packer, "write_manifest", side_effect=conflict_before_manifest):
            result = self.run_pack()
        self.failed(result, "manifest could not be saved", manifest=False)
        self.assertEqual((self.out / "manifest.json").read_bytes(), b"concurrent manifest")

    def test_native_capture_failure_metadata_is_preserved_opaquely(self):
        data = b'{"success":false,"error":"capture failed"}\n'
        self.file("results.json", data)
        result = self.run_pack()
        self.assertTrue(result["complete"], result)
        with zipfile.ZipFile(self.out / "part-000.zip") as archive:
            self.assertEqual(archive.read("results.json"), data)

    def test_source_is_opened_read_only(self):
        target = self.file()
        target.chmod(0o444)
        result = self.run_pack()
        self.assertTrue(result["complete"], result)
        self.assertEqual(target.stat().st_mode & 0o777, 0o444)

    def test_invalid_part_limits_write_failed_manifest(self):
        self.file()
        for index, limit in enumerate((0, 21, packer.MAX_PART_BYTES + 1)):
            self.out = self.root / f"invalid-{index}"
            self.failed(self.run_pack(part_bytes=limit), "part_bytes")

    def test_cli_success_and_nonzero_failure(self):
        self.file()
        script = str(Path(packer.__file__).resolve())
        completed = subprocess.run([sys.executable, script, "--source", str(self.source),
                                    "--out", str(self.out), "--part-bytes", "200"],
                                   capture_output=True, text=True, timeout=10)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("verified parts", completed.stdout)
        failed = subprocess.run([sys.executable, script, "--source", str(self.source),
                                 "--out", str(self.out)], capture_output=True, text=True,
                                timeout=10)
        self.assertNotEqual(failed.returncode, 0)
        self.assertIn("not empty", failed.stderr)
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(packer.main(["--source", str(self.root / "missing"),
                                          "--out", str(self.root / "failure")]), 1)


if __name__ == "__main__":
    unittest.main()
