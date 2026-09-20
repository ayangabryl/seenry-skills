import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'skills/seenry/scripts'))
from packet import compile_packet
class FeedbackRouting(unittest.TestCase):
    def test_feedback_is_carried_in_stage_and_decision_packets(self):
        project={'scope':'component','media':'none','motion':'feedback','feedback':[{'finding':'Selection shifts title','state':'selected row','check':'Compare title rectangles and focus'}]}
        for decision in (None,'controls','motion'):
            result=compile_packet('refine',project=project,decision=decision)
            self.assertEqual(result['project_decisions']['feedback'],project['feedback'])
            self.assertIn('seenry/references/feedback-gate.md',{x['path'] for x in result['resources']})
    def test_gate_not_loaded_for_unrelated_work(self):
        result=compile_packet('refine',decision='color')
        self.assertNotIn('seenry/references/feedback-gate.md',{x['path'] for x in result['resources']})
    def test_malformed_feedback_cannot_silently_disappear(self):
        for feedback in ('no caps',[{'finding':'no caps'}],[{'finding':'x','state':'','check':'x'}]):
            with self.assertRaisesRegex(ValueError,'feedback'):
                compile_packet('refine',project={'feedback':feedback},decision='controls')
if __name__=='__main__':unittest.main()
