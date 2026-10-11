# SPDX-License-Identifier: GPL-3.0-or-later
"""G1: shape, width, licensing separation, stable original source metadata."""
from __future__ import annotations
import math
import tempfile
import unittest
from pathlib import Path
from fontTools.ttLib import TTFont
from build_mothers import (ADVANCES, BASE_STROKES, CODES, STAFF_SPACE,
                           MAIN_STROKE, CROSS_STROKE, CURVE_STROKE,
                           build, manifest)

class ThreeMotherGlyphTests(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.folder=tempfile.TemporaryDirectory()
    cls.path=build(Path(cls.folder.name)/'mothers.ttf')
    cls.font=TTFont(cls.path)
  @classmethod
  def tearDownClass(cls):
    cls.font.close(); cls.folder.cleanup()

  def test_exact_smufl_ids_and_only_three_mothers(self):
    self.assertEqual(CODES, {'flat':0xE260,'natural':0xE261,'sharp':0xE262})
    cmap=self.font.getBestCmap()
    self.assertEqual(set(cmap),{32,0xE260,0xE261,0xE262})
    for n,cp in CODES.items():self.assertEqual(cmap[cp],n)

  def test_true_type_tables_and_license_provenance(self):
    self.assertEqual(self.path.read_bytes()[:4],b'\x00\x01\x00\x00')
    for k in ['head','hhea','maxp','hmtx','cmap','loca','glyf','name','OS/2','post']:
      self.assertIn(k,self.font)
    self.assertEqual(self.font['head'].unitsPerEm,1000)
    self.assertEqual(STAFF_SPACE,250)
    d=manifest()
    self.assertFalse(d['approved'])
    self.assertEqual(d['stage'],'G1-mother-glyphs')
    self.assertIn('independent',d['source'])
    self.assertIn('visual-forms-only',d['semantics'])

  def test_line_weights_follow_m01_m02(self):
    self.assertTrue(.08<=MAIN_STROKE/STAFF_SPACE<=.12)
    self.assertTrue(.055<=CROSS_STROKE/STAFF_SPACE<=.09)
    self.assertTrue(.055<=CURVE_STROKE/STAFF_SPACE<=.12)
    self.assertLess(CROSS_STROKE,MAIN_STROKE)

  def test_stroke_topology_matches_mother_grammars(self):
    self.assertEqual(BASE_STROKES['natural'],('N_VL','N_VR','N_HS','N_HI'))
    self.assertEqual(BASE_STROKES['sharp'],('V_L','V_R','H_S','H_I'))
    self.assertEqual(BASE_STROKES['flat'],('B_V','B_CURVE_R','B_OPEN'))
    outlines=self.font['glyf']
    self.assertEqual(outlines['sharp'].numberOfContours,4)
    self.assertEqual(outlines['natural'].numberOfContours,4)
    self.assertEqual(outlines['flat'].numberOfContours,2)

  def test_becuadro_is_not_two_equal_posts(self):
    n=self.font['glyf']['natural']
    # Mother design has two offset posts; glyph bbox extends beyond both.
    self.assertLess(n.yMin,-160)
    self.assertGreater(n.yMax,550)
    self.assertLess(n.xMin,210)
    self.assertGreater(n.xMax,340)
    self.assertGreater(n.numberOfContours,2)

  def test_original_ink_has_narrow_visual_weight(self):
    shapes=self.font['glyf'];
    for n in CODES:
      g=shapes[n]
      self.assertGreater(g.numberOfContours,0)
      self.assertGreater(g.xMax-g.xMin,150)
      self.assertLess(g.xMax-g.xMin,400)
      self.assertLess(g.yMax-g.yMin,850)
      self.assertGreater(g.yMax-g.yMin,590)
      self.assertLess(self.font['hmtx'][n][0],600)
      self.assertEqual(self.font['hmtx'][n][0],ADVANCES[n])

  def test_g1_not_a_complete_microtonal_font(self):
    self.assertTrue(all(v not in self.font.getBestCmap() for v in
                    [0xE280,0xE282,0xF0001,0xF0002]))
    self.assertNotIn('sixth_up',self.font.getGlyphOrder())

if __name__=='__main__':unittest.main()
