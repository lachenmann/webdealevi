#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Render real Emmentaler/Feta glyphs, avoiding faux artistic substitutes."""
from __future__ import annotations

import argparse
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from build_lilypond_g2 import CATALOGUE

BG="#F4F0E8";CARD="#FFFFFF";INK="#29232B";MUTED="#676068";EDGE="#C8B9A8"
GOLD="#9A704D";GREEN="#1B6756";WARNING="#A05539"
W,H=1640,1440
NAMES={
 "flat":("Bemol","−½ tono"),
 "quarter_flat_stein":("Bemol inverso","−¼ tono"),
 "three_quarters_flat_lilypond":("Tres cuartos (LilyPond)","−¾ tono · estudio"),
 "natural":("Becuadro","cancelación contextual"),
 "sharp":("Sostenido","+½ tono"),
 "quarter_sharp_stein":("Medio sostenido","+¼ tono"),
 "three_quarters_sharp_stein":("Sostenido 3/4","+¾ tono"),
 "quarter_sharp_one_beam_lilypond":("Un travesaño histórico","+¼ tono, NO +⅛"),
}
ORDER=[
 "flat","natural","sharp","quarter_sharp_stein",
 "quarter_flat_stein","three_quarters_sharp_stein",
 "three_quarters_flat_lilypond","quarter_sharp_one_beam_lilypond"
]


def normal_font(size:int):
  for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
               "/System/Library/Fonts/Supplemental/Arial.ttf"):
    try:return ImageFont.truetype(path,size)
    except OSError:continue
  return ImageFont.load_default()


def music_font(file_path:Path,size:int):
  return ImageFont.truetype(str(file_path),size)


def line_staff(d,x1,x2,center,s):
  for idx in range(-2,3):
    y=center+idx*s
    d.line([(x1,y),(x2,y)],fill=EDGE,width=1)


def label(d,string,x,y,size=16,color=INK):
  d.text((x,y),string,font=normal_font(size),fill=color)


def show(font_path:Path, manifest:dict, out:Path):
  image=Image.new("RGB",(W,H),BG);d=ImageDraw.Draw(image)
  label(d,"ESFERAS MICROTONAL v0.2  ·  G2",46,32,31)
  label(d,"Variantes derivadas de GNU LilyPond / Emmentaler",46,80,20,GOLD)
  label(d,"Valores de ejemplo solo bajo el perfil de tono temperado = 200 cents.",46,113,15,MUTED)
  label(d,"No hay octavo de tono codificado en este primer estudio G2.",46,136,15,WARNING)

  for index,name in enumerate(ORDER):
    spec=CATALOGUE[name]
    row,col=divmod(index,4)
    x=40+col*402
    y=190+row*508
    w,h=386,486
    d.rounded_rectangle((x,y,x+w,y+h),radius=14,fill=CARD,outline=EDGE,width=2)
    title,desc=NAMES[name]
    label(d,title,x+18,y+18,21,INK)
    label(d,desc,x+18,y+52,16,
          WARNING if spec.approval=="HISTORICAL_REFERENCE_ONLY" else GREEN)
    label(d,f"{manifest['glyphs'][name]['glyph_codepoint']}",x+18,y+82,13,MUTED)
    # Main contour shown at 145px without generated or simulated shapes.
    big=music_font(font_path,176)
    d.text((x+167,y+288),chr(spec.codepoint),font=big,fill=INK,anchor='ls')
    d.line((x+22,y+308,x+w-22,y+308),fill=EDGE,width=1)
    label(d,"En pauta de 14 px por espacio",x+19,y+323,14,MUTED)
    staff_y=y+410
    line_staff(d,x+18,x+w-18,staff_y,14)
    small=music_font(font_path,61)
    d.text((x+100,staff_y),chr(spec.codepoint),font=small,fill=INK,anchor='ls')
    # Note marker independently constructed, not copied from glyph repertoire.
    head_x=x+249
    d.ellipse((head_x-9,staff_y-6,head_x+9,staff_y+6),fill=INK)
    d.line((head_x+9,staff_y,head_x+9,staff_y-42),fill=INK,width=2)

  label(d,"INTERPRETACIÓN DE LA LÁMINA",46,1240,24,INK)
  label(d,"Los ocho diseños proceden de LilyPond. Los códigos privados F0020 y F0021",
        48,1282,16,MUTED)
  label(d,"son marcadores de estudio, NO códigos SMuFL. La fuente será libre bajo GPL y excepción.",
        48,1310,16,MUTED)
  label(d,"Especial atención: el signo de una barra es históricamente MEDIO sostenido (+¼), no +⅛.",
        48,1351,16,WARNING)
  out.parent.mkdir(parents=True,exist_ok=True)
  image.save(out)
  print("G2 specimen:",out,image.size)


if __name__=="__main__":
  p=argparse.ArgumentParser()
  p.add_argument("--font",required=True)
  p.add_argument("--out",required=True)
  args=p.parse_args()
  import json
  path=Path(args.font)
  meta=json.loads(path.with_suffix(".json").read_text(encoding="utf8"))
  show(path,meta,Path(args.out))
