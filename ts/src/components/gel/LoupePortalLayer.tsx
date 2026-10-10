import { useMemo } from 'react';
import { useGelState } from './GelContext';
import { Loupe } from './Loupe';
import type {LoupeRef} from '../../lib/gel/gelState';
import { makeSampleFromGel, type BandLaneFragment } from '../../lib/sim/sampleFromGel';
import type { Band } from '../../lib/sim/band';
interface Props { bands: Band[]; bandToLaneFragment: BandLaneFragment[]; }
function DerivedLoupe({loupe,bands,bandToLaneFragment,stackIndex}:Props & {loupe:LoupeRef;stackIndex:number}) {
 const {samples,wellRects,ctx}=useGelState();
 // Moving only the frame or changing stacking order must not reroll content.
 const content=useMemo(()=>makeSampleFromGel(loupe.anchor,bands,bandToLaneFragment,samples,wellRects,ctx),[loupe.anchor,bands,bandToLaneFragment,samples,wellRects,ctx]);
 return <Loupe loupe={loupe} stackIndex={stackIndex} {...content}/>;
}
export function LoupePortalLayer(props:Props) {
 const {loupes}=useGelState();
 // Keep DOM nodes in creation order: moving a captured node loses capture.
 return <>{[...loupes].sort((a,b)=>a.id-b.id).map(loupe=><DerivedLoupe key={loupe.id} loupe={loupe} stackIndex={loupes.indexOf(loupe)} {...props}/>)}</>;
}
