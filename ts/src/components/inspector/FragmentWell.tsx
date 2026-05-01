import { LAYOUT } from '../../lib/layout/layout';

export interface FragmentWellProps {
  color: readonly [number, number, number];
  testId?: string;
}

function linearToSrgbHex(rgb: readonly [number, number, number]): string {
  const toByte = (c: number) => {
    const srgb = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  };
  const [r, g, b] = rgb.map(toByte);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** 80×80 rounded preview swatch showing the current fragment color. */
export function FragmentWell({ color, testId }: FragmentWellProps) {
  return (
    <div
      data-testid={testId}
      style={{
        width:        LAYOUT.fragViewWellSize.x,
        height:       LAYOUT.fragViewWellSize.y,
        borderRadius: LAYOUT.fragViewWellCornerRadius,
        background:   linearToSrgbHex(color),
        border:       `1px solid ${LAYOUT.fragViewWellStroke}`,
        boxShadow:    `0px ${LAYOUT.fragViewWellShadowOffset.y}px 0 ${LAYOUT.fragViewWellShadow}`,
      }}
    />
  );
}
