#!/usr/bin/env python3
"""Construye Esferas Microtonal, PROTOTIPO de fuente musical independiente.

No incorpora datos binarios, curvas, calcos, outlines, ni mapas de teclado
procedentes de MIDIDESI/Tempera. Los glifos se crean desde primitivas
geométricas programadas específicamente para este proyecto.

Requiere: pip install fonttools
Uso: python3 build_font.py --out build/EsferasMicrotonal-Prototype.ttf

Señales:
- Código estándar SMuFL para bemol, becuadro, sostenido, cuarto de tono
  Stein–Zimmermann positivo y negativo.
- Códigos suplementarios PRIVADOS para sextos, octavos y doceavos:
  no debe interpretarse su código como un estándar o como una fuente Sims.
- Semántica externa, en metadata.json, no inferida del dibujo.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
ADVANCE = 560

# Los nombres y códigos SMuFL son identificadores ESTÁNDAR, no contornos ajenos.
# La región U+F0000... contiene únicamente glifos originales no normalizados.
CODES = {
    "flat": 0xE260,
    "natural": 0xE261,
    "sharp": 0xE262,
    "quarter_flat_stein": 0xE280,
    "quarter_sharp_stein": 0xE282,
    "sixth_down": 0xF0001,
    "sixth_up": 0xF0002,
    "eighth_down": 0xF0003,
    "eighth_up": 0xF0004,
    "twelfth_down": 0xF0005,
    "twelfth_up": 0xF0006,
}
# Signo, cantidad de tono temperado y corrección exacta en cents.
RATIOS = {
    "flat": (-1, 2), "sharp": (1, 2), "natural": (0, 1),
    "quarter_flat_stein": (-1, 4), "quarter_sharp_stein": (1, 4),
    "sixth_down": (-1, 6), "sixth_up": (1, 6),
    "eighth_down": (-1, 8), "eighth_up": (1, 8),
    "twelfth_down": (-1, 12), "twelfth_up": (1, 12),
}


def polygon(pen, points):
    pts = [(round(x), round(y)) for x, y in points]
    pen.moveTo(pts[0])
    for pt in pts[1:]:
        pen.lineTo(pt)
    pen.closePath()


def stroke(pen, p0, p1, width=46):
    """Trazo rectangular engrosado mediante su vector normal."""
    x0, y0 = p0
    x1, y1 = p1
    d = math.hypot(x1-x0, y1-y0)
    if d == 0:
        raise ValueError("Trazo degenerado")
    nx, ny = -(y1-y0)*width/(2*d), (x1-x0)*width/(2*d)
    polygon(pen, [
        (x0+nx, y0+ny), (x1+nx, y1+ny),
        (x1-nx, y1-ny), (x0-nx, y0-ny)
    ])


def ribbon(pen, points, width=43):
    """Traza una curva OPEN-OUTLINE sin copiar puntos de fuente externa."""
    sides_a, sides_b = [], []
    for i, (x, y) in enumerate(points):
        prev = points[max(0, i-1)]
        nxt = points[min(len(points)-1, i+1)]
        dx, dy = nxt[0]-prev[0], nxt[1]-prev[1]
        length = math.hypot(dx, dy)
        nx, ny = -dy*width/(2*length), dx*width/(2*length)
        sides_a.append((x+nx, y+ny))
        sides_b.append((x-nx, y-ny))
    polygon(pen, sides_a + sides_b[::-1])


def cubic_points(a,b,c,d,steps=28):
    for i in range(steps+1):
        t = i / steps
        u = 1-t
        yield (
            u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],
            u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]
        )


def outline_regular(pen, sides, center=(280,300), radius=161, thickness=43,
                    phase=-math.pi/2):
    """Anillo genuinamente vacío mediante contornos de orientación opuesta."""
    x,y = center
    outer=[(x+radius*math.cos(phase+i*2*math.pi/sides),
            y+radius*math.sin(phase+i*2*math.pi/sides))
            for i in range(sides)]
    r=radius-thickness
    inner=[(x+r*math.cos(phase+i*2*math.pi/sides),
            y+r*math.sin(phase+i*2*math.pi/sides))
            for i in range(sides)]
    polygon(pen,outer)
    polygon(pen,inner[::-1])


def make_glyph(name):
    pen = TTGlyphPen(None)
    if name == ".notdef":
        outline_regular(pen,4,center=(280,310),radius=178,thickness=47,
                        phase=math.pi/4)
        stroke(pen,(210,230),(350,390),31)
    elif name == "space":
        pass
    elif name in ("flat","quarter_flat_stein"):
        reverse = name == "quarter_flat_stein"
        mirror = lambda x: ADVANCE-x if reverse else x
        stroke(pen,(mirror(177),-90),(mirror(177),754),57)
        curve=list(cubic_points((mirror(177),396),
                (mirror(480),528),(mirror(488),-88),(mirror(177),-90)))
        ribbon(pen,curve,49)
    elif name in ("sharp","quarter_sharp_stein"):
        stems = [189,353] if name == "sharp" else [279]
        for x in stems:
            stroke(pen,(x,-91),(x+25,714),49)
        for y in (215,410):
            stroke(pen,(123,y),(432,y+64),64)
    elif name == "natural":
        stroke(pen,(180,6),(180,700),52)
        stroke(pen,(375,-90),(375,600),52)
        stroke(pen,(180,231),(375,292),48)
        stroke(pen,(180,409),(375,468),48)
    elif name in ("sixth_down","sixth_up"):
        # Formas geométricas originales: pentágono arriba y rombo abajo.
        stroke(pen,(280,-80),(280,690),37)
        if name == "sixth_up":
            polygon(pen,[(280,525),(411,398),(350,207),(210,207),(150,398)])
        else:
            polygon(pen,[(280,525),(422,330),(280,145),(138,330)])
    elif name in ("eighth_down","eighth_up"):
        # Octágono vacío + punta de dirección: un símbolo explícito de 1/8
        # no extraído de Tempera, de Sibelius ni de otro alfabeto.
        outline_regular(pen,8,center=(280,339),radius=173,thickness=42,
                        phase=math.pi/8)
        if name == "eighth_up":
            polygon(pen,[(280,527),(350,392),(210,392)])
            stroke(pen,(280,387),(280,163),43)
        else:
            polygon(pen,[(280,143),(350,276),(210,276)])
            stroke(pen,(280,278),(280,512),43)
    elif name in ("twelfth_down","twelfth_up"):
        stroke(pen,(280,-80),(280,691),36)
        if name == "twelfth_up":
            polygon(pen,[(152,216),(407,216),(407,473),(152,473)])
        else:
            polygon(pen,[(155,468),(404,468),(404,208)])
    else:
        raise KeyError(name)
    return pen.glyph()


def build(output: Path):
    output.parent.mkdir(parents=True,exist_ok=True)
    glyph_order = [".notdef","space"] + list(CODES)
    glyf = {name:make_glyph(name) for name in glyph_order}
    font = FontBuilder(UPM,isTTF=True)
    font.setupGlyphOrder(glyph_order)
    font.setupCharacterMap({0x20:"space", **{cp:name for name,cp in
                                            CODES.items()}})
    font.setupGlyf(glyf)
    font.setupHorizontalMetrics({name:(ADVANCE,0) for name in glyph_order})
    font.setupHorizontalHeader(ascent=840,descent=-200)
    font.setupNameTable({
        "familyName":"Esferas Microtonal Prototype",
        "styleName":"Regular",
        "uniqueFontIdentifier":"EsferasMicrotonalPrototype 0.1 (independent)",
        "fullName":"Esferas Microtonal Prototype Regular",
        "psName":"EsferasMicrotonalPrototype-Regular",
        "version":"Version 0.100",
        "description":"Original parametric notation design. Not copied from MIDIDESI.",
    })
    font.setupOS2(
        sTypoAscender=840,sTypoDescender=-200,sTypoLineGap=0,
        usWinAscent=840,usWinDescent=200,
        sxHeight=450,sCapHeight=700
    )
    font.setupPost()
    font.setupMaxp()
    font.save(output)
    return output


def manifest():
    return {
        "font":"Esferas Microtonal Prototype",
        "upm":UPM,
        "encoding":"SMuFL for standard signs; supplementary private-use area for originals",
        "origin":"Independently drawn mathematical notation. MIDIDESI/Tempera used only to identify fraction concepts.",
        "status":"Experimental; rights/licensing of the project font not yet assigned",
        "glyphs":[{
            "name":name,"codepoint":f"U+{code:04X}",
            "fractionOfWholeTone":f"{RATIOS[name][0]}/{RATIOS[name][1]}",
            "centsNumerator":RATIOS[name][0]*200,
            "centsDenominator":RATIOS[name][1]
        } for name,code in CODES.items()]
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out",default="build/EsferasMicrotonal-Prototype.ttf")
    args=parser.parse_args()
    target=build(Path(args.out))
    meta=target.with_suffix(".json")
    meta.write_text(json.dumps(manifest(),indent=2,ensure_ascii=False)+"\n",
                    encoding="utf-8")
    print(f"Construido: {target} ({target.stat().st_size} bytes)")
    print(f"Manifiesto: {meta}")


if __name__=="__main__":
    main()
