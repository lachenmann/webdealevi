# SPDX-License-Identifier: GPL-3.0-or-later
"""Corpus de conformidad CORE-MATH (borrador NMA 0.1)."""
import json
import math
import pathlib
import random
import sys
import unittest
from fractions import Fraction

root=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/"src"))
from nma_core import (
    Ratio, EqualDivision, RationalCents, fraction_of_tone,
    octave_edo_equivalent, to_record, from_record, hz_approx,
    approx_difference_cents
)


class MathConformance(unittest.TestCase):
    def test_ratio_normalization_inversion_and_composition(self):
        a=Ratio(6,4)
        self.assertEqual(a,Ratio(3,2))
        self.assertEqual(a.inverse(),Ratio(2,3))
        self.assertEqual(a.compose(a.inverse()),Ratio(1))
        self.assertEqual(Ratio(3,2).frequency_from(Ratio(440)),Ratio(660))
        self.assertEqual(Ratio(2,3).frequency_from(Ratio(440)),Ratio(880,3))

    def test_pure_fifth_is_not_a_twelve_edo_fifth(self):
        pure=Ratio(3,2)
        et=EqualDivision(Ratio(2),12,7)
        self.assertEqual(et.cents_exact,Fraction(700))
        self.assertGreater(pure.cents_approx(),701)
        self.assertAlmostEqual(pure.cents_approx(),701.955000865,places=6)
        self.assertGreater(approx_difference_cents(pure,et),1.95)

    def test_octave_edo_exact(self):
        self.assertEqual(EqualDivision(Ratio(2),72,1).cents_exact,Fraction(50,3))
        self.assertEqual(EqualDivision(Ratio(2),48,1).cents_exact,Fraction(25))
        self.assertTrue(octave_edo_equivalent(
            EqualDivision(Ratio(2),12,2),
            EqualDivision(Ratio(2),24,4)
        ))
        self.assertFalse(octave_edo_equivalent(
            EqualDivision(Ratio(2),12,7),
            EqualDivision(Ratio(2),72,41)
        ))
        self.assertEqual(EqualDivision(Ratio(2),72,2).cents_exact,Fraction(100,3))
        self.assertEqual(Fraction(25)/Fraction(1200,72),Fraction(3,2))

    def test_non_octave_equal_division(self):
        interval=EqualDivision(Ratio(3),13,-1)
        self.assertIsNone(interval.cents_exact)
        self.assertLess(interval.cents_approx(),0)
        self.assertEqual(interval.compose(interval.inverse()).steps,0)
        with self.assertRaises(ValueError):
            interval.compose(EqualDivision(Ratio(2),13,1))

    def test_rational_cents_and_profiles(self):
        examples={
            2:Fraction(100),4:Fraction(50),
            6:Fraction(100,3),8:Fraction(25),
            12:Fraction(50,3)
        }
        for denominator,expected in examples.items():
            got=fraction_of_tone(1,denominator,
                                 profile="nma.tone-12tet.v0")
            self.assertEqual(got.value,expected)
            self.assertEqual(got.exponent_of_two,expected/1200)
            self.assertEqual(got.compose(got.inverse()).value,Fraction(0))
        self.assertEqual(RationalCents(-100,3).value,Fraction(-100,3))
        with self.assertRaises(ValueError):
            fraction_of_tone(1,6,profile="undefined")

    def test_reject_invalid_domains_and_types(self):
        for args in [(0,1),(-2,1),(1,0),(1,-1)]:
            with self.assertRaises((TypeError,ValueError,ZeroDivisionError)):
                Ratio(*args)
        for args in [(Ratio(1),12,0),(Ratio(2),0,1),
                     (Ratio(2),-6,1),(Ratio(2),1.5,1)]:
            with self.assertRaises((TypeError,ValueError)):
                EqualDivision(*args)
        with self.assertRaises(TypeError):
            Ratio(True,1)
        with self.assertRaises(TypeError):
            RationalCents(0.5,1)

    def test_serialization_exact_above_js_safe_integer(self):
        cases=[
            Ratio(9007199254740993,7),
            RationalCents(-100,3),
            EqualDivision(Ratio(2),72,-1),
            EqualDivision(Ratio(3,2),19,13)
        ]
        for obj in cases:
            record=to_record(obj)
            self.assertEqual(from_record(json.loads(json.dumps(record))),obj)
        with self.assertRaises(ValueError):
            from_record({"kind":"ratio","numerator":"01","denominator":"1"})
        with self.assertRaises(ValueError):
            from_record({"kind":"cents-rational",
                         "numerator":"-0","denominator":"2"})
        with self.assertRaises(TypeError):
            from_record({"kind":"ediv","period":
                {"kind":"cents-rational","numerator":"1","denominator":"1"},
                "divisions":"2","steps":"1"})

    def test_property_group_laws(self):
        rng=random.Random(220)
        for _ in range(250):
            a,b,c=(Ratio(rng.randrange(1,5000),rng.randrange(1,5000))
                   for _ in range(3))
            self.assertEqual(a.compose(b).compose(c),
                             a.compose(b.compose(c)))
            self.assertEqual(a.compose(a.inverse()),Ratio(1))
            p,q,r=(rng.randrange(-1000,1000) for _ in range(3))
            x,y,z=[RationalCents(v,33) for v in (p,q,r)]
            self.assertEqual(x.compose(y).compose(z),x.compose(y.compose(z)))
            self.assertEqual(x.compose(x.inverse()),RationalCents(0))
            e,f=EqualDivision(Ratio(2),72,p),EqualDivision(Ratio(2),72,q)
            self.assertEqual(e.compose(f).cents_exact,
                             e.cents_exact+f.cents_exact)

    def test_approximation_is_explicit_not_identity(self):
        exact=RationalCents(50)
        edo=EqualDivision(Ratio(2),24,1)
        self.assertEqual(edo.cents_exact,exact.value)
        self.assertAlmostEqual(hz_approx(Ratio(440),edo),
                               hz_approx(Ratio(440),exact),places=10)
        self.assertAlmostEqual(hz_approx(Ratio(440),Ratio(3,2)),660,places=9)

    def test_reference_examples(self):
        payload=json.loads((root/"examples"/"casos-exactos.json").read_text())
        for case in payload["cases"]:
            ratio=from_record(case["sound"])
            self.assertEqual(to_record(ratio),case["sound"])
            self.assertTrue(case["id"])
            self.assertTrue(case["reference"]["name"])
            ref=from_record(case["reference"]["frequency_hz"])
            self.assertIsInstance(ref,Ratio)
            self.assertGreater(ref.value,0)


if __name__=="__main__":
    unittest.main()
