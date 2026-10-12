export type Rng = () => number;  // returns float in [0, 1)

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rangeFloat(r: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * r();
}

export function rangeInt(r: Rng, lo: number, hi: number): number {
  return Math.floor(lo + (hi - lo) * r());
}

/** Cinder Rand's MT19937 stream and the captured macOS libc++ float mapping. */
export class CinderRand {
  private state = new Uint32Array(624);
  private index = 624;
  constructor(seed: number) {
    this.state[0] = seed >>> 0;
    for (let i=1;i<624;i++) this.state[i] = (Math.imul(1812433253, this.state[i-1] ^ (this.state[i-1] >>> 30)) + i) >>> 0;
  }
  /** Native ci::Rand copies retain the entire MT state and current cursor. */
  clone(): CinderRand {
    const copy = new CinderRand(0);
    copy.state = this.state.slice();
    copy.index = this.index;
    return copy;
  }
  nextUint(): number {
    if (this.index===624) {
      for (let i=0;i<624;i++) {
        const y = (this.state[i]&0x80000000) | (this.state[(i+1)%624]&0x7fffffff);
        this.state[i] = this.state[(i+397)%624] ^ (y>>>1) ^ ((y&1) ? 0x9908b0df : 0);
      }
      this.index=0;
    }
    let y=this.state[this.index++];
    y ^= y>>>11; y ^= (y<<7)&0x9d2c5680; y ^= (y<<15)&0xefc60000; y ^= y>>>18;
    return y>>>0;
  }
  nextInt(limit?: number): number {
    if (limit===undefined) return this.nextUint() | 0;
    return limit<=0 ? 0 : this.nextUint() % Math.trunc(limit);
  }
  nextFloat(a?: number,b?: number): number {
    const f=Math.fround;
    const value=f(f(this.nextUint()) / 4294967296);
    if (a===undefined) return value;
    return b===undefined ? f(value*f(a)) : f(f(value*f(f(b)-f(a)))+f(a));
  }
  nextVec2(): {x:number;y:number} {
    const theta=this.nextFloat(Math.fround(Math.PI)*2);
    return {x:Math.fround(Math.cos(theta)),y:Math.fround(Math.sin(theta))};
  }
}
