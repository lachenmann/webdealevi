#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Quantify tiny-size G2.2 candidate distinctions; NOT perceptual approval.

Produces a reproducible experimental QA JSON with optical pairwise metrics at
7, 9, 12 and 16 pixels per staff space. No numeric test replaces human review.
"""
from __future__ import annotations

import argparse
import json
from itertools import combinations
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from build_lilypond_g22 import CATALOGUE

FRACTIONS=("twelfth","eighth","sixth","three_eighths")
SIZES=(7,9,12,16)
CANDIDATES={c.key:c for c in CATALOGUE}

def raster(font_path:Path,codepoint:int,staff_px:int)->Image.Image:
    """Use exact staff proportions of the preview: 4 px-font per staff px."""
    im=Image.new("L",(150,140),255)
    face=ImageFont.truetype(str(font_path),4*staff_px)
    painter=ImageDraw.Draw(im)
    painter.text((24,83),chr(codepoint),font=face,fill=0,anchor="ls")
    return im

def darkness(im:Image.Image)->float:
    return sum((255-x)/255 for x in im.getdata())

def difference(a:Image.Image,b:Image.Image)->float:
    return sum(abs(x-y)/255 for x,y in zip(a.getdata(),b.getdata()))

def inspect(font:Path):
    records={}
    for staff in SIZES:
        family_sizes={}
        for mode in ("A","B"):
            directions={}
            for direction in ("up","down"):
                imgs={}
                for fraction in FRACTIONS:
                    c=CANDIDATES[f"{mode.lower()}_{fraction}_{direction}"]
                    imgs[fraction]=raster(font,c.codepoint,staff)
                signatures={}
                for name,img in imgs.items():
                    signatures[name]={
                        "ink_pixel_equivalents":round(darkness(img),3)
                    }
                distances=[
                    {"a":a,"b":b,"abs_pixel_difference_equivalents":
                     round(difference(imgs[a],imgs[b]),3)}
                    for a,b in combinations(FRACTIONS,2)
                ]
                # Identical raster outputs would mean at least one collision.
                collisions=[x for x in distances
                            if x["abs_pixel_difference_equivalents"]<1e-6]
                directions[direction]={
                    "fractions":signatures,
                    "min_pairwise_difference_equivalents":min(
                        x["abs_pixel_difference_equivalents"] for x in distances
                    ),
                    "pairwise":distances,
                    "identical_rasters":collisions
                }
            family_sizes[mode]=directions
        records[str(staff)]=family_sizes
    return {
        "study":"ESFERAS-G2.2-RASTER-COMPARISON",
        "scope":"The following scores measure pixel differences, not human recognition.",
        "status":"QA_REPORT_ONLY_NOT_A_STANDARD_NOT_APPROVED",
        "staff_sizes_pixels":list(SIZES),
        "threshold_policy":"Identical bitmaps are a blocking technical collision; other tiny differences need blind-reading assessment.",
        "results":records
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--font",required=True)
    p.add_argument("--out",required=True)
    args=p.parse_args()
    data=inspect(Path(args.font))
    out=Path(args.out)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8")
    for s in SIZES:
        for family in ("A","B"):
            for direction in ("up","down"):
                v=data["results"][str(s)][family][direction]
                worst=v["min_pairwise_difference_equivalents"]
                print(f"staff={s} family={family} direction={direction}: "
                      f"minimum raster difference={worst:.3f} ink pixels")
                if v["identical_rasters"]:
                    raise SystemExit("Pixel-identical glyphs at music size")
    print("Raster report:",out)


if __name__=="__main__":
    main()
