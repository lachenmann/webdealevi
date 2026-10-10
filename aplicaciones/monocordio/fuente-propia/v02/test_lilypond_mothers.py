# SPDX-License-Identifier: GPL-3.0-or-later
"""The LilyPond mothers MUST be genuine attributed source-derived contours."""
from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

from build_lilypond_mothers import (
    MOTHERS, COPYRIGHT, UPM, build,
)

SOURCE = os.environ.get("LILYPOND_FONT_SOURCE")


@unittest.skipUnless(SOURCE, "Se requiere variable LILYPOND_FONT_SOURCE")
class UpstreamDerivationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not Path(SOURCE).is_file():
            raise FileNotFoundError(SOURCE)
        cls.tmp = tempfile.TemporaryDirectory()
        cls.path, cls.report = build(
            SOURCE, Path(cls.tmp.name) / "LilyPond-G1-study.ttf")
        cls.font = TTFont(cls.path)
        cls.source = TTFont(SOURCE)

    @classmethod
    def tearDownClass(cls):
        cls.font.close()
        cls.source.close()
        cls.tmp.cleanup()

    def test_provenance_is_explicit(self):
        self.assertEqual(self.report["status"],
                         "LILY_POND_DERIVATIVE_MOTHERS_G1_REVIEW_ONLY")
        self.assertTrue(self.report["outlines_transformed"])
        self.assertTrue(self.report["not_smufl_native"])
        self.assertIn("LilyPond", self.report["source_project"])
        self.assertIn("GNU GPL", self.report["source_license_choice"])
        self.assertEqual(len(self.report["source_sha256"]),64)
        self.assertEqual(self.report["upstream_font_filename"],
                         Path(SOURCE).name)
        self.assertEqual(self.report["upstream_copyright_preserved"],
                         COPYRIGHT)

    def test_only_three_mothers_and_correct_smufl_remapping(self):
        self.assertEqual(
            MOTHERS,
            {
                "flat":("accidentals.flat",0xE260),
                "natural":("accidentals.natural",0xE261),
                "sharp":("accidentals.sharp",0xE262),
            })
        cmap = self.font.getBestCmap()
        self.assertEqual(set(cmap),{0x20,0xE260,0xE261,0xE262})
        for glyph, (upstream_name, cp) in MOTHERS.items():
            self.assertIn(upstream_name, self.source.getGlyphSet())
            self.assertEqual(cmap[cp],glyph)
            self.assertEqual(
                self.report["glyphs"][glyph]["source_name"],upstream_name)

    def test_derived_contours_follow_exact_upstream_bounds(self):
        source_glyphs=self.source.getGlyphSet()
        generated_glyphs=self.font.getGlyphSet()
        for glyph, (original_name, _) in MOTHERS.items():
            old=BoundsPen(source_glyphs)
            source_glyphs[original_name].draw(old)
            new=BoundsPen(generated_glyphs)
            generated_glyphs[glyph].draw(new)
            self.assertIsNotNone(old.bounds)
            self.assertIsNotNone(new.bounds)
            scale=self.report["glyphs"][glyph]["scale"]
            xoff=self.report["glyphs"][glyph]["offset_x"]
            yoff=self.report["glyphs"][glyph]["offset_y"]
            for got, expected in zip(
                new.bounds,
                (
                    old.bounds[0]*scale+xoff,
                    old.bounds[1]*scale+yoff,
                    old.bounds[2]*scale+xoff,
                    old.bounds[3]*scale+yoff,
                ),
            ):
                # Cubic-to-quadratic conversion + integer coordinate rounding.
                self.assertAlmostEqual(got, expected, delta=2.5)

    def test_true_type_tables(self):
        self.assertEqual(self.path.read_bytes()[:4],b"\x00\x01\x00\x00")
        self.assertEqual(self.font["head"].unitsPerEm,UPM)
        for name in ("head","hhea","maxp","hmtx","cmap","glyf","loca",
                     "name","OS/2","post"):
            self.assertIn(name,self.font)
        for name in MOTHERS:
            self.assertGreater(self.font["glyf"][name].numberOfContours,0)
            self.assertGreater(self.font["hmtx"][name][0],0)

    def test_preserved_lilypond_notice_and_exception(self):
        path=Path(__file__).parent / "upstream" / "LICENSE"
        text=path.read_text(encoding="utf8")
        self.assertIn("font is dual-licensed",text)
        self.assertIn("GNU General Public License",text)
        self.assertIn("embed this font",text)
        self.assertIn("The LilyPond authors", 
                      (Path(__file__).parent/"upstream"/"LICENSE-OFL").
                      read_text(encoding="utf8"))
        family=self.font["name"].getDebugName(1)
        self.assertEqual(family,"Esferas Microtonal LilyPond Study")
        self.assertNotIn(family,("Emmentaler","Feta"))

    def test_no_third_party_binary_committed(self):
        repo_folder=Path(__file__).parent
        self.assertFalse(list(repo_folder.glob("*.ttf")))
        self.assertFalse(list(repo_folder.glob("*.otf")))


if __name__ == "__main__":
    unittest.main()
