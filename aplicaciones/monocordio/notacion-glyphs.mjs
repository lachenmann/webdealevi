/**
 * Signos vectoriales de microtonalidad. Adaptación visual de la lámina
 * suministrada por el autor: evita depender del glifo de una fuente.
 *
 * Convención editorial explícita:
 * - semitono: ♭/♯; cuarto: medio sostenido / bemol INVERSO HUECO;
 * - sexto: rombo (−1/6) y pentágono (+1/6);
 * - doceavo: medio triángulo (−1/12) y cuadrado (+1/12);
 * - octavo: fracción ⅛ y flecha, SIN atribución a una escuela histórica.
 * El valor auditivo exacto lo fija notacion-core.mjs, no la figura.
 */
const XMLNS = "http://www.w3.org/2000/svg";
const SUPPORTED_SIGNS = [
  "natural","sharp","flat","double-sharp","double-flat",
  "quarter-sharp","reverse-flat-outline","diamond","pentagon",
  "triangle-half","square","eighth-up","eighth-down"
];
export const NOTATION_SIGNS = Object.freeze([...SUPPORTED_SIGNS]);

function element(name, attributes={}, text=null) {
  const node = document.createElementNS(XMLNS,name);
  for(const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
  if(text!==null) node.textContent=text;
  return node;
}
function line(group,x1,y1,x2,y2,width=3,stroke="currentColor") {
  group.append(element("line",{x1,y1,x2,y2,stroke,
    "stroke-width":width,"stroke-linecap":"square"}));
}
function path(group,d,stroke="currentColor",fill="none",width=3) {
  group.append(element("path",{d,stroke,fill,
    "stroke-width":width,"stroke-linejoin":"round","stroke-linecap":"round"}));
}
function polygon(group,points) {
  group.append(element("polygon",{points,fill:"currentColor"}));
}

function flat(group,offset=0) {
  const g=element("g",{transform:`translate(${offset} 0)`});
  line(g,-6,-32,-6,24,3.4);
  path(g,"M -6 -5 C 3 -12 14 -7 14 4 C 14 16 2 22 -6 24", "currentColor","none",3.4);
  group.append(g);
}
function sharp(group,offset=0) {
  const g=element("g",{transform:`translate(${offset} 0)`});
  line(g,-8,-24,-8,22,3.2);
  line(g,8,-27,8,19,3.2);
  line(g,-15,-5,15,-12,4.4);
  line(g,-15,12,15,5,4.4);
  group.append(g);
}
function natural(group) {
  line(group,-8,-23,-8,19,3.1);
  line(group,8,-20,8,23,3.1);
  line(group,-8,-5,8,-10,3.4);
  line(group,-8,10,8,5,3.4);
}

/**
 * Anclar cada glifo a coordenadas propias (0,0) en centro vertical de la nota.
 * Al devolver un nodo SVG <g>, los tests DOM pueden identificar cada símbolo
 * sin examinar tipografías instaladas.
 */
export function makeAccidentalGlyph(id,options={}) {
  if(!SUPPORTED_SIGNS.includes(id)) throw new RangeError("Signo vectorial desconocido: "+id);
  const color=options.color || "#f0d6ad";
  const scale=options.scale ?? 1;
  const group=element("g",{
    "data-notation-glyph":id,
    fill:color,color,
    "aria-hidden":"true",
    transform:`translate(${options.x ?? 0} ${options.y ?? 0}) scale(${scale})`
  });
  switch(id){
    case "natural": natural(group);break;
    case "flat": flat(group);break;
    case "sharp": sharp(group);break;
    case "double-flat": flat(group,-9);flat(group,10);break;
    case "double-sharp":
      // Signo de dobles cruces, no la letra x de una fuente de texto.
      polygon(group,"-15,-14 -9,-20 0,-10 9,-20 15,-14 6,-4 15,7 9,13 0,3 -9,13 -15,7 -6,-4");
      break;
    case "quarter-sharp":
      // Medio sostenido (un asta, dos travesaños oblicuos).
      line(group,-3,-29,-3,27,3.3);
      polygon(group,"-13,-8 12,-15 12,-7 -13,0");
      polygon(group,"-13,9 12,2 12,10 -13,17");
      break;
    case "reverse-flat-outline":
      // ¡Sin relleno! El asta va A LA DERECHA y la panza a la izquierda.
      line(group,9,-32,9,24,3.4);
      path(group,"M 9 -6 C 0 -12 -13 -7 -13 4 C -13 16 -1 22 9 24",
        "currentColor","none",3.4);
      break;
    case "diamond": polygon(group,"0,-17 15,0 0,17 -15,0");break;
    case "pentagon": polygon(group,"-16,-8 -6,-16 7,-16 16,-8 0,15");break;
    case "triangle-half": polygon(group,"-15,-13 15,-13 15,14");break;
    case "square": group.append(element("rect",{
      x:-13,y:-13,width:26,height:26,fill:"currentColor"
    }));break;
    case "eighth-up":
    case "eighth-down": {
      const upwards=id==="eighth-up";
      group.append(element("text",{
        x:-17,y:8,"font-size":21,"font-family":"Georgia,serif",
        "font-weight":"600",fill:"currentColor"
      },"⅛"));
      line(group,16,-18,16,18,2.8);
      polygon(group,upwards ?
        "9,-16 16,-29 23,-16" : "9,16 16,29 23,16");
      break;
    }
  }
  return group;
}

/**
 * Glifos inmediatamente antes de la cabeza de nota, ordenados de izquierda
 * a derecha: alteración ordinaria de la nota, semitonos añadidos, fracción.
 * opts.right es el último centro de signo a la izquierda de la cabeza.
 */
export function renderNoteAccidentals(target,plan,opts={}) {
  const ids=[];
  if(plan.baseAccidental===-1) ids.push("flat");
  if(plan.baseAccidental===1) ids.push("sharp");
  if(plan.standardSign) ids.push(plan.standardSign);
  if(plan.microSign) ids.push(plan.microSign);
  if(ids.length===0 && opts.showNatural) ids.push("natural");
  const spacing=opts.spacing ?? 35;
  const x=opts.right ?? 0;
  const y=opts.y ?? 0;
  const scale=opts.scale ?? 0.95;
  for(let i=0;i<ids.length;i++) {
    target.append(makeAccidentalGlyph(ids[i],{
      x:x-(ids.length-1-i)*spacing,y,scale,
      color:opts.color || "#f0d6ad"
    }));
  }
  return ids;
}
