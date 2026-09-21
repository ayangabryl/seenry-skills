import sys
import tempfile
import unittest
import hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'skills/seenry/scripts'))
from jev_checkpoint import assess
from jev_decision import prepare, MODEL

class CheckpointTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);(self.root/'evidence.txt').write_text('Observed')
        self.request={'state':'case','questions':{'decision':{'type':'choice','instructions':'Choose next step','criteria':{'retain':'Retain candidate','none':'Abstain'}}}}
        _,encoded=prepare(self.request)
        self.result={'model':MODEL,'live':True,'request_sha256':hashlib.sha256(encoded).hexdigest(),'answers':{'decision':{'type':'choice','choice':'retain','confidence':1.0,'probabilities':{'retain':1.0,'none':0.0}}},'usage':{'input_tokens':10,'output_tokens':5}}
        self.check={'repairs_used':1,'resets_used':0,'artifacts':[{'path':'evidence.txt','sha256':hashlib.sha256(b'Observed').hexdigest()}],'checks':[{'id':'hero','status':'pass','reason':'Full boundary inspected','evidence':'evidence.txt'}]}
    def run_gate(self):return assess(self.check,self.request,self.result,self.root)
    def test_pass_is_not_acceptance(self):
        r=self.run_gate();self.assertEqual(r['status'],'ready-for-human-review');self.assertEqual(r['human_acceptance'],'pending')
    def test_confident_result_cannot_override_failure(self):
        self.check['checks'][0]['status']='fail';self.assertEqual(self.run_gate()['status'],'repair')
    def test_limit_stops_repairs(self):
        self.check['checks'][0]['status']='fail';self.check['repairs_used']=2;self.assertEqual(self.run_gate()['status'],'stop-unresolved')
    def test_missing_inspection_requires_observation(self):
        self.check['checks'][0]['status']='uninspected';self.assertEqual(self.run_gate()['status'],'inspect-or-compare')
    def test_stale_artifact_rejected(self):
        (self.root/'evidence.txt').write_text('Changed')
        with self.assertRaises(ValueError):self.run_gate()
    def test_wrong_request_rejected(self):
        self.request['state']='Different case'
        with self.assertRaises(ValueError):self.run_gate()
    def test_abstention_returns_to_agent(self):
        a=self.result['answers']['decision'];a['choice']='none';a['probabilities']={'retain':0.0,'none':1.0}
        self.assertEqual(self.run_gate()['status'],'agent-review')
    def test_no_evidence_rejected(self):
        self.check['checks'][0]['evidence']='missing.png'
        with self.assertRaises(ValueError):self.run_gate()

if __name__=='__main__':unittest.main()
