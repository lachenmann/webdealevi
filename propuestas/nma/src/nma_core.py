# SPDX-License-Identifier: GPL-3.0-or-later
"""NMA-0001: operaciones exactas sobre intervalos microtonales.

Implementación de referencia mínima, independiente de tipografías/MIDI.
Los números racionales y exponentes se conservan como fracciones de enteros
de precisión arbitraria. Los decimales flotantes SOLO se usan con nombres
expresos *_approx para visualización o síntesis.

Este prototipo no es una norma ratificada por ninguna institución.
"""
from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from math import log2, isfinite
from typing import Any


def _integer(value: int, name: str) -> int:
    if type(value) is not int:
        raise TypeError(f"{name} debe ser un entero, sin conversión implícita")
    return value


def _positive(value: int, name: str) -> int:
    _integer(value, name)
    if value <= 0:
        raise ValueError(f"{name} debe ser estrictamente positivo")
    return value


def _parts(a: int, b: int, *, signed: bool = False) -> Fraction:
    _integer(a, "Numerador")
    _positive(b, "Denominador")
    if not signed:
        _positive(a, "Numerador")
    return Fraction(a, b)


@dataclass(frozen=True, init=False)
class Ratio:
    """Razón de frecuencia exacta p/q > 0; admite intervalos descendentes."""

    value: Fraction

    def __init__(self, numerator: int, denominator: int = 1):
        object.__setattr__(self, "value", _parts(numerator, denominator))

    @property
    def numerator(self) -> int:
        return self.value.numerator

    @property
    def denominator(self) -> int:
        return self.value.denominator

    def inverse(self) -> Ratio:
        return Ratio(self.denominator, self.numerator)

    def compose(self, other: Ratio) -> Ratio:
        if not isinstance(other, Ratio):
            raise TypeError("Una composición de razones requiere dos razones")
        result = self.value * other.value
        return Ratio(result.numerator, result.denominator)

    def frequency_from(self, reference_hz: Ratio) -> Ratio:
        """Frecuencia racional exacta si la referencia es una razón en Hz."""
        if not isinstance(reference_hz, Ratio):
            raise TypeError("Referencia de frecuencia racional requerida")
        return reference_hz.compose(self)

    def cents_approx(self) -> float:
        return 1200.0 * (log2(self.numerator) - log2(self.denominator))


@dataclass(frozen=True)
class EqualDivision:
    """P^(k/N) exacto, con P razón > 1, N>0 y k entero orientado."""

    period: Ratio
    divisions: int
    steps: int

    def __post_init__(self):
        if not isinstance(self.period, Ratio):
            raise TypeError("El período debe ser una Ratio")
        if self.period.value <= 1:
            raise ValueError("El período debe superar el unísono")
        _positive(self.divisions, "Divisiones")
        _integer(self.steps, "Pasos")

    @property
    def exponent(self) -> Fraction:
        return Fraction(self.steps, self.divisions)

    @property
    def cents_exact(self) -> Fraction | None:
        """Solo es racional exacto por esta fórmula para la octava P=2."""
        if self.period == Ratio(2):
            return Fraction(1200 * self.steps, self.divisions)
        return None

    def inverse(self) -> EqualDivision:
        return EqualDivision(self.period, self.divisions, -self.steps)

    def compose(self, other: EqualDivision) -> EqualDivision:
        if not isinstance(other, EqualDivision):
            raise TypeError("Se requieren dos EqualDivision")
        if self.period != other.period or self.divisions != other.divisions:
            raise ValueError("Composición EDO solo dentro del mismo perfil")
        return EqualDivision(self.period, self.divisions, self.steps + other.steps)

    def equivalent_in_period(self, other: EqualDivision) -> bool:
        """Prueba exacta cuando ambos comparten el mismo período."""
        if not isinstance(other, EqualDivision) or self.period != other.period:
            raise ValueError("La prueba solo admite un período compartido")
        return self.exponent == other.exponent

    def cents_approx(self) -> float:
        return 1200.0 * float(self.exponent) * (
            log2(self.period.numerator) - log2(self.period.denominator)
        )


@dataclass(frozen=True, init=False)
class RationalCents:
    """Cents p/q exactos; razón simbólica asociada 2^(p/(1200q))."""

    value: Fraction

    def __init__(self, numerator: int, denominator: int = 1):
        object.__setattr__(
            self, "value", _parts(numerator, denominator, signed=True)
        )

    def inverse(self) -> RationalCents:
        return RationalCents(-self.value.numerator, self.value.denominator)

    def compose(self, other: RationalCents) -> RationalCents:
        if not isinstance(other, RationalCents):
            raise TypeError("Se requieren dos RationalCents")
        result = self.value + other.value
        return RationalCents(result.numerator, result.denominator)

    @property
    def exponent_of_two(self) -> Fraction:
        return self.value / 1200

    def cents_approx(self) -> float:
        return float(self.value)


Interval = Ratio | EqualDivision | RationalCents


def fraction_of_tone(numerator: int, denominator: int, *, profile: str) -> RationalCents:
    """Convierte una fracción de tono SOLO para un perfil explícito."""
    if profile != "nma.tone-12tet.v0":
        raise ValueError("La palabra tono exige perfil explícito soportado")
    frac = _parts(numerator, denominator, signed=True)
    value = frac * 200
    return RationalCents(value.numerator, value.denominator)


def octave_edo_equivalent(a: EqualDivision, b: EqualDivision) -> bool:
    """Equivalencia simbólica de dos intervalos EDO del mismo período 2/1."""
    if a.period != Ratio(2) or b.period != Ratio(2):
        raise ValueError("Se requieren dos divisiones de la octava")
    return a.exponent == b.exponent


def to_record(interval: Interval) -> dict[str, Any]:
    """JSON de datos exactos: enteros como cadenas para evitar IEEE 754."""
    if isinstance(interval, Ratio):
        return {"kind": "ratio",
                "numerator": str(interval.numerator),
                "denominator": str(interval.denominator)}
    if isinstance(interval, EqualDivision):
        return {"kind": "ediv",
                "period": to_record(interval.period),
                "divisions": str(interval.divisions),
                "steps": str(interval.steps)}
    if isinstance(interval, RationalCents):
        return {"kind": "cents-rational",
                "numerator": str(interval.value.numerator),
                "denominator": str(interval.value.denominator)}
    raise TypeError("Tipo de intervalo no reconocido")


def from_record(record: dict[str, Any]) -> Interval:
    """Decodificación estricta de la representación exacta mínima."""
    if not isinstance(record, dict):
        raise TypeError("Se requiere objeto JSON")
    kind = record.get("kind")
    def number(key: str) -> int:
        raw = record.get(key)
        if not isinstance(raw, str) or not raw or raw.strip() != raw:
            raise ValueError(f"{key} debe ser cadena canónica de entero")
        if raw[0] == "-":
            if len(raw) <= 1 or not raw[1:].isdigit():
                raise ValueError(f"{key} inválido")
        elif not raw.isdigit():
            raise ValueError(f"{key} inválido")
        # canonical parse, no plus sign, no leading zeros, no negative zero
        n = int(raw)
        if str(n) != raw:
            raise ValueError(f"{key} no canónico")
        return n

    if kind == "ratio":
        if set(record) != {"kind", "numerator", "denominator"}:
            raise ValueError("Campos no permitidos en Ratio")
        return Ratio(number("numerator"), number("denominator"))
    if kind == "cents-rational":
        if set(record) != {"kind", "numerator", "denominator"}:
            raise ValueError("Campos no permitidos en RationalCents")
        return RationalCents(number("numerator"), number("denominator"))
    if kind == "ediv":
        if set(record) != {"kind", "period", "divisions", "steps"}:
            raise ValueError("Campos no permitidos en EqualDivision")
        period = from_record(record["period"])
        if not isinstance(period, Ratio):
            raise TypeError("El período debe ser razón exacta")
        return EqualDivision(period, number("divisions"), number("steps"))
    raise ValueError(f"Tipo de intervalo no definido: {kind!r}")


def hz_approx(reference_hz: Ratio, interval: Interval) -> float:
    """Cálculo NO canónico, apropiado exclusivamente para audio/UI."""
    if not isinstance(reference_hz, Ratio):
        raise TypeError("Frecuencia de referencia racional requerida")
    if isinstance(interval, Ratio):
        f = interval.frequency_from(reference_hz)
        return float(f.value)
    if not isinstance(interval, (EqualDivision, RationalCents)):
        raise TypeError("Intervalo inválido")
    return float(reference_hz.value) * 2 ** (interval.cents_approx() / 1200.0)


def approx_difference_cents(a: Interval, b: Interval) -> float:
    """Informe SOLO numérico; nunca una decisión de igualdad matemática."""
    return a.cents_approx() - b.cents_approx()
