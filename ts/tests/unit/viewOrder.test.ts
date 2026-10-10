import {it,expect} from 'vitest';
import {insertView,removeView,raiseView} from '../../src/lib/gel/viewOrder';
it('preserves image focus order while loupes raise and panels insert relative to parent',()=>{
 let order=['gel','app-button'];order=insertView(order,'image1');order=insertView(order,'loupe1');order=insertView(order,'image2');
 order=insertView(order,'sample','gel');order=insertView(order,'settings','sample');
 expect(order).toEqual(['gel','sample','settings','app-button','image1','loupe1','image2']);
 expect(insertView(order,'image1')).toBe(order);
 order=raiseView(order,'loupe1');expect(order.at(-1)).toBe('loupe1');
 order=removeView(order,'image1');expect(order).not.toContain('image1');expect(raiseView(order,'gone')).toBe(order);
});
