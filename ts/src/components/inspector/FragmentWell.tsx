import { LAYOUT } from '../../lib/layout/layout';
import { useGelStore } from '../gel/GelContext';
import { SampleSimCanvas } from '../sample/SampleSimCanvas';

/** Native preview uses the sample engine's most-visible selected molecule. */
export function FragmentWell({ fragmentIndex, testId }: {fragmentIndex:number;testId?:string}) {
  const view=useGelStore().getMolecularView('sample');
  return <div data-testid={testId} style={{
    position:'relative',width:LAYOUT.fragViewWellSize.x,height:LAYOUT.fragViewWellSize.y,
    borderRadius:LAYOUT.fragViewWellCornerRadius,background:LAYOUT.fragViewWellFill,
    outline:`1px solid ${LAYOUT.fragViewWellStroke}`,
    boxShadow:`0px ${LAYOUT.fragViewWellShadowOffset.y}px 0 ${LAYOUT.fragViewWellShadow}`,
    overflow:'visible',
  }}>
    {view && <div style={{position:'absolute',left:-LAYOUT.fragViewWellTopLeft.x,top:-LAYOUT.fragViewWellTopLeft.y,pointerEvents:'none'}}>
    <SampleSimCanvas view={view} viewKey="fragment-preview"
      representativeFragment={fragmentIndex}
      representativeCenter={{x:LAYOUT.fragViewWellTopLeft.x+LAYOUT.fragViewWellSize.x/2,
        y:LAYOUT.fragViewWellTopLeft.y+LAYOUT.fragViewWellSize.y/2}}
      width={LAYOUT.fragViewSize.x} height={LAYOUT.fragViewSize.y}
      data-testid="fragment-representative"/></div>}
  </div>;
}
