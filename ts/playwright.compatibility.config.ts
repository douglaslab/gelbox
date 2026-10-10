import {defineConfig} from '@playwright/test';
import production from './playwright.production.config';
// Keep browser-engine compatibility separate from the established Chromium gate.
// WebKit is not the shipping Safari app. Firefox launch failures must remain failures.
export default defineConfig({...production,projects:[
 {name:'firefox-webgl2',use:{browserName:'firefox',launchOptions:{timeout:15000}}},
 {name:'webkit-webgl2',use:{browserName:'webkit'}},
]});
