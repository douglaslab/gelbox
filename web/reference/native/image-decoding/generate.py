"""Small deterministic codec inputs; Pillow only encodes fixtures, not app assets."""
from pathlib import Path
from PIL import Image,ImageCms,PngImagePlugin
import struct
root=Path(__file__).resolve().parent/'inputs';root.mkdir(exist_ok=True)
im=Image.new('RGB',(32,24))
colors=[(235,25,35),(25,215,55),(25,45,235),(245,210,35)]
for y in range(24):
 for x in range(32):im.putpixel((x,y),colors[(x>=16)+2*(y>=12)])
im.save(root/'opaque.png')
im.save(root/'plain.jpg',quality=95,subsampling=0)
for orientation in range(1,9):
 exif=Image.Exif();exif[274]=orientation
 im.save(root/f'orientation-{orientation}.jpg',quality=95,subsampling=0,exif=exif)
exif=Image.Exif();exif[274]=6
im.save(root/'orientation-6.png',exif=exif)
a=im.convert('RGBA')
for y in range(24):
 for x in range(32):a.putpixel((x,y),(*a.getpixel((x,y))[:3],[0,85,170,255][x//8]))
a.save(root/'alpha.png')
profile=bytearray(ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes())
profile[24:36]=struct.pack('>6H',2000,1,1,0,0,0) # Stable ICC creation date.
profile=bytes(profile)
im.save(root/'srgb.png',icc_profile=profile)
im.save(root/'srgb.jpg',quality=95,subsampling=0,icc_profile=profile)
gamma=PngImagePlugin.PngInfo();gamma.add(b'gAMA',struct.pack('>I',100000));im.save(root/'gamma-linear.png',pnginfo=gamma)
im.save(root/'animated.gif',save_all=True,append_images=[Image.new('RGB',im.size,(200,0,200))],duration=[100,100],loop=0)
