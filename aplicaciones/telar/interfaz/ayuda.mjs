// Los ejemplos de la ayuda los calcula el propio motor: no pueden desviarse de la app.

import { generar } from '../nucleo/motor.mjs';
import { evaluarCampo, nombreAltura } from '../nucleo/armonia.mjs';
import { grabar } from './grabado.mjs';

/** Un patrón en un compás, sobre una sola nota, para ver solo el ritmo. */
export function partituraDeEjemplo(patron, compas) {
  const hilo = (valores) => ({ valores, paso: 1, fase: 0, modo: 'ataque' });
  const part = generar({
    version: 1,
    titulo: 'Ejemplo',
    semilla: 1,
    tempo: 60,
    tiempo: { compases: compas, numCompases: 1 },
    transicion: 'corte',
    campos: [{ tipo: 'lista', notas: 'Si4', compases: 1 }],
    voces: [{
      nombre: '',
      instrumento: 'violin',
      ritmo: { patrones: patron, unidad: 'compas', paso: 1, fase: 0 },
      hilos: { altura: hilo('0'), densidad: hilo('1'), dinamica: hilo('-'), articulacion: hilo('-') },
    }],
    procesos: [],
  });
  part.etiquetas = [''];
  return part;
}

export const alturasDeEjemplo = (campo) => evaluarCampo(campo).map((n) => nombreAltura(n.q)).join(' ');

if (typeof document !== 'undefined') {
  const ancho = Math.min(560, document.querySelector('.ayuda-doc').clientWidth - 8);
  for (const f of document.querySelectorAll('[data-patron]')) {
    const { svg } = grabar(partituraDeEjemplo(f.dataset.patron, f.dataset.compas), { ancho, s: 7 });
    const hoja = document.createElement('div');
    hoja.className = 'hoja';
    hoja.innerHTML = svg;
    f.prepend(hoja);
  }
  for (const p of document.querySelectorAll('[data-campo]')) {
    p.append(` ${alturasDeEjemplo(JSON.parse(p.dataset.campo))}`);
  }
}
