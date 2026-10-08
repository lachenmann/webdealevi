import {
  demonstrationForOffset, getSystem, roundTo,
  REFERENCE_C4_12TET
} from "./notacion-core.mjs";

const byId = id => document.getElementById(id);
const modeSelect = byId("notation-mode");
const subdivisionSelect = byId("fraction-system");
const centsSlider = byId("demo-cents");
const score = byId("fraction-score");
const status = byId("demo-sound-status");
const SVG_NS = "http://www.w3.org/2000/svg";
const format = (value, precision = 2) => new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: precision, maximumFractionDigits: precision
}).format(roundTo(value,precision));
const signed = cents => (cents > 0.00000001 ? "+" : cents < -0.00000001 ? "−" : "")
  + format(Math.abs(cents)) + " ¢";
const make = (tag, attributes = {}, content = null) => {
  const element = document.createElementNS(SVG_NS, tag);
  for(const [key,value] of Object.entries(attributes)) element.setAttribute(key,String(value));
  if(content !== null) element.textContent = content;
  return element;
};
let fontReady = false;
let audioContext = null;

function showDemo() {
  const cents = Number(centsSlider.value);
  const notation = demonstrationForOffset(cents, subdivisionSelect.value);
  const system = getSystem(subdivisionSelect.value);
  const direction = notation.step > 0 ? "ascendente" : notation.step < 0 ? "descendente" : "";
  const symbolDescription = notation.step
    ? system.fraction + " tono " + direction + " (" + system.family + ")"
    : "sin alteración fraccionaria";
  byId("demo-cents-label").textContent = signed(cents);
  byId("demo-symbol-name").textContent = symbolDescription;
  byId("demo-symbol-cents").textContent = signed(notation.indicatedCents);
  byId("demo-residual").textContent = signed(notation.residualCents);
  byId("demo-frequency").textContent = format(notation.frequencyHz) + " Hz";
  for(const preset of document.querySelectorAll("[data-offset]")){
    preset.setAttribute("aria-pressed",String(Math.abs(cents-Number(preset.dataset.offset))<0.0001));
  }
  score.setAttribute("aria-label","Do4 a " + format(notation.frequencyHz) +
    " hercios; alteración " + symbolDescription + "; corrección adicional " +
    signed(notation.residualCents) + "; desviación total " + signed(cents));
  score.replaceChildren();
  score.append(make("rect",{x:0,y:0,width:480,height:240,fill:"#0d1014"}));
  for(const y of [74,94,114,134,154]) {
    score.append(make("line",{x1:35,y1:y,x2:449,y2:y,stroke:"#aeb4b6","stroke-width":1.2}));
  }
  score.append(make("text",{x:45,y:153,"font-size":69,"font-family":"'Noto Music','Apple Symbols',serif",fill:"#f1d4a4"},"𝄞"));
  score.append(make("line",{x1:227,y1:174,x2:272,y2:174,"stroke-width":2,stroke:"#d6c9b4"}));
  score.append(make("line",{x1:260,y1:174,x2:260,y2:134,"stroke-width":2,stroke:"#eee0d0"}));
  score.append(make("ellipse",{cx:248,cy:174,rx:11,ry:7,fill:"#f0ddc5",transform:"rotate(-18 248 174)"}));
  score.append(make("text",{x:245,y:42,"text-anchor":"middle",fill:"#ecd0a3","font-size":18},
    "Total " + signed(cents)));
  if(notation.step!==0) {
    const glyph = notation.isSmufl && fontReady;
    score.append(make("text", {
      x:glyph?201:137,y:glyph?183:181,
      "font-family":glyph?"BravuraMonocordio":"'Georgia',serif",
      "font-size":glyph?36:19,fill:"#f3d5a7",
      "text-anchor":glyph?"middle":"start"
    },glyph?String.fromCodePoint(notation.glyphCodepoint):notation.fallback));
  }
  score.append(make("text",{
    x:318,y:178,"font-size":14,fill:"#a7e1c7"
  },"res. " + signed(notation.residualCents)));
  score.append(make("text",{
    x:250,y:222,"font-size":15,"text-anchor":"middle",fill:"#c7b8b5"
  },"Do4 · La4 = 440 Hz"));
}

function updateMode() {
  const mode=modeSelect.value;
  const system=subdivisionSelect.value;
  byId("notation-mode-description").textContent = mode==="exact"
    ? "Modo pitagórico: el pentagrama muestra las alteraciones convencionales y la desviación TOTAL frente al temperamento igual."
    : "Modo contemporáneo: junto a la alteración convencional se añade una fracción de tono cuando procede. El signo «res.» indica la corrección ADICIONAL. El total continúa visible; la frecuencia original no cambia.";
  window.dispatchEvent(new CustomEvent("monocordio-notation-change",{
    detail:{mode,system}
  }));
  showDemo();
}

modeSelect.addEventListener("change",updateMode);
subdivisionSelect.addEventListener("change",updateMode);
centsSlider.addEventListener("input",showDemo);
document.querySelectorAll("[data-offset]").forEach(button=>{
  button.addEventListener("click",()=>{
    centsSlider.value=String(roundTo(Number(button.dataset.offset),1));
    showDemo();
  });
});

byId("play-demo-note").addEventListener("click",async ()=>{
  const Audio=window.AudioContext || window.webkitAudioContext;
  if(!Audio){status.textContent="Este navegador no dispone de audio Web API.";return;}
  try {
    audioContext??=new Audio();
    if(audioContext.state!=="running") await audioContext.resume();
    const frequency=demonstrationForOffset(Number(centsSlider.value),subdivisionSelect.value).frequencyHz;
    const start=audioContext.currentTime+0.01;
    const envelope=audioContext.createGain();
    envelope.gain.setValueAtTime(0.0001,start);
    envelope.gain.exponentialRampToValueAtTime(0.15,start+0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001,start+1.15);
    envelope.connect(audioContext.destination);
    let live=5;
    for(let h=1;h<=5;h++){
      const osc=audioContext.createOscillator();
      const partial=audioContext.createGain();
      osc.type="sine";osc.frequency.value=frequency*h;partial.gain.value=1/h**1.75;
      osc.connect(partial);partial.connect(envelope);
      osc.start(start);osc.stop(start+1.16);
      osc.addEventListener("ended",()=>{
        osc.disconnect();partial.disconnect();
        if(!--live)envelope.disconnect();
      },{once:true});
    }
    status.textContent="Ejemplo: "+format(frequency)+" Hz, desplazamiento total "+signed(Number(centsSlider.value))+".";
  }catch{
    status.textContent="No se ha podido reproducir el ejemplo. Comprueba el audio del navegador.";
  }
});

updateMode();
if(document.fonts && document.fonts.load) {
  document.fonts.load("36px BravuraMonocordio",String.fromCodePoint(0xE48E))
    .then(fonts=>{
      fontReady=fonts.length>0;
      showDemo();
      window.dispatchEvent(new CustomEvent("monocordio-smufl-ready",{detail:{ready:fontReady}}));
    }).catch(()=>{
      fontReady=false;
      showDemo();
      window.dispatchEvent(new CustomEvent("monocordio-smufl-ready",{detail:{ready:false}}));
    });
}
