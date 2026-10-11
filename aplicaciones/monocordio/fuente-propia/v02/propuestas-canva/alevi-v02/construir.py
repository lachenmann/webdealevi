from pathlib import Path
import ast,json,csv
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont
P=Path(__file__).parent
# Maestros originales v01, preservados junto a este constructor.
base=json.loads((P/'base-v01.json').read_text())
def transform(d,m):
 p=SVGPathPen(None);parse_path(d,TransformPen(p,m));return p.getCommands()
def bar(y,x0=0,x1=190):
 return f'M {x0} {y} L {x1} {y+60} L {x1} {y-10} L {x0} {y-70} Z'
stem='M 80 -330 L 80 345 L 108 357 L 108 -318 Z'
# Familia ascendente: un asta; dos barras, una barra, dos barras con remate, tres barras.
sharp4=stem+bar(115)+bar(-95)
sharp6=stem+bar(10)
sharp8=stem+bar(115)+bar(-95)+' M 160 175 L 190 175 L 190 240 L 160 228 Z M 0 -165 L 30 -155 L 30 -225 L 0 -235 Z'
sharp12=stem+bar(185)+bar(10)+bar(-165)
flat4=transform(base['accidentalFlat'],(-1,0,0,1,205,0))
# Bemol inverso abierto: cuenco con boca visible junto al asta.
openflat='M 175 -125 L 175 600 L 205 608 L 205 -125 Z M 145 83 C 80 140 4 124 4 55 C 4 -24 107 -89 175 -125 L 175 -79 C 115 -52 49 -8 48 53 C 48 92 92 106 132 63 Z'
flat6=openflat
flat8=openflat+' M 110 245 L 245 288 L 245 235 L 110 192 Z'
flat12=flat8+' M 110 360 L 245 403 L 245 350 L 110 307 Z'
micro=[('toneQuarterUp',4,1,sharp4,'Un asta y dos barras'),('toneQuarterDown',4,-1,flat4,'Bemol invertido cerrado'),('toneSixthUp',6,1,sharp6,'Un asta y una barra'),('toneSixthDown',6,-1,flat6,'Bemol invertido abierto'),('toneEighthUp',8,1,sharp8,'Dos barras con remates en escuadra'),('toneEighthDown',8,-1,flat8,'Cuenco abierto y una barra alta'),('toneTwelfthUp',12,1,sharp12,'Un asta y tres barras'),('toneTwelfthDown',12,-1,flat12,'Cuenco abierto y dos barras altas')]
paths={**base,**{n:d for n,_,_,d,_ in micro}}
fb=FontBuilder(1000,isTTF=True);order=['.notdef','space']+list(paths);fb.setupGlyphOrder(order)
basecodes=[0x266F,0x266D,0x266E,0x1D12A,0x1D12B]; smufl=[0xE262,0xE260,0xE261,0xE263,0xE264]
cmap={32:'space',**dict(zip(basecodes,base)),**dict(zip(smufl,base)),**{0xF000+i:v[0] for i,v in enumerate(micro)}}
fb.setupCharacterMap(cmap);g={};metrics={}
from fontTools.pens.boundsPen import BoundsPen
for n in order:
 pen=TTGlyphPen(None)
 if n in paths: parse_path(paths[n],TransformPen(Cu2QuPen(pen,1.0,reverse_direction=True),(1,0,0,1,50,0)))
 g[n]=pen.glyph()
 b=BoundsPen(None)
 if n in paths: parse_path(paths[n],b)
 metrics[n]=(int(b.bounds[2]+100) if b.bounds else 250,50 if b.bounds else 0)
fb.setupGlyf(g);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=850,descent=-450)
fb.setupNameTable({'familyName':'Alevi Microtonal','styleName':'Regular','uniqueFontIdentifier':'AleviMicrotonal-0.2','fullName':'Alevi Microtonal Regular','psName':'AleviMicrotonal-Regular','version':'Version 0.2'})
fb.setupOS2(sTypoAscender=850,sTypoDescender=-450,sTypoLineGap=0,usWinAscent=850,usWinDescent=450);fb.setupPost();fb.setupMaxp();fb.save(P/'AleviMicrotonal-Regular.ttf')
for n,d in paths.items():
 (P/(n+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -650 520 1080"><g transform="scale(1,-1)"><path d="{d}" fill="black"/></g></svg>')
with (P/'mapa.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['glifo','Unicode privado','fraccion de tono','cents','caracter','forma'])
 for i,(n,q,s,d,desc) in enumerate(micro):w.writerow([n,f'U+{0xF000+i:04X}',f'{s:+d}/{q}',s*200/q,chr(0xF000+i),desc])
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1600"><rect width="1500" height="1600" fill="#f8f5ef"/><text x="65" y="70" font-family="serif" font-size="36">ALEVI / MICROTONAL · ESTUDIO 02</text><text x="65" y="110" font-family="sans-serif" font-size="18" fill="#666">Sistema propio: signos sin cifras ni flechas · tono = 200 cents</text>']
labels=['CUARTOS · 50 cents','SEXTOS · 33⅓ cents','OCTAVOS · 25 cents','DOCEAVOS · 16⅔ cents']
for r in range(4):
 y=260+r*330
 svg.append(f'<text x="65" y="{y-65}" font-family="sans-serif" font-size="21">{labels[r]}</text>')
 for j in range(2):
  n,q,s,d,desc=micro[r*2+j]; x=560+j*500
  svg.append(f'<g transform="translate({x},{y}) scale(.19,-.19)"><path d="{d}"/></g><text x="{x+85}" y="{y+25}" font-family="serif" font-size="21">{"Sube" if s==1 else "Baja"} 1/{q} de tono</text>')
  for yy in range(y+95,y+176,20):svg.append(f'<path d="M {x-55} {yy} H {x+210}" stroke="#999" stroke-width="1"/>')
  svg.append(f'<g transform="translate({x},{y+135}) scale(.08,-.08)"><path d="{d}"/></g><ellipse cx="{x+62}" cy="{y+135}" rx="11" ry="7" transform="rotate(-20 {x+62} {y+135})"/><path d="M {x+72} {y+133} V {y+73}" stroke="black" stroke-width="1.6"/>')
svg.append('<text x="65" y="1560" font-family="sans-serif" font-size="17" fill="#666">Prototipo para revisión: la leyenda define los valores. No implica reproducción ni integración automática en LilyPond.</text></svg>')
(P/'muestra-microtonal.svg').write_text(''.join(svg))
(P/'LEEME.txt').write_text('ALEVI MICROTONAL — ESTUDIO 02\n13 glifos: 5 tradicionales preservados + 8 microtonales nuevos.\nNotación propia. Cada signo establece una alteración absoluta desde la nota natural: ±1/4, ±1/6, ±1/8, ±1/12 de un tono de 200 cents. No expresa una coma de afinación justa.\nLa cantidad de barras no es un multiplicador de altura: cada contorno tiene el valor específico de mapa.csv. Una leyenda debe acompañar las partituras.\nNo se han diseñado aún los múltiplos (3/4, 5/6, etc.) ni combinaciones con los signos tradicionales.\nSVG editables; fuente TTF instalable. Los glifos nuevos usan códigos privados U+F000 a U+F007; copia los caracteres desde mapa.csv y aplica Alevi Microtonal. No son asignaciones SMuFL oficiales.\nTamaño: 1000 unidades por em; espacio de pentagrama 250 unidades. Origen vertical musical y=0.\nNo es una fuente musical completa ni reemplazo directo de Emmentaler. La fuente por sí sola no configura afinación, MIDI ni reglas de accidentales.\nContornos originales de esta propuesta, basados en el estudio 01 inspirado en el estilo clásico de LilyPond.\nconstruir.py y base-v01.json permiten regenerar todos los archivos con fontTools.\nPendiente: elección definitiva de contornos, espaciado, hinting y pruebas de lectura a tamaño impreso.\n')
f=TTFont(P/'AleviMicrotonal-Regular.ttf'); assert len(set(f.getBestCmap().values())-{'space'})==13
for n in paths:
 assert f['glyf'][n].numberOfContours>0
print('Verificados 13 glifos, códigos y contornos; v01 conservada.')
