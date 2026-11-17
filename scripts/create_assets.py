"""Original office tiles and synchronized Tiled TMX / JSON map.

The third-party George spritesheet is deliberately preserved unchanged.
See THIRD_PARTY_NOTICES.md for its source and attribution.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import json
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / 'public/assets'
for folder in ['maps', 'tilesets', 'sprites']:
    (root / folder).mkdir(parents=True, exist_ok=True)
tiles = Image.new('RGBA', (128, 32))
d = ImageDraw.Draw(tiles)
colors = ['#dce4dc','#bdcfc1','#738f85','#e5d5b9']
for i,c in enumerate(colors):
    x=i*32; d.rectangle((x,0,x+31,31),fill=c)
    d.line((x,31,x+31,31), fill=['#cfdbcf','#a8bfb0','#627b72','#d6c6ab'][i])
    d.line((x+31,0,x+31,31),fill=['#d3ded3','#b1c5b6','#627b72','#dfcdb0'][i])
    if i==2:
        d.rectangle((x,0,x+31,5),fill='#94a99c')
        d.line((x,6,x+31,6),fill='#adc2b1')
tiles.save(root/'tilesets/pixel_office.png')
w,h=25,18
floor=[];walls=[]
for y in range(h):
    for x in range(w):
        floor.append(2 if y<10 and x<12 else 4 if y<10 and x>12 else 1)
        wall=x in [0,24] or y in [0,17] or (y<10 and x==12) or (y==10 and x not in [5,6,18,19])
        walls.append(3 if wall else 0)
def props(**kwargs): return [{'name':k,'type':'string','value':v} for k,v in kwargs.items()]
objects=[{'id':1,'name':'George','x':400,'y':485,'width':0,'height':0,'point':True,'properties':props(tipus='spawn')},
{'id':2,'name':'Reunions','x':48,'y':48,'width':320,'height':256,'properties':props(tipus='zona',nomSala='Sala de Reunions',titolMonitor='Reunions · Canal 01',streamUrl='https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')},
{'id':3,'name':'Cafè','x':432,'y':48,'width':320,'height':256,'properties':props(tipus='zona',nomSala='Zona Cafè',titolMonitor='Càmera Descans · Canal 02',streamUrl='https://media.w3.org/2010/05/sintel/trailer.mp4')}]
layers=[{'id':i,'name':n,'type':'tilelayer','width':w,'height':h,'x':0,'y':0,'opacity':1,'visible':True,'data':data} for i,n,data in [(1,'Terra',floor),(2,'Parets',walls)]]
layers.append({'id':3,'name':'Objectes','type':'objectgroup','opacity':1,'visible':True,'x':0,'y':0,'objects':objects})
tileset={'firstgid':1,'name':'pixel_office','tilewidth':32,'tileheight':32,'tilecount':4,'columns':4,'image':'../tilesets/pixel_office.png','imagewidth':128,'imageheight':32,'margin':0,'spacing':0,'tiles':[{'id':2,'properties':[{'name':'collides','type':'bool','value':True}]}]}
mapdata={'version':'1.10','tiledversion':'1.11.2','type':'map','orientation':'orthogonal','renderorder':'right-down','infinite':False,'width':w,'height':h,'tilewidth':32,'tileheight':32,'nextlayerid':4,'nextobjectid':4,'layers':layers,'tilesets':[tileset]}
(root/'maps/oficina.json').write_text(json.dumps(mapdata,ensure_ascii=False,indent=2),encoding='utf-8')
m=ET.Element('map',version='1.10',tiledversion='1.11.2',orientation='orthogonal',renderorder='right-down',width=str(w),height=str(h),tilewidth='32',tileheight='32',infinite='0',nextlayerid='4',nextobjectid='4')
t=ET.SubElement(m,'tileset',firstgid='1',name='pixel_office',tilewidth='32',tileheight='32',tilecount='4',columns='4')
ET.SubElement(t,'image',source='../tilesets/pixel_office.png',width='128',height='32')
p=ET.SubElement(ET.SubElement(t,'tile',id='2'),'properties');ET.SubElement(p,'property',name='collides',type='bool',value='true')
for layer in layers[:2]:
    l=ET.SubElement(m,'layer',id=str(layer['id']),name=layer['name'],width=str(w),height=str(h))
    ET.SubElement(l,'data',encoding='csv').text='\n'+',\n'.join(','.join(str(v) for v in layer['data'][y*w:(y+1)*w]) for y in range(h))+'\n'
g=ET.SubElement(m,'objectgroup',id='3',name='Objectes')
for obj in objects:
    el=ET.SubElement(g,'object',**{k:str(obj[k]) for k in ['id','name','x','y','width','height']})
    if obj.get('point'): ET.SubElement(el,'point')
    p=ET.SubElement(el,'properties')
    for prop in obj['properties']: ET.SubElement(p,'property',**prop)
ET.indent(m)
ET.ElementTree(m).write(root/'maps/oficina.tmx',encoding='utf-8',xml_declaration=True)
print('Created original office tiles, oficina.json and oficina.tmx; preserved George spritesheet')
