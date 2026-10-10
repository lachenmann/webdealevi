#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Print- and screen-scale study of original mother glyphs, not a font release."""
from __future__ import annotations
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from build_mothers import CODES, STAFF_SPACE, manifest

CANVAS=(1600,1360)
INK='#29232A'; MUTED='#5f5960'; ACCENT='#845e41'; LINE='#b6aba1'
PAPER='#f7f3eb'; CARD='#ffffff'; BORDER='#d5c9b8'

def ui_font(size:int,serif=False):
  paths=(
    ['/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf','/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf']
    if serif else
    ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'])
  for path in paths:
    try:return ImageFont.truetype(path,size)
    except OSError:pass
  return ImageFont.load_default()

def text_center(d,text,center_x,y,font,color):
  box=d.textbbox((0,0),text,font=font)
  d.text((center_x-(box[2]-box[0])/2,y),text,font=font,fill=color)

def glyph(d,name,font_path,x,y,font_px,fill=INK):
  music=ImageFont.truetype(str(font_path),int(font_px))
  d.text((x,y),chr(CODES[name]),font=music,fill=fill,anchor='ls')

def staff(d,x1,x2,center_y,space,stroke=LINE,width=1):
  for i in [-2,-1,0,1,2]:
    y=round(center_y+i*space)
    d.line([(x1,y),(x2,y)],fill=stroke,width=width)

def notehead(d,x,y,r=9):
  d.ellipse((x-r,y-r*.62,x+r,y+r*.62),fill=INK)
  d.line(((x+r-1,y),(x+r-1,y-r*3.9)),fill=INK,width=max(1,round(r*.22)))

def preview(font_path:Path,out:Path):
  img=Image.new('RGB',CANVAS,PAPER)
  d=ImageDraw.Draw(img)
  W,H=CANVAS
  d.rectangle((34,34,W-34,H-34),outline=BORDER,width=2)
  d.text((71,54),'ESFERAS MICROTONAL  ·  MATRICES v0.2',font=ui_font(34,True),fill=INK)
  d.text((73,112),'Bocetos tipográficos originales: bemol · becuadro · sostenido',font=ui_font(19),fill=MUTED)
  d.text((73,146),'La fuente v0.1 no se ha sustituido. Valores de afinación fuera de los glifos; aquí se estudian solo las formas.',font=ui_font(15),fill=ACCENT)
  names=[('flat','BEMOL','Asta + curva abierta'),('natural','BECUADRO','Dos astas desfasadas + dos uniones'),('sharp','SOSTENIDO','Dos astas + dos travesaños')]
  cards=[(73+i*484,198,73+i*484+460,724) for i in range(3)]
  for ((name,title,sub),(x1,y1,x2,y2)) in zip(names,cards):
    d.rounded_rectangle((x1,y1,x2,y2),radius=14,fill=CARD,outline=BORDER,width=2)
    text_center(d,title,(x1+x2)/2,y1+22,ui_font(24,True),INK)
    text_center(d,sub,(x1+x2)/2,y1+68,ui_font(15),MUTED)
    # Large but not poster-only: consider constructional details.
    glyph(d,name,font_path,(x1+x2)/2-30,y1+324,133)
    d.line((x1+34,y1+362,x2-34,y1+362),fill=BORDER,width=2)
    text_center(d,'Pauta · s = 14 px',(x1+x2)/2,y1+381,ui_font(16),ACCENT)
    ystaff=y1+459
    staff(d,x1+37,x2-37,ystaff,14)
    glyph(d,name,font_path,x1+142,ystaff,56)
    notehead(d,x1+265,ystaff,9)
    text_center(d,'Glifo SMuFL: U+'+f'{CODES[name]:04X}',(x1+x2)/2,y2-37,ui_font(14),MUTED)
  d.text((73,759),'PRUEBA A ESCALA DE PARTITURA',font=ui_font(23,True),fill=INK)
  d.text((74,806),'Mismo perfil de glifo a 7, 9, 12 y 16 px por espacio de pentagrama.',font=ui_font(16),fill=MUTED)
  ypositions=[890,982,1074,1166]
  for s,y in zip([7,9,12,16],ypositions):
    d.text((80,y-26),f's = {s} px',font=ui_font(18),fill=ACCENT)
    for j,name in enumerate(['flat','natural','sharp']):
      left=264+j*425
      staff(d,left,left+344,y,s,stroke=LINE,width=1)
      glyph(d,name,font_path,left+128,y,4*s)
      notehead(d,left+230,y,max(5,int(.65*s)))
  d.text((74,1275),'BORRADOR G1. Glifos convencionales de nueva factura; no derivados de curvas de MIDIDESI.',font=ui_font(15),fill=MUTED)
  d.text((74,1304),'Evaluar contraformas, ritmo de astas, grosor, anclajes y lectura en tamaños reales antes de diseñar microalteraciones.',font=ui_font(14),fill=ACCENT)
  out.parent.mkdir(parents=True,exist_ok=True)
  img.save(out)
  print('Preview saved',out,img.size)

if __name__=='__main__':
  p=argparse.ArgumentParser()
  p.add_argument('--font',required=True)
  p.add_argument('--out',required=True)
  args=p.parse_args()
  preview(Path(args.font),Path(args.out))
