# SPDX-License-Identifier: GPL-3.0-or-later
"""G2.2 candidate-specific tests: no approval, no misassigned historic shape."""
from __future__ import annotations

from fractions import Fraction
from pathlib import Path
import os
import tempfile
import unittest

from fontTools.ttLib import TTFont

from build_lilypond_g22 import CATALOGUE, PROFILE, PUA_START, build
from build_lilypond_mothers import _extract_mother

SOURCE=os.environ.get("LILYPOND_FONT_SOURCE")

@unittest.skipUnless(SOURCE,"Requires original LilyPond Emmentaler")
class G22Proposals(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.ttf,cls.meta=build(
            SOURCE,Path(cls.temp.name)/"candidate.ttf")
        cls.font=TTFont(cls.ttf)
        cls.source=TTFont(SOURCE)

    @classmethod
    def tearDownClass(cls):
        cls.font.close()
        cls.source.close()
        cls.temp.cleanup()

    def test_exact_sixteen_unique_proposals_in_two_separate_families(self):
        self.assertEqual(len(CATALOGUE),16)
        self.assertEqual(set(self.meta["glyphs"]),{c.key for c in CATALOGUE})
        self.assertEqual(set(c.mode for c in CATALOGUE),{"A","B"})
        self.assertEqual(set(c.direction for c in CATALOGUE),{"up","down"})
        self.assertEqual(set(self.font.getBestCmap()),
                         {0x20,*range(PUA_START,PUA_START+16)})
        self.assertEqual(len(set(c.codepoint for c in CATALOGUE)),16)
        self.assertTrue(all(c.codepoint>=0xF0000 for c in CATALOGUE))

    def test_proposals_have_exacts_fractional_values(self):
        for c in CATALOGUE:
            record=self.meta["glyphs"][c.key]
            expected=Fraction(c.numerator,c.denominator)
            self.assertEqual(Fraction(**{
                "numerator":record["tone_fraction"]["numerator"],
                "denominator":record["tone_fraction"]["denominator"]
            }),expected)
            v=record["exact_cents"]
            self.assertEqual(Fraction(v["numerator"],v["denominator"]),
                             200*expected)
            self.assertEqual(record["profile"],PROFILE)
            self.assertIsNone(record["smufl"])
            self.assertEqual(record["status"],
                             "G2_2_CANDIDATE_NOT_APPROVED")

    def test_no_one_bar_quarter_lookalike_is_rebranded_as_eighth(self):
        self.assertIn("quarter tone +50c historically",
                      self.meta["historical_one_beam_quarter_warning"])
        self.assertFalse(self.meta["approved"])
        self.assertEqual(self.meta["status"],
                         "CANDIDATES_VISUAL_REVIEW_PENDING")
        self.assertFalse(any(
            entry["upstream_base"]=="accidentals.sharp.slash.stem"
            and entry["geometry"]["mark_geometry"]["auxiliary_strokes"]==0
            for entry in self.meta["glyphs"].values()
        ))
        self.assertTrue(self.meta["collision_policy"])

    def test_all_glyphs_really_derived_from_lilypond_and_modified(self):
        sources=set(self.source.getGlyphOrder())
        for c in CATALOGUE:
            self.assertIn(c.source,sources)
            result=self.font["glyf"][c.key]
            base,_advance,_meta=_extract_mother(self.source,c.source)
            self.assertGreater(
                result.numberOfContours,base.numberOfContours,c.key
            )
            record=self.meta["glyphs"][c.key]
            dims=record["geometry"]
            raw=dims["source_bbox"]
            original_width=(raw[2]-raw[0])*dims["scale"]
            self.assertGreater(
                result.xMax-result.xMin,original_width,c.key
            )
            self.assertEqual(record["upstream_base"],c.source)
            self.assertTrue(record["geometry"]["operation"].startswith(
                "source-outlines-plus-original"
            ))

    def test_diff_fractions_have_nonidentical_stroke_patterns(self):
        for mode in ("A","B"):
            for direction in ("up","down"):
                records=[
                    self.meta["glyphs"][f"{mode.lower()}_{s}_{direction}"]
                    for s in ("twelfth","eighth","sixth","three_eighths")
                ]
                signatures=[
                    (r["geometry"]["mark_geometry"]["auxiliary_strokes"],
                     r["geometry"]["mark_geometry"]["semantic_rank"])
                    for r in records
                ]
                self.assertEqual(len(set(signatures)),4)
                self.assertEqual([r["geometry"]["mark_geometry"]["semantic_rank"]
                                  for r in records],[1,2,3,4])
        self.assertEqual(
            self.meta["glyphs"]["a_eighth_up"]["geometry"]["mark_geometry"]
            ["auxiliary_strokes"],2)
        self.assertEqual(
            self.meta["glyphs"]["b_eighth_up"]["geometry"]["mark_geometry"]
            ["auxiliary_strokes"],1)

    def test_retains_upstream_license_and_avoids_smufl_collision(self):
        self.assertIn("GPL",self.meta["license"])
        self.assertIn("LilyPond",self.meta["base_project"])
        self.assertEqual(len(self.meta["base_sha256"]),64)
        self.assertIn("Copyright",self.font["name"].getDebugName(0))
        self.assertEqual(self.font["head"].unitsPerEm,1000)
        legal=(Path(__file__).parent/"upstream"/"LICENSE").read_text()
        self.assertIn("font is dual-licensed",legal)
        self.assertIn("embed this font",legal)

    def test_examples_do_not_install_source_font_or_release_ttf(self):
        directory=Path(__file__).parent
        self.assertFalse(list(directory.glob("*.otf")))
        self.assertFalse(list(directory.glob("*.ttf")))
        self.assertTrue(self.ttf.exists())
        self.assertFalse(self.meta["approved"])

if __name__=="__main__":
    unittest.main()
