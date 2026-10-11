/** Cinder uses Control on Windows and Meta on its other desktop targets. */
export function isNativeAccelerator(event:{metaKey:boolean;ctrlKey:boolean},platform=globalThis.navigator?.platform??''):boolean {
 return /Win/.test(platform)?event.ctrlKey:event.metaKey;
}
