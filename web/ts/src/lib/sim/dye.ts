// Port of ~/code/gelbox/include/Dye.h. Pure constants — no JSON file backs these.

export const DYE_COUNT = 4;
export const DYE_MAX_MASS = 125;  // ng

export const DYE_NAMES = [
  'Xylene cyanol',
  'Cresol red',
  'Bromphenol blue',
  'Orange G',
] as const;

export const DYE_COLORS: readonly [number, number, number][] = [
  [0x00 / 255, 0xAF / 255, 0xE2 / 255],  // Xylene cyanol
  [0x98 / 255, 0x5D / 255, 0x93 / 255],  // Cresol red
  [0xB3 / 255, 0xA7 / 255, 0xD3 / 255],  // Bromphenol blue
  [0xFA / 255, 0xCB / 255, 0x01 / 255],  // Orange G
];

export const DYE_BP_LO = [6000, 700, 300, 50] as const;
export const DYE_BP_HI = [7000, 900, 500, 100] as const;

export function isValidDye(dye: number): boolean {
  return dye >= 0 && dye < DYE_COUNT;
}
