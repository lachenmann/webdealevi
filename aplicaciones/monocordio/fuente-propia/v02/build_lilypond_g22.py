#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""EM-G2.2: two PROPOSED lightweight families of nonstandard accidentals.

Only for comparison, not an approved alphabet. Each test glyph uses the actual
Emmentaler quarter-tone outline and new *thin vector strokes* added beside it.
G2.1 historic forms stay unchanged.

Tonal meaning comes from exact fractions of a specifically declared 200-cent
tone, NEVER from the number of drawn marks. Codes U+F0100..F010F are
temporary PUA identifiers local to this source, NOT SMuFL registrations.

Method A (HATCHES): adjacent short slanted strokes, one/two/three, four for
3/8. Method B (FORKS): distinguish fraction by upper/lower/both/long-flag
terminal marks. These strategies must pass visual tests at real staff size.
They are candidate designs, not permanent semantics or historic symbols.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

from build_lilypond_mothers import (
    _find_source_file, _glyph_bbox, COPYRIGHT, SOURCE_LICENSE, SOURCE_PROJECT,
    UPM,
)

PROFILE="nma.tone-12tet.v0"
SOURCE_GLYPHS={
    "up":"accidentals.sharp.slash.stem",
    "down":"accidentals.mirroredflat",
}
# A reference note: the UPSTREAM one-bar glyph has the historical role +1/4
# (half sharp). It is NEVER exported unchanged as an eighth.
DENOMINATORS=(
    ("twelfth",1,12),("eighth",1,8),("sixth",1,6),
    ("three_eighths",3,8)
)
FAMILIES={
    "A":"hatches_of_different_count",
    "B":"forks_of_different_position"
}
# U+F0100..F010F within supplementary private use area A.
PUA_START=0xF0100

@dataclass(frozen=True)
class Candidate:
    key: str
    mode: str
    direction: str
    numerator: int
    denominator: int
    source: str
    codepoint: int

def catalogue():
    result=[]
    for family_index,mode in enumerate(FAMILIES):
        for fraction_index,(name,num,den) in enumerate(DENOMINATORS):
            for sign_index,sign in enumerate(("down","up")):
                ident=f"{mode.lower()}_{name}_{sign}"
                cp=PUA_START+family_index*8+fraction_index*2+sign_index
                result.append(Candidate(
                    key=ident,mode=mode,direction=sign,
                    numerator=-num if sign=="down" else num,
                    denominator=den,source=SOURCE_GLYPHS[sign],
                    codepoint=cp
                ))
    return tuple(result)

CATALOGUE=catalogue()
assert len(CATALOGUE)==16
assert len({c.codepoint for c in CATALOGUE})==16


def _filled_stroke(pen,x0,y0,x1,y1,thickness=18):
    length=math.hypot(x1-x0,y1-y0)
    if length < 1:raise ValueError("Degenerate optical stroke")
    dx=-(y1-y0)*thickness/(2*length)
    dy=(x1-x0)*thickness/(2*length)
    pts=[(round(x0+dx),round(y0+dy)),
         (round(x1+dx),round(y1+dy)),
         (round(x1-dx),round(y1-dy)),
         (round(x0-dx),round(y0-dy))]
    if len(set(pts))<3:raise ValueError("Collapsed ink stroke")
    pen.moveTo(pts[0])
    for p in pts[1:]:pen.lineTo(p)
    pen.closePath()


def _draw_extensions(pen,c:Candidate,base_bounds):
    """Apply source-independent marks using rational-scale staff coordinates.

    All glyph origins retain LilyPond morphology; auxiliary strokes are a new
    work of drawing. No absolute copy of MIDIDESI or Ekmelos glyphs.
    """
    xmin,ymin,xmax,ymax=base_bounds
    center_y=(ymin+ymax)*0.5
    # Decorative information near the sign's RIGHT edge, with enough x room.
    mark_left=xmax+14
    mark_length=112
    middle=center_y-35
    slots={
        "twelfth":1,"eighth":2,"sixth":3,"three_eighths":4
    }
    unit=c.key.removeprefix(c.mode.lower()+"_")
    unit=unit.rsplit("_",1)[0]
    count=slots[unit]
    if c.mode=="A":
        # A: systematic ranking by hatch count. Not additive in cents.
        # Smallest marks ~0.3 of one 250-unit staff space.
        positions={
            1:[0],2:[-80,80],3:[-108,0,108],
            4:[-144,-48,48,144]
        }[count]
        for iy in positions:
            y=middle+iy
            _filled_stroke(pen,mark_left,y,
                           mark_left+mark_length,y+34,27)
    else:
        # B: compact *fork* terminals. Each pattern is differentiated by
        # position/configuration rather than the number of parallel dashes.
        x=mark_left+12
        if unit=="twelfth":
            _filled_stroke(pen,x,middle+45,x+111,middle+126,27)
        elif unit=="eighth":
            _filled_stroke(pen,x,middle-45,x+111,middle-126,27)
        elif unit=="sixth":
            _filled_stroke(pen,x,middle+42,x+111,middle+124,27)
            _filled_stroke(pen,x,middle-42,x+111,middle-124,27)
        elif unit=="three_eighths":
            _filled_stroke(pen,x,middle+42,x+111,middle+124,27)
            _filled_stroke(pen,x,middle-42,x+111,middle-124,27)
            _filled_stroke(pen,x,middle-136,x,middle+136,25)
        else:raise ValueError(unit)
    # Stroke inventory is explicit; ink mass will be measured before approval.
    return {"mode":c.mode,"semantic_rank":count,
            "auxiliary_strokes":count if c.mode=="A" else {1:1,2:1,3:2,4:3}[count],
            "source_bbox":list(base_bounds),
            "left_of_aux_marks":mark_left,
            "mark_height_units":middle}


def _glyph(source:TTFont,c:Candidate):
    glyphset=source.getGlyphSet()
    if c.source not in glyphset:
        raise ValueError(f"LilyPond original missing: {c.source}")
    raw=_glyph_bbox(source,c.source)
    scale=UPM/source["head"].unitsPerEm
    left=58
    dx=left-raw[0]*scale
    pen=TTGlyphPen(None)
    quad=Cu2QuPen(pen,max_err=0.5,reverse_direction=True)
    transform=TransformPen(quad,(scale,0,0,scale,dx,0))
    glyphset[c.source].draw(transform)
    transformed_bounds=(raw[0]*scale+dx,raw[1]*scale,
                        raw[2]*scale+dx,raw[3]*scale)
    marks=_draw_extensions(pen,c,transformed_bounds)
    result=pen.glyph()
    if result.numberOfContours < 2:
        raise ValueError(f"Candidate glyph unexpectedly empty: {c.key}")
    mark_right=marks["left_of_aux_marks"]+156
    advance=math.ceil(max(transformed_bounds[2],mark_right)+72)
    meta={
        "source_glyph":c.source,
        "source_bbox":list(raw),
        "scale":scale,"offset_x":dx,
        "operation":"source-outlines-plus-original-thin-marks",
        "number_of_contours":result.numberOfContours,
        "mark_geometry":marks,
        "advance_units":advance,
        "left_sidebearing":round(transformed_bounds[0]),
        "max_cubic_quadratic_error_units":0.5
    }
    return result,advance,meta


def build(source_path:str|Path,out:str|Path):
    source_path=Path(source_path);out=Path(out)
    sf=TTFont(source_path)
    try:
        order=[".notdef","space"]+[c.key for c in CATALOGUE]
        pen=TTGlyphPen(None)
        pen.moveTo((120,-80));pen.lineTo((120,600))
        pen.lineTo((380,600));pen.lineTo((380,-80));pen.closePath()
        shapes={".notdef":pen.glyph(),"space":TTGlyphPen(None).glyph()}
        metrics={".notdef":(500,120),"space":(220,0)}
        records={}
        for c in CATALOGUE:
            glyph,advance,geo=_glyph(sf,c)
            shapes[c.key]=glyph
            metrics[c.key]=(advance,geo["left_sidebearing"])
            frac=Fraction(c.numerator,c.denominator)
            cents=200*frac
            records[c.key]={
                "status":"G2_2_CANDIDATE_NOT_APPROVED",
                "profile":PROFILE,"direction":c.direction,
                "family":c.mode,"key":c.key,
                "codepoint":f"U+{c.codepoint:04X}",
                "private_use":True,"smufl":None,
                "tone_fraction":{"numerator":frac.numerator,
                                 "denominator":frac.denominator},
                "exact_cents":{"numerator":cents.numerator,
                               "denominator":cents.denominator},
                "upstream_base":c.source,
                "base_semantics":"LilyPond historical quarter-tone glyph",
                "candidate_semantics":"registered fraction; no claim of international standard",
                "geometry":geo,
            }
        source_notice=sf["name"].getDebugName(0) or "GNU LilyPond authors"
        names={
            "familyName":"Esferas Microtonal G22 Study",
            "styleName":"Regular",
            "fullName":"Esferas Microtonal G22 Study Regular",
            "psName":"EsferasMicrotonalG22Study-Regular",
            "uniqueFontIdentifier":"Esferas-Microtonal-G2.2-Candidates-v0.2",
            "version":"Version 0.220",
            "copyright":source_notice+" | "+COPYRIGHT+
               " GPLv3-or-later with LilyPond font embedding exception.",
            "description":"UNAPPROVED MICROTONAL CANDIDATES, based on GPL+font-exception GNU LilyPond Emmentaler outlines with original hairline markers."
        }
        fb=FontBuilder(UPM,isTTF=True)
        fb.setupGlyphOrder(order)
        fb.setupCharacterMap({0x20:"space",**{c.codepoint:c.key for c in CATALOGUE}})
        fb.setupGlyf(shapes)
        fb.setupHorizontalMetrics(metrics)
        fb.setupHorizontalHeader(ascent=1300,descent=-800)
        fb.setupNameTable(names)
        fb.setupOS2(sTypoAscender=1300,sTypoDescender=-800,
                    sTypoLineGap=0,usWinAscent=1300,usWinDescent=800)
        fb.setupPost()
        fb.setupMaxp()
        out.parent.mkdir(parents=True,exist_ok=True)
        fb.save(out)
        manifest={
            "version":"G2.2-0.2-draft",
            "status":"CANDIDATES_VISUAL_REVIEW_PENDING",
            "approved":False,
            "base_project":SOURCE_PROJECT,
            "base_font":source_path.name,
            "base_sha256":hashlib.sha256(source_path.read_bytes()).hexdigest(),
            "base_version":sf["name"].getDebugName(5),
            "license":SOURCE_LICENSE,
            "source_copyright":source_notice,
            "unit_tone_cents":200,
            "historical_one_beam_quarter_warning":
                "LilyPond sharp.slash.stem is quarter tone +50c historically; no unmodified contour used to encode +25c",
            "collision_policy":"A and B are separate proposed graphic profiles; not combined in final alphabet",
            "glyphs":records,
        }
        out.with_suffix(".json").write_text(
            json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",
            encoding="utf8")
        return out,manifest
    finally:
        sf.close()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--source",default=None)
    parser.add_argument("--out",
                        default="build/EsferasMicrotonal-G22-Candidates.ttf")
    a=parser.parse_args()
    source=_find_source_file(a.source)
    p,m=build(source,a.out)
    print("G2.2 families:",list(FAMILIES))
    print("G2.2 candidate glyphs:",len(m["glyphs"]))
    print("Original LilyPond SHA-256:",m["base_sha256"])
    print("Not approved:",not m["approved"])
    print("Saved:",p,p.stat().st_size,"bytes")


if __name__=="__main__":
    main()
