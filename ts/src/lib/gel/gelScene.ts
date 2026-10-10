import {fragToBands} from '../sim/gelSim';
import type {Band} from '../sim/band';
import type {BandLaneFragment} from '../sim/sampleFromGel';
import type {GelState} from './gelState';

export function deriveGelScene(state:GelState):{bands:Band[];bandToLaneFragment:BandLaneFragment[]} {
  const bands:Band[]=[],bandToLaneFragment:BandLaneFragment[]=[];
  for(let lane=0;lane<state.numLanes;lane++) {
    const sample=state.samples[lane];
    if(!sample)continue;
    for(let fragment=0;fragment<sample.fragments.length;fragment++) {
      for(const band of fragToBands(sample,fragment,state.wellRects[lane],lane,state.ctx)) {
        bands.push(band);bandToLaneFragment.push({lane,fragment});
      }
    }
  }
  return {bands,bandToLaneFragment};
}
