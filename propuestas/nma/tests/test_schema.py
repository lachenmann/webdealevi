# SPDX-License-Identifier: GPL-3.0-or-later
"""Validación del intercambio NMA contra JSON Schema 2020-12 y semántica."""
import copy
import json
import pathlib
import sys
import unittest

from jsonschema import Draft202012Validator

root=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/"src"))
from nma_core import from_record, Ratio

SCHEMA=json.loads((root/"schema"/"nma-event-v0.1.schema.json").read_text())
CASES=json.loads((root/"examples"/"casos-exactos.json").read_text())["cases"]


class JSONConformance(unittest.TestCase):
    def test_schema_is_valid_and_all_examples_pass(self):
        Draft202012Validator.check_schema(SCHEMA)
        validator=Draft202012Validator(SCHEMA)
        self.assertEqual(len(CASES),6)
        for case in CASES:
            self.assertFalse(list(validator.iter_errors(case)),case["id"])
            r=from_record(case["sound"])
            self.assertIsNotNone(r)
            ref=from_record(case["reference"]["frequency_hz"])
            self.assertIsInstance(ref,Ratio)

    def test_syntax_rejects_missing_explicit_profile(self):
        invalid=copy.deepcopy(CASES[3])
        del invalid["notation"]["profile"]
        self.assertFalse(Draft202012Validator(SCHEMA).is_valid(invalid))

    def test_syntax_rejects_float_in_place_of_exact_integer(self):
        invalid=copy.deepcopy(CASES[1])
        invalid["sound"]["steps"]=7.0
        self.assertFalse(Draft202012Validator(SCHEMA).is_valid(invalid))

    def test_syntax_rejects_invalid_denominator_and_new_fields(self):
        validator=Draft202012Validator(SCHEMA)
        invalid=copy.deepcopy(CASES[0])
        invalid["sound"]["denominator"]="0"
        self.assertFalse(validator.is_valid(invalid))
        invalid=copy.deepcopy(CASES[0])
        invalid["copyright_inherited_from_font"]=True
        self.assertFalse(validator.is_valid(invalid))

    def test_exactness_is_not_derived_from_type_only(self):
        # La sintaxis permite razones no reducidas: la semántica normaliza.
        valid=copy.deepcopy(CASES[0])
        valid["sound"]["numerator"]="6"
        valid["sound"]["denominator"]="4"
        self.assertTrue(Draft202012Validator(SCHEMA).is_valid(valid))
        normalized=from_record(valid["sound"])
        self.assertEqual(normalized, Ratio(3,2))


if __name__=="__main__":
    unittest.main()
