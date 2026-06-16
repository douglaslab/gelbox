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
  return (
    <>
      {state.loupes.map((l) => {
        const { sample, degradeFilter } = makeSampleFromGel(
          l.anchor, bands, bandToLaneFragment, state.samples, state.wellRects, state.ctx,
        );
        return <Loupe key={l.id} loupe={l} sample={sample} degradeFilter={degradeFilter} />;
      })}
    </>
  );
}
