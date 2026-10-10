#!/usr/bin/env python3
"""Normalize capture profiles and extract equal-scale analytical text crops.
Requires Pillow. Originals remain untouched; output is not a parity golden.
"""
import io
from pathlib import Path
from PIL import Image, ImageCms
root = Path(__file__).resolve().parent
srgb = ImageCms.createProfile('sRGB')
for filename, box in [
    ('native-settings.jpg', (1400, 330, 1870, 665)),
    ('web-settings-before.png', (1400, 274, 1870, 609)),
    ('web-settings-after.png', (1400, 274, 1870, 609)),
]:
    original = Image.open(root / filename)
    print(filename, original.format, original.size)
    if original.info.get('icc_profile'):
        profile = ImageCms.ImageCmsProfile(io.BytesIO(original.info['icc_profile']))
        print('  ICC:', ImageCms.getProfileDescription(profile).strip())
        normalized = ImageCms.profileToProfile(original, profile, srgb, outputMode='RGB')
    else:
        normalized = original.convert('RGB')  # Playwright PNG: sRGB capture.
    output = root / f'{Path(filename).stem}-text-srgb.png'
    normalized.crop(box).save(output, icc_profile=ImageCms.ImageCmsProfile(srgb).tobytes())
    print('  crop:', output.name)
