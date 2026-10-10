import {defineConfig} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import production from './playwright.production.config';
// Keep browser-engine compatibility separate from the established Chromium gate.
// WebKit is not shipping Safari. This gate covers deployment, editing and loupe workflows;
// exact native Chromium comparisons remain in the production config.
// macOS27 protects Firefox's shared app-data root, even with a temporary profile.
// Give the test browser its own bookkeeping directory without changing user profiles.
const firefoxAppData=path.resolve('playwright/.cache/firefox-app-data');
if(process.platform==='darwin')mkdirSync(firefoxAppData,{recursive:true});
const firefoxEnv=process.platform==='darwin'?{...process.env,CFFIXED_USER_HOME:firefoxAppData}:undefined;
export default defineConfig({...production,testMatch:/(deployment|interactions)\.spec\.ts/,projects:[
 {name:'firefox-webgl2',use:{browserName:'firefox',launchOptions:{timeout:15000,env:firefoxEnv}}},
 {name:'webkit-webgl2',use:{browserName:'webkit'}},
]});
