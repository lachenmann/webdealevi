#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Extract genuine LilyPond Emmentaler/Feta mother glyphs into a study TTF.

This produces a DERIVATIVE of the LilyPond font, not independent outlines.
Its source font MUST be an authentic Emmentaler OTF under LilyPond's
dual license. Distribution basis: GPL-3.0-or-later WITH LilyPond's
font embedding exception, as reproduced in upstream/LICENSE.

Only flat, natural, sharp are extracted. SMuFL codepoints are remapped,
as LilyPond uses historic names rather than assuming SMuFL codepoints.
Contours are converted from CFF cubic to TrueType quadratic without
intentional design modifications. This is *not* the release font.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

UPM = 1000
STAFF_SPACE = 250
MOTHERS = {
    "flat": ("accidentals.flat", 0xE260),
    "natural": ("accidentals.natural", 0xE261),
    "sharp": ("accidentals.sharp", 0xE262),
}
SOURCE_LICENSE = "GNU GPL-3.0-or-later with the LilyPond font exception"
SOURCE_PROJECT = "GNU LilyPond — Emmentaler/Feta"
COPYRIGHT = (
    "Copyright (C) 1997–2026 Han-Wen Nienhuys and other LilyPond authors. "
    "LilyPond's Emmentaler/Feta source is dual-licensed GPL+Font Exception "
    "or SIL OFL 1.1; this derivative study selects GPL+Font Exception. "
    "Additional conversion code copyright (C) 2026 NMA contributors."
)


def _find_source_file(explicit: str | None) -> Path:
    if explicit is not None:
        candidate = Path(explicit).expanduser()
        if not candidate.is_file():
            raise FileNotFoundError(
                f"Fuente Emmentaler no localizada: {candidate}"
            )
        return candidate
    candidates = (
        Path("/usr/share/lilypond/2.24.4/fonts/otf/emmentaler-20.otf"),
        Path("/usr/share/lilypond/2.24.3/fonts/otf/emmentaler-20.otf"),
        Path("/usr/share/lilypond/2.24.1/fonts/otf/emmentaler-20.otf"),
    )
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        "Indica --source a un emmentaler-20.otf ORIGINAL de GNU LilyPond. "
        "En Debian/Ubuntu puedes instalar lilypond-fonts; en Mac usa la "
        "carpeta fonts/otf del paquete LilyPond instalado."
    )


def _glyph_bbox(source: TTFont, glyph_name: str):
    glyph_set = source.getGlyphSet()
    pen = BoundsPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    if pen.bounds is None:
        raise ValueError(f"El glifo {glyph_name} no tiene contornos")
    return pen.bounds


def _extract_mother(source: TTFont, glyph_name: str):
    glyph_set = source.getGlyphSet()
    xmin, ymin, xmax, ymax = _glyph_bbox(source, glyph_name)
    # Preserve the upstream proportions: one uniform scale for every mother.
    scale = UPM / source["head"].unitsPerEm
    if scale <= 0 or not math.isfinite(scale):
        raise ValueError("UPM original inválido")
    left_margin = 56
    right_margin = 66
    dx = left_margin - xmin * scale
    dy = 0.0  # Preserve LilyPond's original vertical reference to the staff.
    output = TTGlyphPen(None)
    quad = Cu2QuPen(output, max_err=0.5, reverse_direction=True)
    transformed = TransformPen(quad, (scale, 0, 0, scale, dx, dy))
    glyph_set[glyph_name].draw(transformed)
    result = output.glyph()
    if result.numberOfContours <= 0:
        raise ValueError(f"Glifo convertido vacío: {glyph_name}")
    # Accommodate a tiny round-off tolerance without changing aspect ratio.
    advance = max(
        260,
        math.ceil((xmax-xmin)*scale + left_margin + right_margin)
    )
    return result, advance, {
        "source_name": glyph_name,
        "source_bbox": [xmin, ymin, xmax, ymax],
        "scale": scale,
        "offset_x": dx,
        "offset_y": dy,
        "conversion": "CFF cubic to TrueType quadratic via fontTools Cu2QuPen",
        "max_curve_error_dest_units": 0.5,
    }


def build(source_path: str | Path, output_path: str | Path):
    path = Path(source_path)
    target = Path(output_path)
    sf = TTFont(path)
    try:
        names = set(sf.getGlyphOrder())
        for upstream_name, _ in MOTHERS.values():
            if upstream_name not in names:
                raise ValueError(
                    f"El archivo no contiene {upstream_name}: "
                    f"se necesita Emmentaler/Feta original, no una fuente "
                    f"musical SMuFL genérica."
                )
        target.parent.mkdir(parents=True, exist_ok=True)
        glyphs = [".notdef", "space", *MOTHERS]
        pen = TTGlyphPen(None)
        pen.moveTo((100, -50))
        pen.lineTo((100, 620))
        pen.lineTo((360, 620))
        pen.lineTo((360, -50))
        pen.closePath()
        glyf = {".notdef": pen.glyph(), "space": TTGlyphPen(None).glyph()}
        metrics = {".notdef": (500, 0), "space": (250, 0)}
        detail = {}
        for glyph_name, (upstream_name, codepoint) in MOTHERS.items():
            glyph, advance, info = _extract_mother(sf, upstream_name)
            glyf[glyph_name] = glyph
            metrics[glyph_name] = (advance, 0)
            detail[glyph_name] = {
                **info,
                "smufl_codepoint": f"U+{codepoint:04X}",
                "advance_units": advance,
            }

        font = FontBuilder(UPM, isTTF=True)
        font.setupGlyphOrder(glyphs)
        font.setupCharacterMap({0x20: "space", **{
            cp: name for name, (_, cp) in MOTHERS.items()
        }})
        font.setupGlyf(glyf)
        font.setupHorizontalMetrics(metrics)
        font.setupHorizontalHeader(ascent=1150, descent=-750)
        font.setupNameTable({
            "familyName": "Esferas Microtonal LilyPond Study",
            "styleName": "Regular",
            "fullName": "Esferas Microtonal LilyPond Study Regular",
            "psName": "EsferasMicrotonalLilyPondStudy-Regular",
            "uniqueFontIdentifier": "Esferas-Mother-LilyPond-G1-v0.2-study",
            "version": "Version 0.201",
            "copyright": COPYRIGHT,
            "description": (
                "Derived glyph outlines from GNU LilyPond "
                "Emmentaler, remapped as SMuFL mothers. GPL-3.0-or-later "
                "with LilyPond font exception. Not approved for release."
            ),
        })
        font.setupOS2(
            sTypoAscender=1150, sTypoDescender=-750, sTypoLineGap=0,
            usWinAscent=1150, usWinDescent=750
        )
        font.setupPost()
        font.setupMaxp()
        font.save(target)
        report = {
            "status": "LILY_POND_DERIVATIVE_MOTHERS_G1_REVIEW_ONLY",
            "source_project": SOURCE_PROJECT,
            "upstream_font_filename": path.name,
            "source_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "source_family": sf["name"].getDebugName(1),
            "source_version": sf["name"].getDebugName(5),
            "source_license_choice": SOURCE_LICENSE,
            "upstream_license_text": "v02/upstream/LICENSE",
            "upstream_copyright_preserved": COPYRIGHT,
            "original_upm": sf["head"].unitsPerEm,
            "output_upm": UPM,
            "not_smufl_native": True,
            "outlines_transformed": True,
            "new_font_name": "Esferas Microtonal LilyPond Study",
            "glyphs": detail,
        }
        target.with_suffix(".json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2)+"\n",
            encoding="utf8"
        )
        return target, report
    finally:
        sf.close()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source", default=None,
                   help="ruta original LilyPond emmentaler-20.otf")
    p.add_argument("--out",
                   default="build/EsferasMicrotonal-LilyPond-G1.ttf")
    args = p.parse_args()
    path = _find_source_file(args.source)
    target, report = build(path, args.out)
    print(f"Glifos LilyPond convertidos: {len(report['glyphs'])}")
    print(f"Versión origen: {report['source_version']}")
    print(f"SHA-256 original: {report['source_sha256']}")
    print(f"TTF de trabajo: {target} ({target.stat().st_size} bytes)")
    print(f"Metadatos: {target.with_suffix('.json')}")


if __name__ == "__main__":
    main()
