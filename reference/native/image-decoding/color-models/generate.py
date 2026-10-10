"""Encode small color-model fixtures; no reference screenshots are synthesized."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
(root/'inputs').mkdir(exist_ok=True)
im=Image.open(root.parent/'inputs/opaque.png')
for name,mode,options in [('cmyk.jpg','CMYK',{}),('cmyk-progressive.jpg','CMYK',{'progressive':True}),('gray.jpg','L',{})]:
 im.convert(mode).save(root/'inputs'/name,quality=95,subsampling=0,**options)
