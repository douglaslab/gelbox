import { useMemo } from 'react';
import { useGelState } from './GelContext';
import { Loupe } from './Loupe';
import { useHoverLoupe } from './useHoverLoupe';
import type {LoupeRef} from '../../lib/gel/gelState';
import { makeSampleFromGel, type BandLaneFragment } from '../../lib/sim/sampleFromGel';
import type { Band } from '../../lib/sim/band';
interface Props { bands: Band[]; bandToLaneFragment: BandLaneFragment[]; }
function DerivedLoupe({loupe,bands,bandToLaneFragment,stackIndex,transient=false}:Props & {loupe:LoupeRef;stackIndex:number;transient?:boolean}) {
 const {samples,wellRects,ctx}=useGelState();
 // Moving only the frame or changing stacking order must not reroll content.
 const content=useMemo(()=>makeSampleFromGel(loupe.anchor,bands,bandToLaneFragment,samples,wellRects,ctx),[loupe.anchor,bands,bandToLaneFragment,samples,wellRects,ctx]);
 return <Loupe loupe={loupe} stackIndex={stackIndex} transient={transient} {...content}/>;
}
export function LoupePortalLayer(props:Props) {
 const {loupes,documentRevision}=useGelState();
 const preview=useHoverLoupe();
 // Keep DOM nodes in creation order: moving a captured node loses capture.
 return <>{[...loupes].sort((a,b)=>a.id-b.id).map(loupe=><DerivedLoupe key={loupe.id} loupe={loupe} stackIndex={loupes.indexOf(loupe)} {...props}/>)}{preview&&<DerivedLoupe key={`hover-${documentRevision}`} loupe={preview} transient stackIndex={loupes.length} {...props}/>}</>;
}
