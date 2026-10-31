from PIL import Image,ImageDraw
from pathlib import Path
import json,argparse,shutil

p=argparse.ArgumentParser();p.add_argument('--game',type=Path,default=Path(r'C:/Users/anoob/Downloads/dandy_s_heroes_by_scraps/dandys heroes'));p.add_argument('--source',type=Path,default=Path.home()/'Downloads/portal/4pi5xfr6zecb1.png');p.add_argument('--output',type=Path,default=(Path(__file__).resolve().parents[2]/'assets/aperture/chell' if Path(__file__).resolve().parent.name=='portal' and Path(__file__).resolve().parent.parent.name=='tools' else Path(__file__).resolve().parent/'assets'));args=p.parse_args()
out=args.output;out.mkdir(parents=True,exist_ok=True);raw=Image.open(args.source).convert('RGBA')
def keyed(rect):
 x,y,w,h=rect;im=raw.crop((x,y,x+w,y+h));data=[]
 for r,g,b,a in im.getdata():data.append((0,0,0,0) if (r,g,b) in [(128,255,128),(64,128,0)] else (r,g,b,a))
 im.putdata(data);return im

clips={
 'idle':[(2+64*i,165,62,106) for i in range(6)],
 'move':[(2+64*i,293,62,107) for i in range(8)],
 'crouch':[(0,424,66,93),(67,424,67,93),(0,424,66,93)],
 'jump':[(0,659,75,150)],'fall':[(0,834,75,150),(76,834,74,150)],
 'hurt':[(0,542,88,94)],'land':[(0,1009,66,91)],
}
sheet=Image.new('RGBA',(128*8,160*8));manifest={}
for row,(name,rects) in enumerate(clips.items()):
 for col,rect in enumerate(rects):
  im=keyed(rect);sheet.alpha_composite(im,(col*128+64-im.width//2,row*160+156-im.height))
 manifest[name]={'row':row,'frames':[row*8+i for i in range(len(rects))]}
# The supplied sheet separates the portal-gun arm from the standing body.
# Assemble those original parts and shift the arm by two pixels for recoil.
body=keyed((100,2153,63,107));arm=keyed((189,2187,58,23))
for col,recoil in enumerate([0,-2,0]):
 frame=Image.new('RGBA',(128,160));frame.alpha_composite(body,(33,49));frame.alpha_composite(arm,(59+recoil,84));sheet.alpha_composite(frame,(col*128,7*160))
manifest['fire']={'row':7,'frames':[56,57,58]}
for name,clip in manifest.items():
 for f in clip['frames']:
  x,y=f%8*128,f//8*160;assert sheet.crop((x,y,x+128,y+160)).getbbox(),(name,f)
sheet.save(out/'chell-motion-v3.png');(out/'chell-motion-v3.json').write_text(json.dumps(manifest,indent=2))

base=args.game/'assets/aperture';a=json.loads((base/'atlas.json').read_text())['frames'];atlas=Image.open(base/'atlas.png').convert('RGBA');props=Image.new('RGBA',(512,256));frames={};x=y=0;rh=0
names=['portal-blue','portal-orange','core-frame-blue','core-frame-orange','core-frame-red','core-frame-purple','pixel-turret','pixel-turret-aim','cube','cube-heart','rocket','laser','bullet-orange','bullet-red']
for name in names:
 r=a[name];im=atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
 if x+im.width+2>512:x=0;y+=rh+2;rh=0
 props.alpha_composite(im,(x,y));frames[name]={'x':x,'y':y,'w':im.width,'h':im.height};x+=im.width+2;rh=max(rh,im.height)
assert y+rh<=256
props.save(out/'chell-props.png');(out/'chell-props.json').write_text(json.dumps(frames,indent=2))

index=json.loads((base/'sfx/index.json').read_text());pack=(base/'sfx/aperture-sfx.bin').read_bytes();voices=out/'voice';voices.mkdir(exist_ok=True)
groups={'curiosity':['core-squeal-0','core-squeal-6','core-squeal-8'], 'intelligence':['core-a-10','core-a-13','core-a-18'], 'anger':['core-b-0','core-b-3','core-b-7'], 'portal_fire':['shoot-a'], 'portal_open':['open'], 'cube_hit':['clank-b']}
audio={}
for cue,names in groups.items():
 audio[cue]=[]
 for name in names:
  at,length,secs=index[name];blob=pack[at:at+length];assert blob[:4]==b'OggS',name;(voices/(name+'.ogg')).write_bytes(blob);audio[cue].append({'file':name+'.ogg','duration':secs})
(out/'voice/index.json').write_text(json.dumps(audio,indent=2))
print('Built 8 Chell clips, 14 prop sprites, and',sum(map(len,audio.values())),'original recordings.')

# User-supplied Portal 2 firing recording; do not substitute the MUGEN shot.
fire_source=Path.home()/'Downloads/portal-2-sound-effects-portal-gun-fire-orange.mp3'
if fire_source.is_file(): shutil.copyfile(fire_source,voices/'portal-gun-fire-orange.mp3')

if fire_source.is_file():
 audio['portal_fire']=[{'file':'portal-gun-fire-orange.mp3','source':'User-supplied recording'}]
 (voices/'index.json').write_text(json.dumps(audio,indent=2))
