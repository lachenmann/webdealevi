// Lectores independientes de los exportadores: comprueban los archivos tal como
// salen, sin reutilizar la lógica que los escribió.

/** XML mínimo: { nombre, attrs, hijos, texto }. Lanza si está mal formado. */
export function leerXML(xml) {
  const limpio = xml.replace(/<\?xml[^>]*\?>/, '').replace(/<!DOCTYPE[^>]*>/, '');
  const re = /<(\/?)([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
  const raiz = { nombre: '#', hijos: [], attrs: {}, texto: '' };
  const pila = [raiz];
  let m;
  let fin = 0;
  while ((m = re.exec(limpio))) {
    if (m.index !== fin) throw new Error(`XML mal formado cerca de ${limpio.slice(fin, fin + 40)}`);
    fin = re.lastIndex;
    if (m[5] !== undefined) {
      pila[pila.length - 1].texto += m[5].trim();
    } else if (m[1]) {
      const n = pila.pop();
      if (n.nombre !== m[2]) throw new Error(`Etiqueta </${m[2]}> cierra <${n.nombre}>`);
    } else {
      const attrs = {};
      for (const a of m[3].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
      const nodo = { nombre: m[2], attrs, hijos: [], texto: '' };
      pila[pila.length - 1].hijos.push(nodo);
      if (!m[4]) pila.push(nodo);
    }
  }
  if (fin !== limpio.length) throw new Error('XML mal formado al final');
  if (pila.length !== 1) throw new Error(`Falta cerrar <${pila[pila.length - 1].nombre}>`);
  return raiz.hijos[0];
}

export const hijos = (n, nombre) => n.hijos.filter((h) => h.nombre === nombre);
export const hijo = (n, nombre) => n.hijos.find((h) => h.nombre === nombre);

/** SMF → { formato, ppq, pistas: [{ eventos: [{tick, tipo, canal, a, b, datos}] }] } */
export function leerMIDI(bytes) {
  const b = Uint8Array.from(bytes);
  let i = 0;
  const u32 = () => (b[i++] * 2 ** 24) + (b[i++] << 16) + (b[i++] << 8) + b[i++];
  const u16 = () => (b[i++] << 8) + b[i++];
  const etiqueta = () => String.fromCharCode(b[i++], b[i++], b[i++], b[i++]);
  if (etiqueta() !== 'MThd') throw new Error('Falta MThd');
  if (u32() !== 6) throw new Error('Cabecera inesperada');
  const formato = u16();
  const n = u16();
  const ppq = u16();
  const pistas = [];
  for (let t = 0; t < n; t++) {
    if (etiqueta() !== 'MTrk') throw new Error('Falta MTrk');
    const largo = u32();
    const fin = i + largo;
    const eventos = [];
    let tick = 0;
    let estado = 0;
    let terminada = false;
    while (i < fin) {
      let d = 0;
      let c;
      do { c = b[i++]; d = d * 128 + (c & 0x7f); } while (c & 0x80);
      tick += d;
      if (b[i] & 0x80) estado = b[i++];
      if (estado === 0xff) {
        const tipo = b[i++];
        let l = 0;
        do { c = b[i++]; l = l * 128 + (c & 0x7f); } while (c & 0x80);
        eventos.push({ tick, tipo: 'meta', meta: tipo, datos: b.slice(i, i + l) });
        i += l;
        if (tipo === 0x2f) terminada = true;
      } else {
        const alto = estado & 0xf0;
        const canal = estado & 0x0f;
        const x = b[i++];
        const y = alto === 0xc0 || alto === 0xd0 ? 0 : b[i++];
        eventos.push({ tick, tipo: alto, canal, a: x, b: y });
      }
    }
    if (!terminada) throw new Error('Pista sin fin de pista');
    if (i !== fin) throw new Error('Longitud de pista incorrecta');
    pistas.push({ eventos });
  }
  if (i !== b.length) throw new Error('Bytes sobrantes');
  return { formato, ppq, pistas };
}

/** Pares nota-on/nota-off de una pista: { inicio, fin, nota, canal, velocidad }. */
export function notasDePista(pista) {
  const abiertas = new Map();
  const notas = [];
  for (const e of pista.eventos) {
    if (e.tipo !== 0x90 && e.tipo !== 0x80) continue;
    const k = `${e.canal}.${e.a}`;
    if (e.tipo === 0x90 && e.b > 0) {
      if (abiertas.has(k)) {
        const pendiente = abiertas.get(k);
        notas.push({ inicio: pendiente.tick, fin: e.tick, nota: e.a, canal: e.canal, velocidad: pendiente.b, solapada: true });
      }
      abiertas.set(k, e);
    } else {
      const on = abiertas.get(k);
      if (!on) throw new Error(`Nota apagada sin encender: ${k} en ${e.tick}`);
      notas.push({ inicio: on.tick, fin: e.tick, nota: e.a, canal: e.canal, velocidad: on.b });
      abiertas.delete(k);
    }
  }
  if (abiertas.size) throw new Error('Notas sin apagar');
  return notas.sort((a, b) => a.inicio - b.inicio || a.nota - b.nota);
}

/** Generador pseudoaleatorio pequeño, solo para las pruebas. */
export function dado(semilla) {
  let s = semilla >>> 0 || 1;
  const r = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
  return {
    r,
    entero: (a, b) => a + Math.floor(r() * (b - a + 1)),
    uno: (lista) => lista[Math.floor(r() * lista.length)],
  };
}

/** Patrón aleatorio en la sintaxis de Telar. */
export function patronAzar(d, prof = 0) {
  const n = d.entero(1, 5);
  const partes = [];
  for (let i = 0; i < n; i++) {
    const peso = d.entero(1, 5);
    const x = d.r();
    if (prof < 3 && x < 0.3) partes.push(`${peso}(${patronAzar(d, prof + 1)})`);
    else if (x < 0.42) partes.push(`-${peso}`);
    else if (x < 0.5) partes.push(`+${peso}`);
    else partes.push(`${peso}`);
  }
  return partes.join(' ');
}

const METROS = ['4/4', '3/4', '2/4', '3/8', '5/8', '7/8', '5/16', '2+3/16', '7/16', '3/10', '4/10', '5/12', '3/12', '5/6', '4/14', '3/7', '7/9', '1/4', '13/16', '11/20', '2/1'];
const INSTR = ['flauta', 'oboe', 'clarinete', 'fagot', 'violin', 'viola', 'violonchelo', 'contrabajo', 'piano'];

export function proyectoAzar(sem) {
  const d = dado(sem * 2654435761 + 1);
  const hilo = (valores) => ({ valores, paso: d.entero(1, 3), fase: d.entero(0, 3), modo: d.r() < 0.2 ? 'tiempo' : 'ataque' });
  const lista = (f, n) => Array.from({ length: d.entero(1, n) }, f).join(' ');
  const campos = [
    { tipo: 'multiplicacion', modo: d.uno(['intervalos', 'anillo']), a: 'Do3 Mi3+ Sol#3', b: 'Re4 Fa4 La-4', compases: d.entero(1, 5) },
    { tipo: 'criba', expresion: d.uno(['5@0 | 7@2', '(4@1 | 3@0) & !5@2', '2@0']), desde: 'Do2', hasta: 'Do7', unidad: d.uno(['cuarto', 'semitono']), compases: d.entero(1, 5) },
    { tipo: 'espectro', fundamental: d.uno(['Do1', 'Sib1', 'Mi2']), parciales: '1-24', estiramiento: d.uno([1, 0.93, 1.1]), compases: d.entero(1, 5) },
  ];
  const nv = d.entero(1, 4);
  const procs = [];
  const tiposP = [
    () => ({ tipo: 'subdivision', desde: 0, hasta: d.r(), opciones: '3 5 7 2' }),
    () => ({ tipo: 'fusion', desde: 0, hasta: d.r() }),
    () => ({ tipo: 'rarefaccion', desde: d.r() * 0.5, hasta: d.r() }),
    () => ({ tipo: 'cribaAtaques', expresion: '3@0 | 2@1' }),
    () => ({ tipo: 'banda', graveDesde: 'Do2', graveHasta: 'Do4', agudoDesde: 'Do7', agudoHasta: 'Do5', modo: d.uno(['silenciar', 'plegar']) }),
    () => ({ tipo: 'transposicion', desde: -3.5, hasta: 7 }),
    () => ({ tipo: 'compresion', desde: 1.3, hasta: 0.4, eje: 'La4' }),
    () => ({ tipo: 'dinamica', desde: -3, hasta: 3 }),
  ];
  for (let i = d.entero(0, 4); i > 0; i--) {
    procs.push({ voces: 'todas', inicio: d.uno([0, 0.2]), fin: d.uno([0.8, 1]), forma: d.uno(['lineal', 'exponencial', 'campana']), ...d.uno(tiposP)() });
  }
  return {
    version: 1,
    titulo: `Azar ${sem}`,
    semilla: sem,
    tempo: d.entero(30, 140),
    tiempo: { compases: lista(() => d.uno(METROS), 6), numCompases: d.entero(1, 10) },
    transicion: d.uno(['corte', 'interpolar']),
    campos: Array.from({ length: d.entero(1, 3) }, () => d.uno(campos)),
    voces: Array.from({ length: nv }, (_, i) => ({
      nombre: `V${i + 1}`,
      instrumento: d.uno(INSTR),
      ritmo: { patrones: Array.from({ length: d.entero(1, 4) }, () => patronAzar(d)).join('\n'), unidad: d.uno(['pulso', 'compas']), paso: d.entero(1, 2), fase: d.entero(0, 2) },
      hilos: {
        altura: hilo(lista(() => d.entero(0, 20), 7)),
        densidad: hilo(lista(() => d.entero(1, 4), 4)),
        dinamica: hilo(lista(() => d.uno(['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff']), 5)),
        articulacion: hilo(lista(() => d.uno(['-', '.', '!', '_', '>', '^']), 5)),
      },
    })),
    procesos: procs,
  };
}
