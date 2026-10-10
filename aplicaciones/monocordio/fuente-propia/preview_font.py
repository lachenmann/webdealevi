#!/usr/bin/env python3
"""Genera una muestra PNG de Esferas Microtonal (no distribuye la fuente)."""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from build_font import CODES, RATIOS

LABELS = [
    ("flat","Bemol −½ tono"),
    ("sharp","Sostenido +½ tono"),
    ("natural","Becuadro 0"),
    ("quarter_flat_stein","Bemol inverso −¼"),
    ("quarter_sharp_stein","Medio sostenido +¼"),
    ("sixth_down","Sexto inferior −⅙"),
    ("sixth_up","Sexto superior +⅙"),
    ("eighth_down","Octavo inferior −⅛"),
    ("eighth_up","Octavo superior +⅛"),
    ("twelfth_down","Doceavo inferior −¹⁄₁₂"),
    ("twelfth_up","Doceavo superior +¹⁄₁₂")
]


def system_font(size):
    for name in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf"
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def build_preview(font_path:Path, output:Path):
    font_big = ImageFont.truetype(str(font_path), 112)
    font_small = ImageFont.truetype(str(font_path), 48)
    heading = system_font(31)
    label = system_font(19)
    small = system_font(15)
    image = Image.new("RGB",(1320,1310),"#f6f2e9")
    draw=ImageDraw.Draw(image)
    draw.rectangle([25,28,1295,1283],outline="#b6a58b",width=2)
    draw.text((53,49),"ESFERAS · ESTUDIO TIPOGRÁFICO",font=heading,fill="#332b29")
    draw.text((55,97),"Fuente paramétrica original · signos normalizados y extensiones privadas",
              font=label,fill="#6c594d")
    draw.text((55,126),"Contornos dibujados desde cero. Referencia matemática: fracciones de tono (MIDIDESI/Tempera).",
              font=small,fill="#62594d")
    w,h=389,263
    top=169
    left=54
    for idx,(name,title) in enumerate(LABELS):
        col=idx%3
        row=idx//3
        x=left+col*408
        y=top+row*278
        draw.rounded_rectangle((x,y,x+w,y+h),radius=11,
             fill="#fffefd",outline="#c9bcb0",width=2)
        draw.text((x+18,y+14),title,font=label,fill="#282329")
        ratio=RATIOS[name]
        cents=ratio[0]*200/ratio[1]
        draw.text((x+18,y+47),f"{cents:+.4g} cents · U+{CODES[name]:04X}",
                font=small,fill="#7b6558")
        for yy in [y+124,y+138,y+152,y+166,y+180]:
            draw.line((x+29,yy,x+353,yy),fill="#bdb7ad",width=1)
        codepoint=CODES[name]
        # Medición tipográfica independiente, con alta resolución.
        bb=draw.textbbox((0,0),chr(codepoint),font=font_big)
        px=x+110-(bb[0]+bb[2])/2
        py=y+155-(bb[1]+bb[3])/2
        draw.text((int(px),int(py)),chr(codepoint),font=font_big,fill="#39292c")
        # Cabeza de nota simplificada a modo de referencia, NO parte de la fuente.
        draw.ellipse((x+222,y+150,x+247,y+165),fill="#39292c")
        draw.line((x+247,y+156,x+247,y+113),fill="#39292c",width=3)
        draw.text((x+24,y+208),"Muestra 112 px · referencia 48 px →",font=small,
                  fill="#6b5b53")
        draw.text((x+343,y+199),chr(codepoint),font=font_small,fill="#39292c")
    draw.text((54,1271),"PROTOTIPO · No sustituye partituras históricas ni contiene contornos de MIDIDESI.",
              font=small,fill="#765d4a")
    output.parent.mkdir(parents=True,exist_ok=True)
    image.save(output)
    print(f"Previsualización generada: {output}, {image.size}")


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--font",required=True)
    parser.add_argument("--out",default="build/esferas-preview.png")
    args=parser.parse_args()
    build_preview(Path(args.font),Path(args.out))
