// Proyectos de partida. Cada uno enseña una idea distinta.

const hilos = (altura, densidad, dinamica, articulacion) => ({
  altura: { valores: altura, paso: 1, fase: 0, modo: 'ataque' },
  densidad: { valores: densidad, paso: 1, fase: 0, modo: 'ataque' },
  dinamica: { valores: dinamica, paso: 3, fase: 0, modo: 'ataque' },
  articulacion: { valores: articulacion, paso: 1, fase: 0, modo: 'ataque' },
});

const voz = (nombre, instrumento, patrones, h, unidad = 'pulso') => ({
  nombre, instrumento, ritmo: { patrones, unidad, paso: 1, fase: 0 }, hilos: h,
});

const proceso = (tipo, extra) => ({ tipo, voces: 'todas', inicio: 0, fin: 1, forma: 'lineal', ...extra });

export const EJEMPLOS = {
  trio: {
    nombre: 'Trío: campo multiplicado que se filtra',
    proyecto: {
      version: 1,
      titulo: 'Trío de hilos',
      semilla: 7,
      tempo: 48,
      tiempo: { compases: '4/4 3/8 3/10 2/4 5/16 3/4', numCompases: 12 },
      transicion: 'interpolar',
      campos: [
        { tipo: 'multiplicacion', modo: 'intervalos', a: 'Do3 Mi3 Sol#3 Si3', b: 'Do4 Re4+ Fa#4', compases: 6 },
        { tipo: 'espectro', fundamental: 'Sib1', parciales: '1-19', estiramiento: 1.04, compases: 6 },
      ],
      voces: [
        voz('Violín', 'violin', '1 1 1\n2(1 1 1) 1\n3(1 -1 1) 2(1 1)\n1 2(3 2) 1 -1', hilos('0 5 2 9 4 7 1', '1 1 2 1 1', 'pp f mp ff p', '- . - > _ . ^')),
        voz('Fagot', 'fagot', '3 2\n1 1 1 1 1\n2(1 1 1 1 1) 1\n-1 2 +1', hilos('3 0 6 1 8', '1', 'mf p pp f', '_ - . >')),
        voz('Violonchelo', 'violonchelo', '2(1 1) 3\n1 -1 1\n5(2(1 1 1) 3) 2', hilos('1 4 0 7 2 5', '1 1 1 2', 'p mp ff', '- ^ . _')),
      ],
      procesos: [
        proceso('subdivision', { desde: 0, hasta: 0.35, opciones: '3 5 7', inicio: 0.2, fin: 1 }),
        proceso('banda', { graveDesde: 'Do2', graveHasta: 'Sol3', agudoDesde: 'Do7', agudoHasta: 'La5', modo: 'silenciar', inicio: 0.4, fin: 1 }),
      ],
    },
  },
  fagot: {
    nombre: 'Fagot solo: tuplas dentro de tuplas',
    proyecto: {
      version: 1,
      titulo: 'Estudio de anidación',
      semilla: 3,
      tempo: 48,
      tiempo: { compases: '3/8 5/12 2/4 3/10 7/16 4/14', numCompases: 10 },
      transicion: 'corte',
      campos: [{ tipo: 'criba', expresion: '(5@0 | 7@2) & !3@1', desde: 'Sib1', hasta: 'Mib5', unidad: 'cuarto', compases: 10 }],
      voces: [
        voz('Fagot', 'fagot', '1 3(2 1 2(1 1 1)) 1\n2(1 1 1) -1 2\n5(1 1 3(1 1 1 1 1) 1) 3(1 1)\n1 +1 3(1 2)', hilos('0 11 3 17 6 1 9', '1', 'ppp f p mf pp ff', '- . ^ _ > !')),
      ],
      procesos: [proceso('rarefaccion', { desde: 0, hasta: 0.45, forma: 'campana' })],
    },
  },
  espectro: {
    nombre: 'Cuarteto: espectro con cuartos de tono',
    proyecto: {
      version: 1,
      titulo: 'Espectro que se abre',
      semilla: 11,
      tempo: 66,
      tiempo: { compases: '4/4 5/8 3/4 7/8', numCompases: 12 },
      transicion: 'interpolar',
      campos: [
        { tipo: 'espectro', fundamental: 'Mi1', parciales: '1-32', estiramiento: 1, compases: 4 },
        { tipo: 'espectro', fundamental: 'Mi1', parciales: '1-32', estiramiento: 1.12, compases: 4 },
        { tipo: 'multiplicacion', modo: 'anillo', a: 'Sol3 La#3', b: 'Do5 Fa5+', compases: 4 },
      ],
      voces: [
        voz('Flauta', 'flauta', '1 1 1 1 1\n3(1 1) 2\n1 2(1 1 1)', hilos('0 2 5 3 7', '1', 'p mf pp', '. - _ -')),
        voz('Clarinete', 'clarinete', '2 1 2\n1 1 1\n4(3 2) 1', hilos('6 1 4 0', '1', 'pp mp', '_ -')),
        voz('Viola', 'viola', '1 1\n3(1 1 1) 1\n1 2(1 1 1 1 1)', hilos('2 8 0 5 3 11', '1 2', 'mp f p', '- > .')),
        voz('Contrabajo', 'contrabajo', '3 -2\n2 3\n1 -1 1', hilos('0 3 1', '1', 'mf p', '_ - -')),
      ],
      procesos: [
        proceso('compresion', { desde: 1, hasta: 0.6, eje: 'La4', voces: [0, 1], forma: 'campana' }),
        proceso('dinamica', { desde: -2, hasta: 2 }),
      ],
    },
  },
  criba: {
    nombre: 'Dúo: cribas y ataques filtrados',
    proyecto: {
      version: 1,
      titulo: 'Criba y rarefacción',
      semilla: 21,
      tempo: 72,
      tiempo: { compases: '2+3/16 3/8 4/10 2/4', numCompases: 16 },
      transicion: 'corte',
      campos: [
        { tipo: 'criba', expresion: '4@1 | 7@3', desde: 'Do3', hasta: 'Do6', unidad: 'semitono', compases: 8 },
        { tipo: 'criba', expresion: '5@0 | 11@4', desde: 'Do3', hasta: 'Do6', unidad: 'cuarto', compases: 8 },
      ],
      voces: [
        voz('Oboe', 'oboe', '1 1 1\n2(1 1) 3(1 1 1)\n1 -1', hilos('0 4 1 6 2 9', '1', 'mf pp f p', '. - > _')),
        voz('Piano', 'piano', '1 3(1 1)\n2 1\n3(1 1 1 1 1) 1', hilos('7 2 12 5', '1 3 2', 'p ff mp', '- ^ .')),
      ],
      procesos: [
        proceso('cribaAtaques', { expresion: '!5@0', voces: [1], inicio: 0.25, fin: 0.75 }),
        proceso('rarefaccion', { desde: 0, hasta: 0.6, voces: 'todas', forma: 'exponencial', inicio: 0.5, fin: 1 }),
        proceso('fusion', { desde: 0, hasta: 0.4, forma: 'lineal' }),
      ],
    },
  },
};

export const EJEMPLO_INICIAL = 'trio';

/** Un punto de partida mínimo, para escribir todos los parámetros desde cero. */
export const proyectoEnBlanco = () => ({
  version: 1,
  titulo: 'Sin título',
  semilla: 1,
  tempo: 60,
  unidadTempo: '4',
  tiempo: { compases: '4/4', numCompases: 4 },
  transicion: 'corte',
  campos: [{ tipo: 'lista', notas: 'Do4 Mi4 Sol4', compases: 4 }],
  voces: [{
    nombre: 'Voz 1',
    instrumento: 'piano',
    ritmo: { patrones: '1', unidad: 'pulso', paso: 1, fase: 0 },
    hilos: {
      altura: { valores: 'Do4', paso: 1, fase: 0, modo: 'ataque' },
      densidad: { valores: '1', paso: 1, fase: 0, modo: 'ataque' },
      dinamica: { valores: 'mf', paso: 1, fase: 0, modo: 'ataque' },
      articulacion: { valores: '-', paso: 1, fase: 0, modo: 'ataque' },
    },
  }],
  procesos: [],
});

export const copiarProyecto = (p) => JSON.parse(JSON.stringify(p));
