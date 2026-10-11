import {
  demonstrationForOffset, decomposeCents, getSystem,
  NOTATION_SYSTEMS, roundTo
} from "./notacion-core.mjs?v=TYPO-20261010-01";
import { renderNoteAccidentals } from "./notacion-glyphs.mjs?v=TYPO-20261010-01";

const byId = id => document.getElementById(id);
const modeSelect = byId("notation-mode");
const subdivisionSelect = byId("fraction-system");
const centsSlider = byId("demo-cents");
const score = byId("fraction-score");
const legend = byId("notation-key-svg");
const status = byId("demo-sound-status");
const NS = "http://www.w3.org/2000/svg";
const format = (value, precision=2) => new Intl.NumberFormat("es-CL", {
  minimumFractionDigits:precision, maximumFractionDigits:precision
}).format(roundTo(value,precision));
const signed = cents => (cents > 1e-9 ? "+" : cents < -1e-9 ? "−" : "") +
  format(Math.abs(cents)) + " ¢";
const make = (tag, attributes={}, text=null) => {
  const result = document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attributes)) result.setAttribute(key,String(value));
  if(text!==null) result.textContent=text;
  return result;
};

let audioContext = null;
let musicFontReady = false;
// Este valor guarda toda la precisión de los presets, incluso cuando
// el deslizador de presentación muestra solamente una décima.
let demoOffsetCents = 64;

function svgLabel(target, text, x, y, attrs={}) {
  target.append(make("text",{
    x,y,fill:"#eadac0","font-family":"system-ui, sans-serif",
    "font-size":15,"text-anchor":"middle",...attrs
  },text));
}

function drawGuide(target, x1,x2,yStart=78) {
  for(const dy of [0,20,40,60,80]) {
    target.append(make("line",{
      x1,x2,y1:yStart+dy,y2:yStart+dy,
      stroke:"#aeb3b7","stroke-width":1
    }));
  }
}

function renderLegend() {
  legend.replaceChildren();
  legend.append(
    make("rect",{x:0,y:0,width:960,height:245,fill:"#0f1218"}),
    make("line",{x1:20,y1:115,x2:940,y2:115,stroke:"#534954","stroke-width":1})
  );
  NOTATION_SYSTEMS.forEach((unit,index)=>{
    const cx=100+index*189;
    const label=unit.label;
    svgLabel(legend,label,cx,26,{"font-size":15,fill:"#f4d6a9"});
    const neg=decomposeCents(-unit.fractionCents,unit.id);
    const pos=decomposeCents(unit.fractionCents,unit.id);
    renderNoteAccidentals(legend,neg,{
      right:cx+9,y:74,scale:1.0,color:"#f2d9b4",showNatural:true,
      fontReady:musicFontReady
    });
    renderNoteAccidentals(legend,pos,{
      right:cx+9,y:164,scale:1.0,color:"#f2d9b4",showNatural:true,
      fontReady:musicFontReady
    });
    svgLabel(legend,signed(-unit.fractionCents),cx,112,{"font-size":13,fill:"#b5d5c9"});
    svgLabel(legend,signed(unit.fractionCents),cx,215,{"font-size":13,fill:"#b5d5c9"});
  });
  legend.setAttribute("aria-label",NOTATION_SYSTEMS.map(unit=>
    unit.label+": "+signed(-unit.fractionCents)+" y "+
    signed(unit.fractionCents)).join("; "));
}

function renderDemonstration() {
  const notation=demonstrationForOffset(demoOffsetCents,subdivisionSelect.value);
  const system=getSystem(subdivisionSelect.value);
  const signs=[notation.standardSign,notation.microSign].filter(Boolean);
  const description=signs.length ?
    (notation.standardSign ? "semitono "+signed(notation.semitoneCents) : "")+
    (notation.microSign ? (notation.standardSign ? " + " : "")+
    system.fraction+" tono "+(notation.step>0?"ascendente":"descendente") : "") :
    "becuadro / sin desplazamiento";
  byId("demo-cents-label").textContent=signed(demoOffsetCents);
  byId("demo-symbol-name").textContent=description;
  byId("demo-symbol-cents").textContent=signed(notation.indicatedCents);
  byId("demo-residual").textContent=signed(notation.residualCents);
  byId("demo-frequency").textContent=format(notation.frequencyHz)+" Hz";
  centsSlider.setAttribute("aria-valuetext",signed(demoOffsetCents));
  for(const button of document.querySelectorAll("[data-offset]")){
    button.setAttribute("aria-pressed",String(
      Math.abs(demoOffsetCents-Number(button.dataset.offset))<1e-8 &&
      subdivisionSelect.value===button.dataset.unit
    ));
  }
  score.setAttribute("aria-label","Do4 a "+format(notation.frequencyHz)+
    " hercios. "+description+". Desviación total "+signed(notation.totalCents)+
    "; desplazamiento de los signos "+signed(notation.indicatedCents)+
    "; corrección residual "+signed(notation.residualCents)+".");
  score.replaceChildren();
  score.append(make("rect",{x:0,y:0,width:480,height:240,fill:"#0d1014"}));
  drawGuide(score,35,449,74);
  if (musicFontReady) {
    score.append(make("text",{
      x:34,y:142,"font-size":76,
      "class":"monocordio-music-clef",
      fill:"#f1d4a4"
    },String.fromCodePoint(0xE050)));
  } else {
    svgLabel(score,"𝄞",48,152,{
      "font-family":"'Noto Music','Apple Symbols',serif",
      "font-size":68,fill:"#f1d4a4"
    });
  }
  score.append(make("line",{x1:227,y1:174,x2:274,y2:174,
    stroke:"#d6c9b4","stroke-width":2}));
  score.append(make("line",{x1:260,y1:174,x2:260,y2:134,
    stroke:"#eee0d0","stroke-width":2}));
  if (musicFontReady) {
    score.append(make("text",{
      x:237,y:174,"font-size":50,
      "class":"monocordio-music-notehead",
      fill:"#f0ddc5"
    },String.fromCodePoint(0xE0A4)));
  } else {
    score.append(make("ellipse",{
      cx:248,cy:174,rx:11,ry:7,fill:"#f0ddc5",
      transform:"rotate(-18 248 174)"
    }));
  }
  const renderedGlyphs = renderNoteAccidentals(score,notation,{
    right:207,y:174,scale:1,color:"#f0d6ad",showNatural:true,
    fontReady:musicFontReady
  });
  score.setAttribute("data-rendered-glyphs", renderedGlyphs.join(","));
  svgLabel(score,"Total "+signed(notation.totalCents),248,42,{
    "font-size":18,fill:"#ecd0a3"
  });
  svgLabel(score,"res. "+signed(notation.residualCents),370,183,{
    "font-size":13,fill:"#a7e1c7"
  });
  svgLabel(score,"Do4 · La4 = 440 Hz",248,226,{
    "font-size":15,fill:"#c7b8b5"
  });
}

function refreshMode() {
  const mode=modeSelect.value;
  const system=subdivisionSelect.value;
  byId("notation-mode-description").textContent=mode==="exact"
    ? "Modo pitagórico: alteración ordinaria y cents TOTALES. La altura y su razón no cambian."
    : "Modo contemporáneo: signo cromático + signo de fracción + cents RESIDUALES; el total permanece visible y la afinación es idéntica.";
  window.dispatchEvent(new CustomEvent("monocordio-notation-change",{
    detail:{mode,system}
  }));
  renderDemonstration();
}

modeSelect.addEventListener("change",refreshMode);
subdivisionSelect.addEventListener("change",refreshMode);
centsSlider.addEventListener("input",()=>{
  demoOffsetCents=Number(centsSlider.value);
  renderDemonstration();
});
for(const button of document.querySelectorAll("[data-offset]")){
  button.addEventListener("click",()=>{
    const unit=button.dataset.unit;
    if(!NOTATION_SYSTEMS.some(item=>item.id===unit)) return;
    demoOffsetCents=Number(button.dataset.offset);
    subdivisionSelect.value=unit;
    centsSlider.value=String(roundTo(demoOffsetCents,1));
    refreshMode();
  });
}

byId("play-demo-note").addEventListener("click",async()=>{
  const Audio=window.AudioContext || window.webkitAudioContext;
  if(!Audio){status.textContent="Este navegador no permite síntesis Web Audio.";return;}
  try{
    audioContext??=new Audio();
    if(audioContext.state!=="running") await audioContext.resume();
    const frequency=demonstrationForOffset(demoOffsetCents,subdivisionSelect.value).frequencyHz;
    const when=audioContext.currentTime+0.012;
    const envelope=audioContext.createGain();
    envelope.gain.setValueAtTime(0.0001,when);
    envelope.gain.exponentialRampToValueAtTime(0.15,when+0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001,when+1.15);
    envelope.connect(audioContext.destination);
    let live=5;
    for(let harmonic=1;harmonic<=5;harmonic++){
      const oscillator=audioContext.createOscillator();
      const partial=audioContext.createGain();
      oscillator.type="sine";
      oscillator.frequency.value=frequency*harmonic;
      partial.gain.value=1/(harmonic**1.75);
      oscillator.connect(partial);
      partial.connect(envelope);
      oscillator.start(when);
      oscillator.stop(when+1.16);
      oscillator.addEventListener("ended",()=>{
        oscillator.disconnect();
        partial.disconnect();
        if(--live===0) envelope.disconnect();
      },{once:true});
    }
    status.textContent="Do4: "+format(frequency)+" Hz. Desviación total "+signed(demoOffsetCents)+".";
  }catch{
    status.textContent="No se ha podido reproducir el ejemplo. Comprueba los permisos de audio.";
  }
});

renderLegend();
refreshMode();
const engineState = byId("notation-engine-state");
if (engineState) {
  engineState.dataset.activeBuild = "TYPO-20261010-01";
  engineState.dataset.ready = "true";
  engineState.textContent = "Motor SVG activo · TYPO-20261010-01 · alteraciones vectoriales verificadas.";
}
window.__MONOCORDIO_VECTOR_BUILD = "TYPO-20261010-01";

// Una fuente opcional no interrumpe nunca la notación: primero se dibuja SVG,
// después se actualizan las formas convencionales al cargar Leland local.
if (document.fonts?.load) {
  document.fonts.load('53px "LelandMonocordio"',
    String.fromCodePoint(0xE050,0xE0A4,0xE280,0xE282))
    .then(fonts=>{
      musicFontReady = fonts.length > 0;
      if (!musicFontReady) return;
      renderLegend();
      renderDemonstration();
      if (engineState) {
        engineState.dataset.musicFont = "Leland";
        engineState.textContent = "Motor SVG activo · Leland cargada · TYPO-20261010-01";
      }
      window.dispatchEvent(new CustomEvent("monocordio-music-font-ready",{
        detail:{ready:true,font:"Leland"}
      }));
    }).catch(()=>{
      // Fallback completo de glifos SVG; no altera afinación ni interfaz.
      musicFontReady = false;
    });
}

