import {useEffect,useLayoutEffect,useRef} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {acquireSceneAsset} from '../../lib/gel/sceneAssets';
import type {PresentationSampling,PresentationCommand} from '../../lib/gel/presentationTypes';
import type {SceneTexture} from '../../lib/gel/scenePresentation';
import {sampleHeaderCircle} from '../../lib/gel/sampleHeaderGeometry';
import {LAYOUT} from '../../lib/layout/layout';
import {resolveAssetUrl,dprFallbackOnError} from '../../lib/layout/assets';
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
const textSampling:PresentationSampling={...sampling,mipmapFilter:'none'};
export function SampleHeader(){
 const registry=useSharedPresentation(),element=useRef<HTMLDivElement>(null);
 useDisplayScale();
 const tubeUrl=resolveAssetUrl('/assets/microtube1500ul.png'),textUrl=resolveAssetUrl('/assets/native-text/sample.png');
 const assets=useRef<{tube:ReturnType<typeof acquireSceneAsset>;text:ReturnType<typeof acquireSceneAsset>}|null>(null);
 useEffect(()=>{
  if(!registry)return;
  const owned={tube:acquireSceneAsset(registry,tubeUrl),text:acquireSceneAsset(registry,textUrl,false)};assets.current=owned;
  return()=>{if(assets.current===owned)assets.current=null;owned.tube.release();owned.text.release();element.current?.removeAttribute('data-shared-ready');};
 },[registry,tubeUrl,textUrl]);
 useLayoutEffect(()=>registry?.register('sample',()=>{
  const el=element.current;if(!el)return [];
  const graphics=registry.getGraphics(),tube=assets.current?.tube.texture(graphics),text=assets.current?.text.texture(graphics);
  const bounds=el.getBoundingClientRect(),transform=[1,0,0,1,bounds.left,bounds.top] as const;
  const commands:PresentationCommand<SceneTexture>[]=[{mesh:sampleHeaderCircle,transform}];
  // Pinned SampleView::layout and Layout::layoutHeadingText; native-text capture
  // records the Avenir Heavy descent and exact 1x/2x texture extents.
  if(tube)commands.push({texture:tube,rect:{x1:10.5,y1:-60.97872543334961,x2:29.5,y2:-25},transform,alpha:'straight',colorSpace:'native-unorm',sampling});
  if(text)commands.push({texture:text,rect:{x1:51,y1:-49,x2:134,y2:-16},transform,alpha:'straight',colorSpace:'native-unorm',sampling:textSampling});
  if(tube&&text)el.dataset.sharedReady='1';return commands;
 },-20),[registry]);
  // Mirror C++ SampleView::drawHeader (SampleView.cpp:154):
  //   - blue circle at upperLeft + (r, -r - gutter)
  //   - microtube icon centered in the circle
  //   - "Sample" heading at sampleViewHeaderBaselinePos
  const r = LAYOUT.sampleViewMicrotubeBkgndRadius;          // 20
  const gutter = LAYOUT.sampleViewMicrotubeBkgndGutter;     // 11
  const circleSize = r * 2;                                  // 40
  const circleTop  = -r - gutter - r;                        // = -2r - gutter (top edge of circle)

 return <div ref={element} data-testid="sample-header" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
      {/* Selected-lane blue circle in upper-left of panel. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top:  circleTop,
          width:  circleSize,
          height: circleSize,
          borderRadius: '50%',
          background: registry?'transparent':LAYOUT.gelMicrotubeBkgndColorSelected,
        }}
      >
        <img
          data-testid="sample-header-tube"
          src={resolveAssetUrl('/assets/microtube1500ul.png')}
          alt=""
          onError={dprFallbackOnError}
          style={{
            position: 'absolute',
            left: r - LAYOUT.sampleViewMicrotubeWidth / 2,
            bottom: LAYOUT.sampleViewMicrotubeGutter - LAYOUT.sampleViewMicrotubeBkgndGutter,
            width: LAYOUT.sampleViewMicrotubeWidth,
            height: 'auto',
            display: 'block',
            opacity: registry?0:undefined,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </div>

      {/* "Sample" heading text. */}
      <h2
        style={{
          position: 'absolute',
          left:     `${LAYOUT.sampleViewHeaderBaselinePos.x}px`,
          top:      `${LAYOUT.sampleViewHeaderBaselinePos.y}px`,
          margin:   0,
          opacity: registry?0:undefined,
          font:     `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
          color:    LAYOUT.headFontColor,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {LAYOUT.sampleViewHeaderStr}
      </h2>

 </div>;
}
