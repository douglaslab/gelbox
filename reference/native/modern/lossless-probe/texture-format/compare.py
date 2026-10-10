"""Compare the retained physical-pixel startup band crop. Requires Pillow/numpy."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image
root = Path(__file__).resolve().parent
native = root.parent / 'startup.png'
crop = (430, 310, 520, 1230)
def pixels(path):
    return np.array(Image.open(path).convert('RGB').crop(crop)).astype(int)
results = {}
for backend in ('webgpu', 'webgl2'):
    for storage in ('srgb', 'linear'):
        path = root / f'format-{storage}-{backend}.png'
        delta = abs(pixels(native) - pixels(path))
        results[f'{backend}-{storage}'] = {
            'differentPixels': int(np.any(delta, axis=2).sum()),
            'absoluteRgbDifferenceSum': int(delta.sum()),
            'maximumChannelDifference': int(delta.max()),
            'captureSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        }
print(json.dumps({'cropPhysicalPixels': crop, 'results': results}, indent=2))
