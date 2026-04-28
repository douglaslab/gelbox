// Mirrors C++ GelRender::GlobalWarp. randSeed is unused by the live overcook branch
// but kept for API stability when future global effects need an RNG.
export interface GlobalWarp {
  h2oDistort: boolean;
  randSeed:   number;
}

export const NO_GLOBAL_WARP: GlobalWarp = { h2oDistort: false, randSeed: 0 };
