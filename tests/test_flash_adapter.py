import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch
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
    def test_delivery_size_counts_supplied_utf8_without_inventing_tokens_or_changing_usage(self):
        for usage in ({'input_tokens':0,'output_tokens':0},None):
            with self.subTest(usage=usage),tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp);prompt=root/'prompt.txt';out=root/'run';text='Inspect Français — 日本語\nInspect the next view.'
                prompt.write_bytes(text.replace('\n','\r\n').encode('utf-8'))
                def launch(command,**kwargs):
                    self.assertEqual(command[command.index('--print')+1],text)
                    kwargs['stdout'].write(json.dumps({'event':'result','result':{'response':'Observed','usage':usage}})+'\n')
                    return object()
                with patch('sys.argv',['flash_stage.py','--prompt',str(prompt),'--out',str(out)]),patch.object(flash.shutil,'which',return_value='/fake/agy'),patch.object(flash.subprocess,'Popen',side_effect=launch),patch.object(flash,'wait_for_agy',return_value=(0,False,False)),redirect_stdout(io.StringIO()):
                    flash.main()
                result=json.loads((out/'run.json').read_text(encoding='utf-8'));size=result['delivery_size']
                self.assertEqual((out/'prompt.txt').read_text(encoding='utf-8'),text)
                self.assertEqual(size['prompt_bytes'],len(text.encode('utf-8')))
                self.assertEqual(size['prompt_characters'],len(text))
                self.assertGreater(size['prompt_bytes'],size['prompt_characters'])
                self.assertEqual(size['image_attachments'],0)
                self.assertEqual(size['external_schema_bytes'],0)
                self.assertIsNone(size['token_count'])
                self.assertEqual(result['usage'],usage)
                self.assertEqual(result['status'],'response-produced')

if __name__=='__main__':unittest.main()
