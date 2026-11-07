// Aritmética racional exacta. Todo el tiempo musical de Telar pasa por aquí:
// una duración es una fracción de redonda, nunca un número de coma flotante.

const mcdBig = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

export class Fr {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new RangeError('Denominador cero');
    if (d < 0n) { n = -n; d = -d; }
    const g = mcdBig(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  mas(o) { return new Fr(this.n * o.d + o.n * this.d, this.d * o.d); }
  menos(o) { return new Fr(this.n * o.d - o.n * this.d, this.d * o.d); }
  por(o) { return new Fr(this.n * o.n, this.d * o.d); }
  entre(o) { return new Fr(this.n * o.d, this.d * o.n); }
  cmp(o) { const a = this.n * o.d, b = o.n * this.d; return a < b ? -1 : a > b ? 1 : 0; }
  igual(o) { return this.n === o.n && this.d === o.d; }
  aNumero() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}

export const fr = (n, d = 1) => new Fr(n, d);
export const CERO = fr(0);
export const UNO = fr(1);

export const esPotenciaDe2 = (x) => {
  const v = BigInt(x);
  return v > 0n && (v & (v - 1n)) === 0n;
};

/** Una fracción diádica tiene denominador potencia de 2: es escribible sin tuplas. */
export const esDiadica = (f) => esPotenciaDe2(f.d);

/** Fracción de la forma 1/2^k o 2^k. */
export const esPotenciaDe2Fr = (f) => esPotenciaDe2(f.n) && esPotenciaDe2(f.d);

export const mcd = (a, b) => Number(mcdBig(BigInt(a), BigInt(b)));
export const mcm = (a, b) => (a && b ? Math.abs(a * b) / mcd(a, b) : 0);

export const mcmBig = (a, b) => (a && b ? (a * b) / mcdBig(a, b) : 0n);
