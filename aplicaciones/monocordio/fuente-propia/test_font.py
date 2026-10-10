"""Verificaciones del constructor de Esferas Microtonal (sin fonts externas)."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from fontTools.ttLib import TTFont
from build_font import ADVANCE, CODES, RATIOS, UPM, build, manifest


class OriginalFontTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.output = build(Path(cls.tmp.name) / "EsferasMicrotonal.ttf")
        cls.font = TTFont(cls.output)
        cls.cmap = cls.font.getBestCmap()

    @classmethod
    def tearDownClass(cls):
        cls.font.close()
        cls.tmp.cleanup()

    def test_true_type_binary(self):
        self.assertEqual(self.output.read_bytes()[:4], b"\x00\x01\x00\x00")
        self.assertGreater(self.output.stat().st_size, 1000)
        self.assertEqual(self.font["head"].unitsPerEm, UPM)

    def test_semantics_and_codepoints(self):
        self.assertEqual(len(CODES), 11)
        self.assertEqual(len(set(CODES.values())),len(CODES))
        for glyph, code in CODES.items():
            self.assertEqual(self.cmap[code], glyph)
            self.assertTrue(glyph in self.font.getGlyphOrder())

    def test_smufl_standard_symbols(self):
        for glyph, code in (
            ("flat",0xE260), ("natural",0xE261), ("sharp",0xE262),
            ("quarter_flat_stein",0xE280), ("quarter_sharp_stein",0xE282)
        ):
            self.assertEqual(CODES[glyph], code)

    def test_private_extensions_not_confused_with_standard(self):
        for glyph in ("sixth_down","sixth_up","eighth_down","eighth_up",
                      "twelfth_down","twelfth_up"):
            self.assertGreaterEqual(CODES[glyph],0xF0000)
            self.assertLess(CODES[glyph],0xFFFFE)

    def test_all_outlines_exist(self):
        glyf = self.font["glyf"]
        for name in CODES:
            outline=glyf[name]
            self.assertTrue(outline.numberOfContours > 0, name)
            self.assertLess(outline.xMin,outline.xMax)
            self.assertLess(outline.yMin,outline.yMax)
            self.assertGreaterEqual(self.font["hmtx"][name][0],ADVANCE)

    def test_tone_fractions_are_exact(self):
        self.assertEqual(RATIOS["sixth_up"],(1,6))
        self.assertEqual(RATIOS["eighth_down"],(-1,8))
        self.assertEqual(RATIOS["twelfth_up"],(1,12))
        self.assertEqual(RATIOS["quarter_flat_stein"],(-1,4))
        metadata=manifest()
        self.assertEqual(len(metadata["glyphs"]), 11)
        for record in metadata["glyphs"]:
            p,q=RATIOS[record["name"]]
            self.assertEqual(record["centsNumerator"],p*200)
            self.assertEqual(record["centsDenominator"],q)
            self.assertEqual(record["fractionOfWholeTone"],f"{p}/{q}")

    def test_compliant_tables(self):
        for tag in ["head","hhea","maxp","hmtx","cmap","loca",
                    "glyf","name","OS/2","post"]:
            self.assertIn(tag,self.font)
        self.assertEqual(self.font["OS/2"].sTypoAscender,840)

if __name__=="__main__":
    unittest.main()
