import { FRAGMENT_WELL_LAYERS } from '../../lib/gel/fragmentWellGeometry';
import { LAYOUT } from '../../lib/layout/layout';
import { useGelStore } from '../gel/GelContext';
import { SampleSimCanvas } from '../sample/SampleSimCanvas';

/** Native preview uses the sample engine's most-visible selected molecule. */
export function FragmentWell({ fragmentIndex, testId }: {fragmentIndex:number;testId?:string}) {
  const view=useGelStore().getMolecularView('sample');
  return <div data-testid={testId} style={{
    position:'relative',width:LAYOUT.fragViewWellSize.x,height:LAYOUT.fragViewWellSize.y,
    borderRadius:LAYOUT.fragViewWellCornerRadius,background:view?'transparent':LAYOUT.fragViewWellFill,
    outline:view?undefined:`1px solid ${LAYOUT.fragViewWellStroke}`,
    boxShadow:view?undefined:`0px ${LAYOUT.fragViewWellShadowOffset.y}px 0 ${LAYOUT.fragViewWellShadow}`,
    overflow:'visible',
  }}>
    {view && <div style={{position:'absolute',left:-LAYOUT.fragViewWellTopLeft.x,top:-LAYOUT.fragViewWellTopLeft.y,pointerEvents:'none'}}>
    <SampleSimCanvas view={view} viewKey="fragment-preview"
      representativeUnderlay={FRAGMENT_WELL_LAYERS}
      representativeFragment={fragmentIndex}
      representativeCenter={{x:LAYOUT.fragViewWellTopLeft.x+LAYOUT.fragViewWellSize.x/2,
        y:LAYOUT.fragViewWellTopLeft.y+LAYOUT.fragViewWellSize.y/2}}
      width={LAYOUT.fragViewSize.x} height={LAYOUT.fragViewSize.y}
      data-testid="fragment-representative"/></div>}
  </div>;
}
