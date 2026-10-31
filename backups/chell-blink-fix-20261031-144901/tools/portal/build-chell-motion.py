from PIL import Image, ImageDraw
from pathlib import Path
import json, argparse
script_dir=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description='Build Chell animation frames from the supplied Portal sprite sheet.')
parser.add_argument('--source',type=Path,default=Path.home()/'Downloads/portal/4pi5xfr6zecb1.png')
parser.add_argument('--output',type=Path,default=(script_dir.parent.parent/'assets/aperture/chell' if script_dir.name=='portal' and script_dir.parent.name=='tools' else script_dir))
args=parser.parse_args();h=args.output;h.mkdir(parents=True,exist_ok=True);im=Image.open(args.source).convert('RGBA')
clips={
 'idle':[(2+64*i,165,62,106) for i in range(6)],
 'move':[(2+64*i,293,62,107) for i in range(8)],
 'attack':[(0,424,66,93),(67,424,67,93),(0,424,66,93)],
 'cast':[(0,165,64,105),(0,659,75,150),(0,834,75,150),(76,834,74,150),(0,1009,66,91)],
 'hurt':[(0,542,88,94)],
 'jump':[(0,659,75,150)],
 'fall':[(0,834,75,150),(76,834,74,150)],
 'guard':[(0,424,66,93)],
}
sheet=Image.new('RGBA',(96*8,160*len(clips)));manifest={};preview=Image.new('RGB',(96*8,180*len(clips)),(38,43,53));draw=ImageDraw.Draw(preview)
for row,(name,rects) in enumerate(clips.items()):
 for j,(x,y,w,hh) in enumerate(rects):
  crop=im.crop((x,y,x+w,y+hh));pixels=crop.load()
  for yy in range(hh):
   for xx in range(w):
    r,g,b,a=pixels[xx,yy]
    if (r,g,b) in [(128,255,128),(64,128,0)]:pixels[xx,yy]=(0,0,0,0)
  # All frames share source pixel scale, horizontal center and foot anchor.
  sheet.alpha_composite(crop,(48-w//2,row*160+156-hh))
  preview.paste(crop,(j*96+48-w//2,row*180+176-hh),crop)
  draw.text((j*96+4,row*180+3),name+' '+str(j),fill='white')
 manifest[name]={'row':row,'frames':[row*8+j for j in range(len(rects))]}
sheet.save(h/'chell-motion.png');preview.save(h/'chell-contact.png');(h/'chell-motion.json').write_text(json.dumps(manifest,indent=2))
print('Built aligned sprite atlas and contact sheet:',len(clips),'clips')
