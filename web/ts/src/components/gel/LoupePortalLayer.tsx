import {useGelSnapshot,useGelStore} from './GelContext';
import {Loupe} from './Loupe';
import {useHoverLoupe} from './useHoverLoupe';
import type {BandLaneFragment} from '../../lib/sim/sampleFromGel';
import type {Band} from '../../lib/sim/band';
interface Props {bands:Band[];bandToLaneFragment:BandLaneFragment[]}
export function LoupePortalLayer(_props:Props) {
 const store=useGelStore();
 const {gel:{loupes,documentRevision}}=useGelSnapshot();
 const preview=useHoverLoupe();
 // Stable creation-order DOM nodes preserve pointer capture while stacking changes.
 return <>{[...loupes].sort((a,b)=>a.id-b.id).map(loupe=>{
   const content=store.getLoupeContent(`loupe-${loupe.id}`);
   return content?<Loupe key={loupe.id} loupe={loupe} {...content}/>:null;
 })}{preview&&store.getLoupeContent('hover')&&<Loupe key={`hover-${documentRevision}`} loupe={preview} transient {...store.getLoupeContent('hover')!}/>}</>;
}
