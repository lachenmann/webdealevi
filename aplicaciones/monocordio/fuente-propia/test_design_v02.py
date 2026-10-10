"""Verifica la DOCUMENTACIÓN v0.2; no compila ni sustituye glifos."""
from __future__ import annotations

import json
import math
from fractions import Fraction
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent
REGISTRY = json.loads((ROOT / "docs" / "REGISTRO_MORFOLOGICO_v0.2.json").read_text(encoding="utf-8"))
GLYPHS = {item["id"]: item for item in REGISTRY["semantic_entries"]}


def features(glyph_id: str) -> frozenset[str]:
    primitives = GLYPHS[glyph_id]["primitives"]
    if primitives is None:
        raise ValueError("Diseño aún no definido")
    return frozenset(primitives)


def cents(glyph_id: str) -> Fraction:
    value = GLYPHS[glyph_id]["cents_exact"]
    if value is None:
        raise ValueError("El becuadro tiene función contextual")
    return Fraction(value["numerator"], value["denominator"])


class DocumentationV02(unittest.TestCase):
    def test_registry_is_draft_and_invariant_free(self):
        self.assertEqual(REGISTRY["schema"], "esferas-morfologia-draft-v0.2")
        self.assertIs(REGISTRY["normative"], False)
        self.assertEqual(REGISTRY["unit"]["tone_cents"], {"numerator": 200, "denominator": 1})
        self.assertEqual(len(GLYPHS), len(REGISTRY["semantic_entries"]))

    def test_rationals_are_exact_and_reduced(self):
        for glyph in GLYPHS.values():
            fraction = glyph["tone_fraction"]
            c = glyph["cents_exact"]
            if fraction is None:
                self.assertIsNone(c)
                continue
            numerator, denominator = fraction["numerator"], fraction["denominator"]
            self.assertIs(type(numerator), int)
            self.assertIs(type(denominator), int)
            self.assertGreater(denominator, 0)
            self.assertEqual(math.gcd(numerator, denominator), 1)
            exact = Fraction(200 * numerator, denominator)
            self.assertEqual(Fraction(c["numerator"], c["denominator"]), exact)
            self.assertEqual(math.gcd(c["numerator"], c["denominator"]), 1)

    def test_sharp_family_derived_by_component_set(self):
        eighth = features("sharp_eighth_up")
        quarter = features("sharp_quarter_up")
        three_eighths = features("sharp_three_eighths_up")
        half = features("sharp_half_up")
        three_quarters = features("sharp_three_quarters_up")
        self.assertEqual(eighth, {"V_L", "H_S"})
        self.assertEqual(quarter, {"V_L", "H_S", "H_I"})
        self.assertEqual(three_eighths, {"V_L", "V_R", "H_S"})
        self.assertEqual(half, {"V_L", "V_R", "H_S", "H_I"})
        self.assertEqual(three_quarters, {"V_L", "V_R", "V_X", "H_S", "H_I"})
        self.assertLess(eighth, quarter)
        self.assertLess(eighth, three_eighths)
        self.assertLess(quarter, half)
        self.assertLess(three_eighths, half)
        self.assertLess(half, three_quarters)
        self.assertFalse(quarter.issubset(three_eighths))
        self.assertFalse(three_eighths.issubset(quarter))

    def test_stroke_count_is_not_interval_magnitude(self):
        self.assertEqual(len(features("sharp_quarter_up")), len(features("sharp_three_eighths_up")))
        self.assertNotEqual(cents("sharp_quarter_up"), cents("sharp_three_eighths_up"))
        self.assertEqual(cents("sharp_eighth_up") * 2, cents("sharp_quarter_up"))
        self.assertEqual(features("sharp_eighth_up") | features("sharp_eighth_up"),
                         features("sharp_eighth_up"))
        self.assertNotEqual(cents("sharp_eighth_up") * 2, cents("sharp_eighth_up"))

    def test_negative_open_flat_and_cancel_symbol_are_distinct(self):
        self.assertEqual(features("flat_quarter_down"), {"B_V","B_CURVE_L","B_OPEN"})
        self.assertEqual(features("flat_half_down"), {"B_V","B_CURVE_R","B_OPEN"})
        self.assertEqual(GLYPHS["flat_quarter_down"]["codepoint"], "E280")
        self.assertEqual(GLYPHS["flat_quarter_down"]["smufl"], "accidentalQuarterToneFlatStein")
        self.assertEqual(GLYPHS["natural"]["codepoint"], "E261")
        self.assertEqual(GLYPHS["natural"]["semantics"], "contextual-cancellation")
        self.assertIsNone(GLYPHS["natural"]["cents_exact"])
        with self.assertRaises(ValueError):
            cents("natural")

    def test_unsettled_designs_do_not_pretend_to_be_normalized(self):
        for name in ("flat_eighth_down", "flat_three_eighths_down",
                     "sixth_up", "sixth_down", "twelfth_up", "twelfth_down"):
            self.assertIsNone(GLYPHS[name]["primitives"])
            self.assertIsNone(GLYPHS[name]["codepoint"])
            self.assertEqual(GLYPHS[name]["status"], "open-design")
        for name in ("sharp_eighth_up", "sharp_three_eighths_up"):
            self.assertIsNone(GLYPHS[name]["smufl"])
            self.assertIsNone(GLYPHS[name]["codepoint"])

    def test_known_symbol_registry_uses_SMUFL_correctly(self):
        known = {
            "flat_half_down": ("accidentalFlat", "E260"),
            "sharp_half_up": ("accidentalSharp", "E262"),
            "natural": ("accidentalNatural", "E261"),
            "flat_quarter_down": ("accidentalQuarterToneFlatStein", "E280"),
            "sharp_quarter_up": ("accidentalQuarterToneSharpStein", "E282"),
            "sharp_three_quarters_up": ("accidentalThreeQuarterTonesSharpStein", "E283")
        }
        for ident, (name, cp) in known.items():
            self.assertEqual((GLYPHS[ident]["smufl"], GLYPHS[ident]["codepoint"]), (name, cp))

    def test_documents_preserved_as_separate_source(self):
        docs = [
            "MANIFIESTO_DE_DISENO_v0.2.md",
            "GRAMATICA_DE_TRAZOS_v0.2.md",
            "PROTOCOLO_QA_v0.2.md",
            "REGISTRO_DECISIONES_v0.2.md"
        ]
        for name in docs:
            text = (ROOT / "docs" / name).read_text(encoding="utf-8")
            self.assertGreater(len(text), 1000)
            self.assertIn("v0.2", text.lower())


if __name__ == "__main__":
    unittest.main()
