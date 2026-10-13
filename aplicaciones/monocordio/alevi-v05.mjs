/**
 * Alevi Microtonal v0.5 — perfil de uso experimental en el laboratorio.
 * El glifo se interpreta SIEMPRE desde la nota natural; NO es un modificador
 * sucesivo de una alteración previamente escrita.
 * Perfil: tono temperado = 200 cents; 24 unidades enteras por tono.
 * Las claves/cabezas de nota continúan procediendo de Leland.
 * Códigos U+F000..U+F023 privados DE ESTA FUENTE: NO son SMuFL.
 */
export const ALEVI_VERSION = "0.5";
export const TONE_CENTS = 200;
export const TICKS_PER_TONE = 24;
const MAGNITUDES = Object.freeze([
  ["1/4",6,"toneQuarter",0xF000,0xF001],
  ["1/6",4,"toneSixth",0xF002,0xF003],
  ["1/8",3,"toneEighth",0xF004,0xF005],
  ["1/12",2,"toneTwelfth",0xF006,0xF007],
  ["1/3",8,"tone1of3",0xF008,0xF009],
  ["3/8",9,"tone3of8",0xF00A,0xF00B],
  ["5/12",10,"tone5of12",0xF00C,0xF00D],
  ["7/12",14,"tone7of12",0xF00E,0xF00F],
  ["5/8",15,"tone5of8",0xF010,0xF011],
  ["2/3",16,"tone2of3",0xF012,0xF013],
  ["3/4",18,"tone3of4",0xF014,0xF015],
  ["5/6",20,"tone5of6",0xF016,0xF017],
  ["7/8",21,"tone7of8",0xF018,0xF019],
  ["11/12",22,"tone11of12",0xF01A,0xF01B],
  ["5/4",30,"tone5of4",0xF01C,0xF01D],
  ["7/6",28,"tone7of6",0xF01E,0xF01F],
  ["9/8",27,"tone9of8",0xF020,0xF021],
  ["13/12",26,"tone13of12",0xF022,0xF023]
]);
function entry(name,fraction,direction,ticks,codepoint) {
  return Object.freeze({
    name,fraction,direction,ticks,codepoint,
    cents:ticks*TONE_CENTS/TICKS_PER_TONE
  });
}
export const ALEVI_MICROTONES = Object.freeze(MAGNITUDES.flatMap(([fraction,ticks,base,up,down])=>[
  entry(base+"Up",fraction,1,ticks,up),
  entry(base+"Down",fraction,-1,-ticks,down)
]));
export const ALEVI_CONVENTIONAL = Object.freeze([
  entry("accidentalDoubleFlat","1",-1,-24,0xE264),
  entry("accidentalFlat","1/2",-1,-12,0xE260),
  entry("accidentalNatural","0",0,0,0xE261),
  entry("accidentalSharp","1/2",1,12,0xE262),
  entry("accidentalDoubleSharp","1",1,24,0xE263)
]);
export const ALEVI_GLYPHS = Object.freeze([...ALEVI_CONVENTIONAL,...ALEVI_MICROTONES]);
const BY_TICKS = new Map(ALEVI_GLYPHS.map(x=>[x.ticks,x]));
if (BY_TICKS.size!==ALEVI_GLYPHS.length) throw new Error("Colisión de valores Alevi v0.5");
/**
 * Solo admite las alteraciones de valor EXACTO presentes en la fuente.
 * La selección matemática de la altura continúa en notacion-core.mjs.
 */
export function aleviGlyphForCents(cents) {
  if (!Number.isFinite(cents)) return null;
  const ticks=cents*TICKS_PER_TONE/TONE_CENTS;
  const nearest=Math.round(ticks);
  if (Math.abs(ticks-nearest)>1e-8) return null;
  return BY_TICKS.get(nearest)??null;
}
