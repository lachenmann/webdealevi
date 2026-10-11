import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {NOTATION_SIGNS,makeAccidentalGlyph,renderNoteAccidentals}
  from "../notacion-glyphs.mjs";
import {decomposeCents,NOTATION_SYSTEMS} from "../notacion-core.mjs";

function mockSvgDocument() {
  return {
    createElementNS(ns,name) {
      assert.equal(ns,"http://www.w3.org/2000/svg");
      return {
        tagName:name,attrs:{},children:[],textContent:"",
        setAttribute(k,v){this.attrs[k]=String(v);},
        append(...children){this.children.push(...children);}
      };
    }
  };
}
function flatten(root) {
  return [root,...root.children.flatMap(flatten)];
}
function withMockDocument(fn) {
  const before=globalThis.document;
  try { globalThis.document=mockSvgDocument(); return fn(); }
  finally { if(before===undefined) delete globalThis.document; else globalThis.document=before; }
}

test("todos los signos son vectoriales SVG y se crean sin una fuente externa",()=>{
  withMockDocument(()=>{
    for(const id of NOTATION_SIGNS) {
      const glyph=makeAccidentalGlyph(id,{x:200,y:125,color:"#fff"});
      assert.equal(glyph.tagName,"g");
      assert.equal(glyph.attrs["data-notation-glyph"],id);
      assert.ok(flatten(glyph).length>1,id+" sin trazos");
      assert.ok(!flatten(glyph).some(node=>node.tagName==="image"),
        id+" no debe depender de imágenes externas");
    }
  });
});

test("el bemol inverso de cuarto descendente es HUECO y el asta va a la derecha",()=>{
  withMockDocument(()=>{
    const down=makeAccidentalGlyph("reverse-flat-outline");
    const nodes=flatten(down);
    const bowl=nodes.find(node=>node.tagName==="path" &&
      node.attrs.d?.includes("M 9 -6 C"));
    assert.ok(bowl,"Debe existir la curva inversa trazada");
    assert.equal(bowl.attrs.fill,"none","La panza NO puede ir rellena");
    assert.ok(nodes.some(node=>node.tagName==="line" &&
      node.attrs.x1==="9" && node.attrs.x2==="9"),
      "El asta del bemol inverso debe estar a la derecha");
    assert.ok(!nodes.some(node=>node.tagName==="polygon"),
      "El bemol inverso hueco no contiene un polígono sólido");
  });
});

test("el ejemplar +150 conserva dos signos separados: sostenido + cuarto",()=>{
  withMockDocument(()=>{
    const target=mockSvgDocument().createElementNS("http://www.w3.org/2000/svg","svg");
    const p=decomposeCents(150,"quarter");
    const ids=renderNoteAccidentals(target,p,{right:195,y:157});
    assert.deepEqual(ids,["sharp","quarter-sharp"]);
    assert.deepEqual(target.children.map(n=>n.attrs["data-notation-glyph"]),ids);
    assert.equal(p.indicatedCents,150);
  });
});

test("la representación -50 únicamente escribe el bemol inverso hueco",()=>{
  withMockDocument(()=>{
    const target=mockSvgDocument().createElementNS("http://www.w3.org/2000/svg","svg");
    const p=decomposeCents(-50,"quarter");
    const ids=renderNoteAccidentals(target,p,{right:200,y:180});
    assert.deepEqual(ids,["reverse-flat-outline"]);
    assert.equal(target.children.length,1);
  });
});

test("eighth es etiqueta fraccionaria; sextos y doceavos tienen símbolos propios",()=>{
  withMockDocument(()=>{
    const expected=[
      ["sixth",-100/3,"diamond"],
      ["sixth",100/3,"pentagon"],
      ["eighth",-25,"eighth-down"],
      ["eighth",25,"eighth-up"],
      ["twelfth",-50/3,"triangle-half"],
      ["twelfth",50/3,"square"]
    ];
    for(const [system,value,id] of expected){
      const p=decomposeCents(value,system);
      const target=mockSvgDocument().createElementNS("http://www.w3.org/2000/svg","svg");
      assert.deepEqual(renderNoteAccidentals(target,p,{showNatural:true}),[id]);
      if(system==="eighth"){
        const txt=flatten(target).find(node=>node.tagName==="text");
        assert.equal(txt.textContent,"⅛");
      }
    }
  });
});

test("la web integra un único sistema sin Bravura ni sintaxis SMuFL dependiente",()=>{
  const dir=new URL("../",import.meta.url);
  const html=readFileSync(new URL("index.html",dir),"utf8");
  const score=readFileSync(new URL("escala.mjs",dir),"utf8");
  const ui=readFileSync(new URL("notacion-ui.mjs",dir),"utf8");
  const css=readFileSync(new URL("notacion.css",dir),"utf8");
  for(const sys of NOTATION_SYSTEMS){
    assert.match(html,new RegExp('value="'+sys.id+'"'));
  }
  assert.ok(html.includes('id="notation-key-svg"'));
  assert.ok(html.includes('id="fraction-score"'));
  assert.ok(score.includes('from "./notacion-glyphs.mjs?v=TYPO-20261010-01"'));
  assert.ok(ui.includes('from "./notacion-glyphs.mjs?v=TYPO-20261010-01"'));
  assert.ok(css.includes('@font-face'),"Leland se aloja localmente bajo licencia OFL");
  assert.ok(css.includes('./fonts/Leland.otf'),"Ruta Leland local");
  assert.ok(css.includes('./fonts/Ekmelos72edo.woff2'),"Reserva Ekmelos72 local");
  assert.ok(!css.includes('cdn.jsdelivr.net'),"No cargar fuentes desde CDN");
  assert.ok(ui.includes('document.fonts.load'),"La fuente se activa tras comprobar la carga");
  assert.ok(ui.includes('musicFontReady'),"Existe fallback SVG mientras no esté disponible");
  assert.ok(!score.includes("hasSmuflFont"),"La escala debe utilizar SVG");
});

test("el HTML y todo el grafo de módulos comparten el mismo identificador de cache",()=>{
  const dir=new URL("../",import.meta.url);
  const html=readFileSync(new URL("index.html",dir),"utf8");
  const expected="TYPO-20261010-01";
  assert.match(html,/id="notation-engine-state"/);
  assert.match(html,/data-expected-build="TYPO-20261010-01"/);
  for(const asset of ["monocordio.mjs","escala.mjs","notacion-ui.mjs",
    "armonia.mjs","estilos.css","escala.css","notacion.css","armonia.css"]){
    assert.ok(html.includes("./"+asset+"?v="+expected),
      "Archivo raíz sin identificación de caché: "+asset);
  }
  for(const file of ["monocordio.mjs","escala.mjs","notacion-ui.mjs",
    "armonia.mjs","armonia-core.mjs"]){
    const src=readFileSync(new URL(file,dir),"utf8");
    const imports=[...src.matchAll(/from\s+["'](\.\/[^"']+\.mjs(?:\?v=[^"']+)?)["']/g)];
    assert.ok(imports.length>0,file+" debe tener importaciones locales");
    for(const match of imports){
      assert.ok(match[1].endsWith("?v="+expected),
        file+" importa sin fijar versión "+match[1]);
    }
  }
  const ui=readFileSync(new URL("notacion-ui.mjs",dir),"utf8");
  assert.ok(ui.includes('dataset.ready = "true"'));
  assert.ok(ui.includes('window.__MONOCORDIO_VECTOR_BUILD'));
});

test("Leland cubre Stein–Zimmermann y preserva fallback de trazos si falta la fuente",()=>{
  withMockDocument(()=>{
    const el=makeAccidentalGlyph("reverse-flat-outline",{fontReady:true});
    const nodes=flatten(el);
    const symbol=nodes.find(x=>x.tagName==="text");
    assert.ok(symbol,"El glifo de Leland no se creó");
    assert.equal(symbol.textContent,String.fromCodePoint(0xE280));
    assert.equal(symbol.attrs["data-font-glyph"],"E280");
    assert.equal(symbol.attrs["class"],"monocordio-music-accidental");
    assert.ok(!nodes.some(x=>x.tagName==="polygon"));
    const fallback=makeAccidentalGlyph("reverse-flat-outline",{fontReady:false});
    assert.ok(flatten(fallback).some(x=>x.tagName==="path" && x.attrs.fill==="none"));
  });
});
