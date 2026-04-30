import { useGelState } from './GelContext';
import { Loupe } from './Loupe';

export function LoupePortalLayer() {
  const state = useGelState();
  return (
    <>
      {state.loupes.map((l) => {
        const sample = state.samples[l.lane];
        if (!sample) return null;
        const frag = sample.fragments[l.fragmentIndex];
        if (!frag) return null;
        return <Loupe key={l.id} loupe={l} fragment={frag} />;
      })}
    </>
  );
}
