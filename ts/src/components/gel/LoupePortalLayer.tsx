import { useMemo } from 'react';
import { useGelState } from './GelContext';
import { Loupe } from './Loupe';
import { makeSampleFromGel, type BandLaneFragment } from '../../lib/sim/sampleFromGel';
import type { Band } from '../../lib/sim/band';

interface LoupePortalLayerProps {
  bands: Band[];
  bandToLaneFragment: BandLaneFragment[];
}

export function LoupePortalLayer({ bands, bandToLaneFragment }: LoupePortalLayerProps) {
  const state = useGelState();
  const { loupes, samples, wellRects, ctx } = state;

  const derived = useMemo(
    () => loupes.map((l) => ({
      loupe: l,
      ...makeSampleFromGel(l.anchor, bands, bandToLaneFragment, samples, wellRects, ctx),
    })),
    [loupes, bands, bandToLaneFragment, samples, wellRects, ctx],
  );

  return (
    <>
      {derived.map(({ loupe, sample, degradeFilter }) => (
        <Loupe key={loupe.id} loupe={loupe} sample={sample} degradeFilter={degradeFilter} />
      ))}
    </>
  );
}
