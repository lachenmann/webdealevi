# SPDX-License-Identifier: GPL-3.0-or-later
"""G2: guarantee LilyPond variants, notation profiles and geometry are honest."""
from __future__ import annotations

from fractions import Fraction
from pathlib import Path
import os
import tempfile
import unittest

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

from build_lilypond_g2 import CATALOGUE, build

SOURCE=os.environ.get("LILYPOND_FONT_SOURCE")


@unittest.skipUnless(SOURCE,"Set LILYPOND_FONT_SOURCE for genuine Emmentaler")
class OriginalVariantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.target,cls.manifest=build(
            SOURCE,Path(cls.temp.name)/"variants.ttf")
        cls.font=TTFont(cls.target)
        cls.original=TTFont(SOURCE)

    @classmethod
    def tearDownClass(cls):
        cls.original.close()
        cls.font.close()
        cls.temp.cleanup()

    def test_provenance_and_exact_lilypond_names(self):
        self.assertEqual(self.manifest["edition"],"G2-0.2.2-DRAFT")
        self.assertEqual(self.manifest["font_status"],"STUDY_ONLY_NO_RELEASE")
        self.assertTrue(self.manifest["g1_approved"])
        self.assertFalse(self.manifest["g2_approved"])
        self.assertIn("GPL",self.manifest["licence"])
        for key,spec in CATALOGUE.items():
            self.assertIn(spec.source,self.original.getGlyphOrder())
            self.assertEqual(self.manifest["glyphs"][key]["upstream_name"],
                             spec.source)

    def test_exact_semantics_not_numbers_of_lines(self):
        g=self.manifest["glyphs"]
        expected={
            "flat":Fraction(-100),
            "sharp":Fraction(100),
            "quarter_flat_stein":Fraction(-50),
            "quarter_sharp_stein":Fraction(50),
            "three_quarters_sharp_stein":Fraction(150),
            "three_quarters_flat_lilypond":Fraction(-150),
            "quarter_sharp_one_beam_lilypond":Fraction(50),
        }
        for key,exact in expected.items():
            cent=g[key]["exact_cents"]
            self.assertEqual(
                Fraction(cent["numerator"],cent["denominator"]),exact
            )
            self.assertEqual(g[key]["notation_profile"],
                             "nma.tone-12tet.v0")
        self.assertIsNone(g["natural"]["exact_cents"])
        self.assertEqual(g["natural"]["notation_profile"],"contextual")

    def test_one_beam_is_not_wrongly_reused_as_eighth_tone(self):
        one=self.manifest["glyphs"]["quarter_sharp_one_beam_lilypond"]
        self.assertEqual(one["upstream_name"],
                         "accidentals.sharp.slash.stem")
        self.assertEqual(one["exact_cents"],
                         {"numerator":50,"denominator":1})
        self.assertIn("NOT an eighth",one["caveat"])
        self.assertEqual(one["glyph_codepoint"],"U+F0021")
        self.assertIsNone(one["smufl_name"])
        # No +25 cents allocated in this draft.
        self.assertFalse(any(
            data["exact_cents"]=={"numerator":25,"denominator":1}
            for data in self.manifest["glyphs"].values()
        ))

    def test_ordinary_smufl_vs_private_study_codes(self):
        expected={
            "flat":0xE260,"natural":0xE261,"sharp":0xE262,
            "quarter_flat_stein":0xE280,
            "quarter_sharp_stein":0xE282,
            "three_quarters_sharp_stein":0xE283,
            "three_quarters_flat_lilypond":0xF0020,
            "quarter_sharp_one_beam_lilypond":0xF0021,
        }
        cmap=self.font.getBestCmap()
        self.assertEqual(set(cmap),{32,*expected.values()})
        for name,code in expected.items():
            self.assertEqual(cmap[code],name)
            self.assertEqual(self.manifest["glyphs"][name]["glyph_codepoint"],
                             f"U+{code:04X}")

    def test_three_quarters_flat_is_not_falsely_labeled_stein(self):
        flat=self.manifest["glyphs"]["three_quarters_flat_lilypond"]
        self.assertIsNone(flat["smufl_name"])
        self.assertEqual(flat["status"],"HISTORICAL_REFERENCE_ONLY")
        self.assertIn("E281",flat["caveat"])

    def test_derived_contours_respect_upstream_bounding_boxes(self):
        old=self.original.getGlyphSet()
        new=self.font.getGlyphSet()
        for key,item in self.manifest["glyphs"].items():
            name=item["upstream_name"]
            p0=BoundsPen(old);old[name].draw(p0)
            p1=BoundsPen(new);new[key].draw(p1)
            self.assertIsNotNone(p0.bounds,key)
            self.assertIsNotNone(p1.bounds,key)
            t=item["transform"]
            expected=[
                p0.bounds[0]*t["scale"]+t["offset_x"],
                p0.bounds[1]*t["scale"]+t["offset_y"],
                p0.bounds[2]*t["scale"]+t["offset_x"],
                p0.bounds[3]*t["scale"]+t["offset_y"],
            ]
            for got,want in zip(p1.bounds,expected):
                self.assertAlmostEqual(got,want,delta=2.5,
                                       msg=f"{key}: {got} != {want}")
            self.assertGreater(self.font["glyf"][key].numberOfContours,0)
            self.assertGreater(self.font["hmtx"][key][0],0)

    def test_ttf_contains_original_copyright_and_exception_reference(self):
        info=self.font["name"].getDebugName(0)
        self.assertIn(self.manifest["source_copyright"],info)
        self.assertIn("LilyPond",info)
        self.assertIn("font exception",info)
        text=(Path(__file__).parent/"upstream"/"LICENSE").read_text()
        self.assertIn("dual-licensed",text)
        self.assertIn("embed this font",text)
        self.assertEqual(self.font["head"].unitsPerEm,1000)

    def test_study_is_not_installed_or_added_to_monocordio(self):
        root=Path(__file__).parent.parent
        self.assertFalse((root/"EsferasMicrotonal-G2-LilyPond.ttf").exists())
        readme=(root/"README.md").read_text()
        self.assertIn("LilyPond",readme)


if __name__=="__main__":
    unittest.main()
