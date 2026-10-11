#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Esferas Microtonal v0.2: build three ORIGINAL mother glyphs.

Only the flat, sharp and natural are built. The glyphs are independently
constructed from documented parametric vector strokes, not extracted from
Leland, Bravura, MIDIDESI, or any other font. No descendant form is approved.

Coordinates use UPM=1000, staff-space s=250. Bottom at y<0, up at y>0.
Uses no external source-font or copyrighted font assets.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
import json
import math

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
STAFF_SPACE = 250
# All strokes are measured in *font units*; values are within design QA ranges.
MAIN_STROKE = 25
CROSS_STROKE = 20
CURVE_STROKE = 23
ADVANCES = {"flat": 510, "natural": 535, "sharp": 555}
CODES = {"flat": 0xE260, "natural": 0xE261, "sharp": 0xE262}
BASE_STROKES = {
    "flat": ("B_V", "B_CURVE_R", "B_OPEN"),
    "natural": ("N_VL", "N_VR", "N_HS", "N_HI"),
    "sharp": ("V_L", "V_R", "H_S", "H_I"),
}

@dataclass(frozen=True)
class VectorStroke:
    """Documented geometry, separately defined from semantic cent value."""
    name: str
    segments: tuple[tuple[float,float], ...]
    width: int


def polygon(pen: TTGlyphPen, points):
    pts = [(round(x), round(y)) for x, y in points]
    if len(set(pts)) < 3:
        raise ValueError("degenerate contour")
    pen.moveTo(pts[0])
    for point in pts[1:]:
        pen.lineTo(point)
    pen.closePath()


def line_with_optical_ends(pen, p0, p1, thickness: int,
                           end_contrast: float=0.92):
    """Closed independent stroke; lightened ends avoid slab-like tips."""
    (x0,y0),(x1,y1)=p0,p1
    dx,dy=x1-x0,y1-y0
    length=math.hypot(dx,dy)
    if length < 1:
        raise ValueError("stroke cannot be zero-length")
    nx,ny=-dy/length,dx/length
    # tapered terminals with tiny optical compensation, not squared blocks
    w0=thickness*end_contrast/2
    w1=thickness/2
    points=[
        (x0+nx*w0,y0+ny*w0),
        (x1+nx*w1,y1+ny*w1),
        (x1-nx*w1,y1-ny*w1),
        (x0-nx*w0,y0-ny*w0),
    ]
    polygon(pen,points)


def cubic(p0,p1,p2,p3,n=24):
    for i in range(n+1):
        t=i/n; q=1-t
        yield (
            q*q*q*p0[0]+3*q*q*t*p1[0]+3*q*t*t*p2[0]+t*t*t*p3[0],
            q*q*q*p0[1]+3*q*q*t*p1[1]+3*q*t*t*p2[1]+t*t*t*p3[1],
        )


def ribbon_outline(pen,points,thickness=CURVE_STROKE):
    """Single smooth, thin *OPEN*-looking stroke with closed ink outline.

    The cubic centerline is sampled at enough steps for lossless viewing at
    music-engraving sizes; the body is offset to both sides and closed into
    one filled outline. The glyph's counterform remains visibly open.
    """
    pts=list(points)
    if len(pts)<4: raise ValueError("insufficient curve samples")
    left=[];right=[]
    for i,(x,y) in enumerate(pts):
        before=pts[max(0,i-1)]
        after=pts[min(i+1,len(pts)-1)]
        dx=after[0]-before[0];dy=after[1]-before[1]
        dist=math.hypot(dx,dy)
        if dist < 1e-7:
            raise ValueError("curve collapsed")
        nx,ny=-dy/dist,dx/dist
        taper=0.80+0.2*math.sin(math.pi*i/(len(pts)-1))**0.55
        left.append((x+nx*thickness*taper/2,y+ny*thickness*taper/2))
        right.append((x-nx*thickness*taper/2,y-ny*thickness*taper/2))
    polygon(pen,left+right[::-1])


def draw_flat(pen):
    # Thin upright to a small curved, OPEN bowl to the right (not a solid b).
    # This is an original curve, not traced from historic font contours.
    line_with_optical_ends(pen,(183,-146),(191,624),MAIN_STROKE)
    top=(189,264)
    middle=(388,164)
    bottom=(197,-138)
    a=list(cubic(top,(306,333),(423,317),middle,n=22))
    b=list(cubic(middle,(365,62),(275,-116),bottom,n=27))
    ribbon_outline(pen,a+b[1:],CURVE_STROKE)


def draw_sharp(pen):
    # Vertical stems almost upright, optically shifted at extremes.
    line_with_optical_ends(pen,(192,-160),(210,543),MAIN_STROKE)
    line_with_optical_ends(pen,(332,-160),(350,543),MAIN_STROKE)
    # Diagonal crossbars hold a shared rake but no bulky filled plates.
    line_with_optical_ends(pen,(132,103),(412,165),CROSS_STROKE)
    line_with_optical_ends(pen,(132,328),(412,390),CROSS_STROKE)


def draw_natural(pen):
    # Correct ♮ has two *unequally placed* upright stems, NOT an H.
    # The left extends high, the right down; two tilted crossbars separated.
    line_with_optical_ends(pen,(188,-74),(198,579),MAIN_STROKE)
    line_with_optical_ends(pen,(350,-205),(360,452),MAIN_STROKE)
    line_with_optical_ends(pen,(196,291),(356,337),CROSS_STROKE)
    line_with_optical_ends(pen,(192,74),(352,120),CROSS_STROKE)


def build_glyph(name):
    pen=TTGlyphPen(None)
    if name==".notdef":
        for p0,p1 in [((130,-120),(440,-120)),((130,550),(440,550)),
                      ((130,-120),(130,550)),((440,-120),(440,550))]:
            line_with_optical_ends(pen,p0,p1,MAIN_STROKE)
    elif name=="space":
        pass
    else:
        {"flat":draw_flat, "natural":draw_natural,
         "sharp":draw_sharp}[name](pen)
    return pen.glyph()


def build(out:Path)->Path:
    out.parent.mkdir(parents=True,exist_ok=True)
    glyphs=[".notdef","space","flat","natural","sharp"]
    fb=FontBuilder(UPM,isTTF=True)
    fb.setupGlyphOrder(glyphs)
    fb.setupCharacterMap({0x20:"space",**{v:k for k,v in CODES.items()}})
    fb.setupGlyf({g:build_glyph(g) for g in glyphs})
    fb.setupHorizontalMetrics({g:(ADVANCES.get(g,500),0) for g in glyphs})
    fb.setupHorizontalHeader(ascent=800,descent=-260)
    fb.setupNameTable({
      "familyName":"Esferas Microtonal v02 Study",
      "styleName":"Regular",
      "uniqueFontIdentifier":"EsferasMicrotonal-v02-Study-0.2.0",
      "fullName":"Esferas Microtonal v02 Study Regular",
      "psName":"EsferasMicrotonalV02Study-Regular",
      "version":"Version 0.200",
      "description":"Three originally drawn mother accidentals; not approved for publication"
    })
    fb.setupOS2(sTypoAscender=800,sTypoDescender=-260,sTypoLineGap=0,
                usWinAscent=800,usWinDescent=260,
                sxHeight=390,sCapHeight=620)
    fb.setupPost()
    fb.setupMaxp()
    fb.save(out)
    return out


def manifest():
    return {
      "type":"typographic-study", "stage":"G1-mother-glyphs",
      "edition":"0.2-draft", "approved":False,
      "upm":UPM,"staff_space_units":STAFF_SPACE,
      "stroke_units":{"main":MAIN_STROKE,"cross":CROSS_STROKE,
                      "curve":CURVE_STROKE},
      "source":"independent-geometry-not-copied-from-existing-fonts",
      "semantics":"visual-forms-only; cent values belong to notation profiles",
      "glyphs":[{"id":g,"smufl_codepoint":f"U+{cp:04X}",
                  "primitives":list(BASE_STROKES[g]),
                  "advance_units":ADVANCES[g]}
                for g,cp in CODES.items()]
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--out",default="build/EsferasMicrotonal-Mothers-v02.ttf")
    args=parser.parse_args()
    path=build(Path(args.out))
    info=path.with_suffix(".json")
    info.write_text(json.dumps(manifest(),ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Built",path,"bytes=",path.stat().st_size)
    print("Manifest",info)


if __name__=="__main__":main()
