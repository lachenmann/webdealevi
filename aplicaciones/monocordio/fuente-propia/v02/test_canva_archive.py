# SPDX-License-Identifier: GPL-3.0-or-later
"""G2.2: bitwise-preserved author-supplied Canva SVG sources and exact mapping.

Do not run the Canva generator over the tracked sources. Use a fresh copy in
TemporaryDirectory; it writes both TTF and the 13 SVG outputs in place.
"""
from __future__ import annotations

import csv
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from fractions import Fraction
from pathlib import Path

from fontTools.ttLib import TTFont


ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/"propuestas-canva"/"alevi-v02"
GLYPH_SVGS=[
    "accidentalSharp.svg","accidentalFlat.svg",
    "accidentalNatural.svg","accidentalDoubleSharp.svg",
    "accidentalDoubleFlat.svg","toneQuarterUp.svg",
    "toneQuarterDown.svg","toneSixthUp.svg","toneSixthDown.svg",
    "toneEighthUp.svg","toneEighthDown.svg",
    "toneTwelfthUp.svg","toneTwelfthDown.svg"
]
ORIGINAL_HASHES={
    "construir.py":"0c7852ce43ad54b380f5aea40b8685d51a39ddd9e640cbbd917a647ca14917e7",
    "base-v01.json":"18285947d5e93df3a0a5ed160dedfb9c2a888577a75779477651bcb54ebab6d3",
    "LEEME.txt":"ca8f8e7b16e40b8f2d1ec8a7f7c89c3238742418833974158899209e91173b55",
    "mapa.csv":"1e435b40ac9f117329f58b42dfe83b537442a113c5c03a61032cb92c260fdf43",
    "accidentalDoubleFlat.svg":"f787d367468d10b656d6f648c641d110137295e4df52f96c34ab57a69bc638f7",
    "accidentalDoubleSharp.svg":"ea2cb9a3dfd3f92126aa8f32fd066a81d689e3dd9448133473405db08be6aa04",
    "accidentalFlat.svg":"41edc44528d6b65bc88839e37d6d733c2386defc0ba1911bf820445f649cc464",
    "accidentalNatural.svg":"d28acaed95d67c27dfbbcca4fe9751ace3c8ae2b2c7ee5581e9c575b045c28b1",
    "accidentalSharp.svg":"07e86c41f52c24b667a44bc445e03322e83358ba013dabddf00fd97c460f82cf",
    "toneEighthDown.svg":"e8da179e7b44d91958d438d02db3528d1b131c5d1eab1baee4ec42f4ad162047",
    "toneEighthUp.svg":"b19e74bb26e56b3f34eacf41053ad65b89e1c504c32148e59099a88afa0bf3b5",
    "toneQuarterDown.svg":"bb5f0c050c9cdcb4b76557529549c6cd293fb3a498a796c1bd7b62d8a339e13f",
    "toneQuarterUp.svg":"a39b3dd21f8cf149b237866eb9f8116d79f2b69b2d633dda08dc3973ae5dd216",
    "toneSixthDown.svg":"5b239de8dc818ebce6889f79607e3e8612cdfa2038c587a54521a3c2290dbc13",
    "toneSixthUp.svg":"ecbc3be1071acc8917ffa0552fa7f9f67eb109810f9beaca7efa612e0e726d7b",
    "toneTwelfthDown.svg":"840bf9a04452fd1131edc531c44c80b3c48087ae7a79252446731ff6251fb794",
    "toneTwelfthUp.svg":"13fcf60b00f51686a6bb769386f26dc4d78de6e873b4ca8229c1b2f7db0d988f",
}


def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class CanvaArchiveQA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory(prefix="esferas-canva-")
        cls.work=Path(cls.temp.name)/"canva"
        shutil.copytree(SOURCE,cls.work)
        run=subprocess.run(
            [sys.executable,str(cls.work/"construir.py")],
            cwd=cls.work,capture_output=True,text=True,timeout=35
        )
        if run.returncode!=0:
            raise AssertionError("El generador no se recompiló: "+run.stderr)
        cls.stdout=run.stdout
        cls.font=TTFont(cls.work/"AleviMicrotonal-Regular.ttf")
        cls.registry=json.loads((SOURCE/"REGISTRO_CANVA_NMA_v0.2.json").read_text())

    @classmethod
    def tearDownClass(cls):
        cls.font.close()
        cls.temp.cleanup()

    def test_original_source_bytes_unchanged(self):
        self.assertEqual(len(ORIGINAL_HASHES),17)
        for filename,digest in ORIGINAL_HASHES.items():
            self.assertEqual(sha(SOURCE/filename),digest,filename)

    def test_all_thirteen_svg_paths_reproduced_byte_for_byte(self):
        self.assertEqual(len(GLYPH_SVGS),13)
        for name in GLYPH_SVGS:
            self.assertEqual((SOURCE/name).read_bytes(),
                             (self.work/name).read_bytes(),name)
        self.assertTrue((self.work/"muestra-microtonal.svg").is_file())
        self.assertEqual(sha(self.work/"mapa.csv"),sha(SOURCE/"mapa.csv"))
        self.assertEqual(sha(self.work/"LEEME.txt"),sha(SOURCE/"LEEME.txt"))

    def test_generated_ttf_is_true_type_not_a_web_assumption(self):
        self.assertEqual((self.work/"AleviMicrotonal-Regular.ttf").read_bytes()[:4],
                         b"\x00\x01\x00\x00")
        self.assertEqual(self.font["head"].unitsPerEm,1000)
        glyph_order=self.font.getGlyphOrder()
        self.assertEqual(len(glyph_order),15)
        for name in (Path(x).stem for x in GLYPH_SVGS):
            self.assertIn(name,glyph_order)
            self.assertGreater(self.font["glyf"][name].numberOfContours,0)
        self.assertIn("Verificados 13 glifos",self.stdout)

    def test_eight_private_study_codepoints_and_exact_integer_registry(self):
        cmap=self.font.getBestCmap()
        self.assertEqual(set(range(0xF000,0xF008)) & set(cmap),
                         set(range(0xF000,0xF008)))
        entries=self.registry["entries"]
        self.assertEqual(len(entries),8)
        for entry in entries:
            glyph=entry["id"]
            code=int(entry["source_private_codepoint"][2:],16)
            self.assertEqual(cmap[code],glyph)
            f=entry["tone_fraction"]
            cents=entry["cents_exact"]
            exact=Fraction(f["numerator"],f["denominator"])*200
            self.assertEqual(exact,Fraction(cents["numerator"],cents["denominator"]))
            self.assertIsNone(entry["standard_smufl_codepoint"])

    def test_source_csv_rounded_values_are_not_semantic_canonical(self):
        with (SOURCE/"mapa.csv").open(newline="",encoding="utf-8") as handle:
            rows=list(csv.DictReader(handle))
        self.assertEqual(len(rows),8)
        by_id={row["glifo"]:row for row in rows}
        for entry in self.registry["entries"]:
            observed=float(by_id[entry["id"]]["cents"])
            exact=entry["cents_exact"]
            expected=Fraction(exact["numerator"],exact["denominator"])
            self.assertLess(abs(observed-float(expected)),1e-9)

    def test_conflicts_cannot_be_auto_published_as_standard(self):
        self.assertEqual(self.registry["state"],
                         "INTEGRATED_AS_DESIGN_CANDIDATES_NOT_PUBLISHED")
        self.assertEqual(self.registry["source_license"],
                         "NOT_SPECIFIED_IN_ARCHIVE_REQUIRES_REVIEW")
        states={e["id"]:e["adoption_state"] for e in self.registry["entries"]}
        self.assertEqual(states["toneQuarterDown"],"blocked-closed-reversed-flat")
        self.assertEqual(states["toneSixthUp"],"blocked-historical-near-collision")
        self.assertEqual(states["toneSixthDown"],"needs-visual-distinction")
        self.assertFalse(any(e["standard_smufl_codepoint"] for e in
                             self.registry["entries"]))

    def test_does_not_replace_approved_lilypond_mothers(self):
        # These source files are a separate visual study, not the canonical G1.
        self.assertTrue((ROOT/"build_lilypond_mothers.py").exists())
        self.assertTrue((ROOT/"build_lilypond_g2.py").exists())
        self.assertNotEqual(self.registry["traditional_base"],
                            "GNU LilyPond/Emmentaler G1")


if __name__=="__main__":
    unittest.main()
