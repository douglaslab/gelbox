#!/usr/bin/env python3
"""Compare equally sized gel captures; requires Pillow and NumPy.

Use --gel x,y,width,height to exclude fonts, window chrome and controls.
Exit 1 when mean grayscale difference exceeds 6/255 or any lane's
brightness-weighted row centroid differs by more than 3 pixels.
"""
import argparse
import json
import sys

import numpy as np
from PIL import Image


def lane_centroids(gel, lanes):
    height, width = gel.shape
    result = []
    for lane in range(lanes):
        rows = gel[:, lane * width // lanes:(lane + 1) * width // lanes].sum(axis=1)
        total = rows.sum()
        result.append(float(rows @ np.arange(height) / total) if total else None)
    return result


def compare(a, b, lanes=8):
    if a.shape != b.shape or a.ndim != 2 or not a.size:
        raise ValueError('captures must have the same nonempty grayscale dimensions')
    if not 1 <= lanes <= a.shape[1]:
        raise ValueError('lane count must be between 1 and the gel width')
    difference = float(np.abs(a.astype(np.float32) - b.astype(np.float32)).mean())
    pairs = list(zip(lane_centroids(a, lanes), lane_centroids(b, lanes)))
    passed = difference <= 6 and all(
        (x is None and y is None) or
        (x is not None and y is not None and abs(x - y) <= 3)
        for x, y in pairs)
    return {'mean_difference': difference, 'lanes': pairs, 'passed': passed}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mac')
    parser.add_argument('windows')
    parser.add_argument('--gel', help='x,y,width,height in capture pixels')
    parser.add_argument('--lanes', type=int, default=8)
    parser.add_argument('--json', action='store_true', help='emit machine-readable measurements')
    args = parser.parse_args()
    try:
        images = [np.asarray(Image.open(path).convert('L'), dtype=np.float32)
                  for path in (args.mac, args.windows)]
        if images[0].shape != images[1].shape:
            raise ValueError('size mismatch; crop/normalize captures to the same client size first')
        if args.gel:
            x, y, width, height = map(int, args.gel.split(','))
            h, w = images[0].shape
            if min(x, y) < 0 or min(width, height) <= 0 or x + width > w or y + height > h:
                raise ValueError('gel rectangle is outside the capture')
            images = [im[y:y + height, x:x + width] for im in images]
        result = compare(*images, args.lanes)
    except (ValueError, OSError) as error:
        parser.error(str(error))
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"mean abs diff: {result['mean_difference']:.4f} / 255")
        for i, (a, b) in enumerate(result['lanes'], 1):
            print(f'lane {i}: mac {a!s:>12}  windows {b!s:>12}')
        print('PASS' if result['passed'] else 'FAIL')
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
