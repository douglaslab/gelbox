// Port of ~/code/gelbox/include/Buffer.h.
// All concentrations in mM (millimolar). The sim treats Buffer as pure data —
// it makes no derived computations (conductivity, heat). It influences mobility
// via two equality checks only: H2O triggers extra smear-above; TAE shifts the
// mobility curve base.

export interface Buffer {
  tris:    number;
  borate:  number;
  acetate: number;
  edta:    number;
}

export const BUFFER_H2O: Buffer = { tris:  0,   borate:  0,   acetate:  0, edta: 0 };
export const BUFFER_TBE: Buffer = { tris: 44.5, borate: 44.5, acetate:  0, edta: 1 };  // 0.5× TBE
export const BUFFER_TAE: Buffer = { tris: 40,   borate:  0,   acetate: 20, edta: 1 };  // 1× TAE

export function bufferEquals(a: Buffer, b: Buffer): boolean {
  return a.tris === b.tris && a.borate === b.borate && a.acetate === b.acetate && a.edta === b.edta;
}
