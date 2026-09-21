import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('jev_decision', ROOT/'skills/seenry/scripts/jev_decision.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class JevDecisionTest(unittest.TestCase):
    def setUp(self):
        self.source = json.loads((ROOT/'evals/jev-pilot/seenry-page.json').read_text())
        self.payload, _ = module.prepare(self.source)
    def response(self):
        answers = {}
        for name,q in self.payload['questions'].items():
            first = next(iter(q['criteria']))
            answers[name] = {'type':'choice','choice':first,'confidence':1.0,
                'probabilities':{k:float(k==first) for k in q['criteria']}}
        return {'model':module.MODEL,'answers':answers,'usage':{'input_tokens':1000,'output_tokens':100}}
    def test_requires_abstention(self):
        del self.source['questions']['reading_order']['criteria']['none']
        with self.assertRaises(ValueError):module.prepare(self.source)
    def test_rejects_credentials_in_state(self):
        self.source['state'] = 'apikey_example'
        with self.assertRaises(ValueError):module.prepare(self.source)
    def test_rejects_unoffered_choice(self):
        response=self.response();response['answers']['reading_order']['choice']='run_code'
        with self.assertRaises(ValueError):module.validate_response(response,self.payload)
    def test_rejects_missing_answer(self):
        response=self.response();del response['answers']['hero_evidence']
        with self.assertRaises(ValueError):module.validate_response(response,self.payload)
    def test_rejects_invalid_distribution(self):
        response=self.response();response['answers']['reading_order']['probabilities']['none']=float('nan')
        with self.assertRaises(ValueError):module.validate_response(response,self.payload)
    def test_rejects_changed_model(self):
        response=self.response();response['model']='unknown'
        with self.assertRaises(ValueError):module.validate_response(response,self.payload)
    def test_valid_choice_never_approves_visual_quality(self):
        with tempfile.TemporaryDirectory() as tmp:
            class Reply:
                def __enter__(reply):return reply
                def __exit__(reply,*args):pass
                def read(reply,n):return json.dumps(self.response()).encode()
            class Opener:
                def open(opener,*args,**kwargs):return Reply()
            with patch.object(module.urllib.request,'build_opener',return_value=Opener()):
                result=module.evaluate(self.payload,json.dumps(self.payload).encode(),'FAKE_TEST_KEY',Path(tmp)/'ledger')
            self.assertEqual(result['visual_quality'],'unverified')
            self.assertNotIn('FAKE_TEST_KEY',json.dumps(result))
    def test_call_limit_retains_failed_reservations(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'ledger'
            for _ in range(module.MAX_CALLS):module.reserve(path)
            with self.assertRaises(ValueError):module.reserve(path)
            self.assertEqual(len(path.read_text().splitlines()),module.MAX_CALLS)
    def test_lock_prevents_concurrent_reservation(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'ledger';path.with_suffix('.lock').touch()
            with self.assertRaises(FileExistsError):module.reserve(path)
            self.assertFalse(path.exists())
    def test_explicit_experiment_reservation_limit(self):
        from decimal import Decimal
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'expanded-ledger'
            for _ in range(100):module.reserve(path,max_calls=100,budget=Decimal('0.50'))
            with self.assertRaises(ValueError):module.reserve(path,max_calls=100,budget=Decimal('0.50'))
            self.assertEqual(len(path.read_text().splitlines()),100)
            self.assertEqual(module.MAX_CALLS,12)
    def test_explicit_budget_exhaustion_does_not_reserve(self):
        from decimal import Decimal
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'budget-ledger'
            with self.assertRaises(ValueError):module.reserve(path,max_calls=100,budget=Decimal('0.001'))
            self.assertFalse(path.exists())
    def test_invalid_extended_limits_rejected(self):
        from decimal import Decimal
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'ledger'
            for calls,budget in [(201,Decimal('0.5')),(100,Decimal('6')),(True,Decimal('0.5'))]:
                with self.assertRaises(ValueError):module.reserve(path,max_calls=calls,budget=budget)
    def test_redirects_never_forward_credentials(self):
        self.assertIsNone(module.NoRedirect().redirect_request(None,None,302,'',{},'https://example.com'))

if __name__=='__main__':unittest.main()
