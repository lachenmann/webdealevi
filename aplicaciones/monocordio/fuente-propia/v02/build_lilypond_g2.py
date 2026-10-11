#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""G2: fuente de ESTUDIO derivada de variantes auténticas GNU LilyPond/Feta.

No redibuja las formas históricas ni atribuye el diseño de las madres a
Esferas. No se publica el TTF: CI conserva solo metadatos y un espécimen PNG.

Importante: «sharp.slash.stem» es un *medio sostenido* histórico (= +1/4 de
tono temperado en el perfil explícito). Su contorno NO puede reutilizarse
silenciosamente con significado de +1/8: sería una ambigüedad notacional.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

from build_lilypond_mothers import (
    COPYRIGHT, MOTHERS, SOURCE_LICENSE, SOURCE_PROJECT, UPM,
    _extract_mother, _find_source_file,
)

PROFILE = "nma.tone-12tet.v0"
# La notación de fuente es HISTÓRICA y distinta de la ortografía estándar SMuFL.
# U+F0020–F0021 son privados, registrados solo para ESTUDIO comparativo.
@dataclass(frozen=True)
class Candidate:
    source: str
    codepoint: int
    numerator: int | None
    denominator: int | None
    role: str
    smufl: str | None = None
    approval: str = "historical-source-reference"
    caveat: str = ""

CATALOGUE = {
    "flat": Candidate("accidentals.flat",0xE260,-1,2,
                      "Bemol convencional","accidentalFlat","G1_APPROVED"),
    "natural": Candidate("accidentals.natural",0xE261,None,None,
                         "Becuadro contextual","accidentalNatural","G1_APPROVED"),
    "sharp": Candidate("accidentals.sharp",0xE262,1,2,
                       "Sostenido convencional","accidentalSharp","G1_APPROVED"),
    "quarter_flat_stein": Candidate(
        "accidentals.mirroredflat",0xE280,-1,4,
        "Bemol inverso, cuarto descendente","accidentalQuarterToneFlatStein",
        "G2_HISTORIC_FORM_VISUALLY_APPROVED"),
    "quarter_sharp_stein": Candidate(
        "accidentals.sharp.slashslash.stem",0xE282,1,4,
        "Medio sostenido, asta única y dos barras",
        "accidentalQuarterToneSharpStein","G2_HISTORIC_FORM_VISUALLY_APPROVED"),
    "three_quarters_sharp_stein": Candidate(
        "accidentals.sharp.slashslash.stemstemstem",0xE283,3,4,
        "Sostenido de tres astas y dos barras",
        "accidentalThreeQuarterTonesSharpStein","G2_HISTORIC_FORM_VISUALLY_APPROVED"),
    "three_quarters_flat_lilypond": Candidate(
        "accidentals.flatflat.slash",0xF0020,-3,4,
        "3/4 de tono descendente, figura propia de LilyPond",
        None,"HISTORICAL_REFERENCE_ONLY",
        "No asimilar a U+E281 Zimmermann sin cotejo iconográfico."),
    "quarter_sharp_one_beam_lilypond": Candidate(
        "accidentals.sharp.slash.stem",0xF0021,1,4,
        "Medio sostenido alternativo de una barra",
        None,"HISTORICAL_REFERENCE_ONLY",
        "LilyPond lo define como MEDIO SOSTENIDO: no es un 1/8 de tono."),
}
assert len(set(x.codepoint for x in CATALOGUE.values()))==len(CATALOGUE)


def _missing_glyphs(original: TTFont):
    names=set(original.getGlyphOrder())
    return {key:spec.source for key,spec in CATALOGUE.items()
            if spec.source not in names}


def build(original_path: Path | str, destination: Path | str):
    original_path=Path(original_path)
    destination=Path(destination)
    source=TTFont(original_path)
    try:
        missing=_missing_glyphs(source)
        if missing:
            raise ValueError(
                "Emmentaler no incluye estas variantes: "+
                ", ".join(f"{k}={v}" for k,v in missing.items())
            )
        glyphs=[".notdef","space",*CATALOGUE]
        blank=TTGlyphPen(None)
        blank.moveTo((100,-90));blank.lineTo((100,680))
        blank.lineTo((390,680));blank.lineTo((390,-90));blank.closePath()
        glyf={".notdef":blank.glyph(),"space":TTGlyphPen(None).glyph()}
        metrics={".notdef":(520,100),"space":(260,0)}
        metadata={}
        for name, spec in CATALOGUE.items():
            shape,adv,transform=_extract_mother(source,spec.source)
            glyf[name]=shape
            lsb=round(
                transform["source_bbox"][0]*transform["scale"] +
                transform["offset_x"]
            )
            metrics[name]=(adv,lsb)
            if spec.numerator is None:
                cents=None
                fraction=None
            else:
                frac=Fraction(spec.numerator,spec.denominator)
                cv=200*frac
                cents={"numerator":cv.numerator,"denominator":cv.denominator}
                fraction={"numerator":frac.numerator,"denominator":frac.denominator}
            metadata[name]={
                "upstream_name":spec.source,
                "glyph_codepoint":f"U+{spec.codepoint:04X}",
                "smufl_name":spec.smufl,
                "fraction_of_tone":fraction,
                "exact_cents":cents,
                "notation_profile":PROFILE if cents else "contextual",
                "status":spec.approval,
                "visual_review":(
                    "APPROVED_G1" if spec.approval=="G1_APPROVED" else
                    "APPROVED_G2_HISTORIC_FORM" if spec.approval=="G2_HISTORIC_FORM_VISUALLY_APPROVED" else
                    "APPROVED_AS_COMPARATIVE_REFERENCE_ONLY"
                ),
                "role":spec.role,
                "caveat":spec.caveat or None,
                "transform":transform,
                "advance_units":adv,
                "lsb_units":lsb,
            }
        source_notice=source["name"].getDebugName(0) or "GNU LilyPond authors"
        derived_notice=(
            source_notice + " | " + COPYRIGHT +
            " See upstream/LICENSE (GPLv3+ and LilyPond font exception)."
        )
        builder=FontBuilder(UPM,isTTF=True)
        builder.setupGlyphOrder(glyphs)
        builder.setupCharacterMap({0x20:"space",**{
            spec.codepoint:key for key,spec in CATALOGUE.items()
        }})
        builder.setupGlyf(glyf)
        builder.setupHorizontalMetrics(metrics)
        builder.setupHorizontalHeader(ascent=1150,descent=-750)
        builder.setupNameTable({
            "familyName":"Esferas Microtonal LilyPond G2 Study",
            "styleName":"Regular",
            "fullName":"Esferas Microtonal LilyPond G2 Study Regular",
            "psName":"EsferasMicrotonalLilyPondG2Study-Regular",
            "uniqueFontIdentifier":"Esferas-Microtonal-G2-0.2.2-LilyPond",
            "version":"Version 0.202",
            "copyright":derived_notice,
            "description":"LilyPond/Emmentaler derived microtonal SPECIMEN, GPL-3.0-or-later plus the original font exception. Historical one-beam quarter-sharp is NOT an eighth tone."
        })
        builder.setupOS2(sTypoAscender=1150,sTypoDescender=-750,
                         sTypoLineGap=0,usWinAscent=1150,usWinDescent=750)
        builder.setupPost()
        builder.setupMaxp()
        destination.parent.mkdir(parents=True,exist_ok=True)
        builder.save(destination)
        report={
            "edition":"G2-0.2.2-DRAFT",
            "font_status":"STUDY_ONLY_NO_RELEASE",
            "g1_approved":True,
            "g2_1_visual_approval":True,
            "g2_complete":False,
            "g2_release_approved":False,
            "approval_scope":"Ocho glifos vistos en el espécimen: tres madres G1 y cinco variantes G2; dos variantes solo como referencias comparativas, sin aprobar nuevos códigos normativos.",
            "source_project":SOURCE_PROJECT,
            "source_file":original_path.name,
            "source_sha256":hashlib.sha256(original_path.read_bytes()).hexdigest(),
            "source_version":source["name"].getDebugName(5),
            "source_copyright":source_notice,
            "derivative_notice":derived_notice,
            "licence":SOURCE_LICENSE,
            "not_smufl_native":True,
            "note":"SMuFL codepoints are remapped by Esferas for STUDY. PUA F0020/21 have no standard status.",
            "glyphs":metadata,
        }
        destination.with_suffix(".json").write_text(
            json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"
        )
        return destination, report
    finally:
        source.close()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--source")
    parser.add_argument("--out",default="build/EsferasMicrotonal-G2-LilyPond.ttf")
    args=parser.parse_args()
    source=_find_source_file(args.source)
    path,report=build(source,args.out)
    print("G2 candidate glyphs:",len(report["glyphs"]))
    for name,data in report["glyphs"].items():
        print(name, data["upstream_name"], data["exact_cents"],
              data["glyph_codepoint"],data["status"])
    print("Source hash:",report["source_sha256"])
    print("Build:",path,"bytes",path.stat().st_size)


if __name__=="__main__":
    main()
