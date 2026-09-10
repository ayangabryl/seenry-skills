import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('flash_stage_tested',ROOT/'scripts/flash_stage.py')
flash=importlib.util.module_from_spec(spec);spec.loader.exec_module(flash)

class FlashBootstrap(unittest.TestCase):
    def test_missing_signin_is_distinct_from_no_log_or_model_listing(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'cli.log'
            self.assertFalse(flash.authentication_blocked(p))
            p.write_text('Available model: gemini-3.8-flash-high')
            self.assertFalse(flash.authentication_blocked(p))
            p.write_text('Prompt example: You are not logged into Antigravity.')
            self.assertFalse(flash.authentication_blocked(p))
            p.write_text('W0911 05:32:48.282989 169 cache.go:135] Refresh failed: You are not logged into Antigravity.')
            self.assertTrue(flash.authentication_blocked(p))
    def test_unresponsive_child_is_killed_after_termination_timeout(self):
        class Child:
            calls=[]
            def terminate(self):self.calls.append('terminate')
            def kill(self):self.calls.append('kill')
            def wait(self,timeout):
                self.calls.append('wait')
                if 'kill' not in self.calls:raise flash.subprocess.TimeoutExpired('fixture',timeout)
                return -9
        child=Child();flash.stop_child(child)
        self.assertEqual(child.calls,['terminate','wait','kill','wait'])

if __name__=='__main__':unittest.main()
