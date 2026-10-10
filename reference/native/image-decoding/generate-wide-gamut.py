"""Encode color-profile fixtures without converting their RGB sample values.

Uses named macOS profiles; records their hashes so regeneration differences are
visible. Pillow writes fixtures only, never reference renderer output.
"""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parent
profiles=Path('/System/Library/ColorSync/Profiles')
records=[]
for tag,name in [('display-p3','Display P3.icc'),('adobe-rgb','AdobeRGB1998.icc')]:
    profile=(profiles/name).read_bytes()
    for suffix in ['png','jpg']:
        output=root/'inputs'/f'{tag}.{suffix}'
        with Image.open(root/'inputs'/'opaque.png') as image:
            image.save(output,icc_profile=profile,**({'quality':95,'subsampling':0} if suffix=='jpg' else {}))
        records.append({'file':output.name,'profile':name,'profile_sha256':hashlib.sha256(profile).hexdigest(),'input_sha256':hashlib.sha256(output.read_bytes()).hexdigest()})
    if tag=='display-p3':
        output=root/'inputs'/'display-p3-alpha.png'
        with Image.open(root/'inputs'/'alpha.png') as image:image.save(output,icc_profile=profile)
        records.append({'file':output.name,'profile':name,'profile_sha256':hashlib.sha256(profile).hexdigest(),'input_sha256':hashlib.sha256(output.read_bytes()).hexdigest()})
(root/'wide-gamut-inputs.json').write_text(json.dumps(records,indent=2)+'\n')
