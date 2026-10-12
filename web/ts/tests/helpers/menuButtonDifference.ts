import type {Page} from '@playwright/test';

/** Accepted web correction: native Retina file buttons were half size.
 * Exclude only their enlarged paint bounds from native-image comparisons;
 * application-menu-layout independently verifies their readable geometry.
 */
export async function menuButtonDifference(page:Page){
 return page.locator('#application-file-menu button').evaluateAll(buttons=>{
  const scale=window.devicePixelRatio;
  if(scale<2)return [];
  return buttons.map(button=>{
   const r=button.getBoundingClientRect();
   return {left:Math.floor(r.left*scale),top:Math.floor(r.top*scale),right:Math.ceil(r.right*scale),bottom:Math.ceil(r.bottom*scale)};
  });
 });
}
