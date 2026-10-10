import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const appData=mkdtempSync(join(tmpdir(),'gel-firefox-appdata-'));
export default defineConfig({testDir:'./shared-production',workers:1,use:{viewport:{width:1365,height:768},deviceScaleFactor:2},projects:[{name:'firefox-webgl2',use:{browserName:'firefox',launchOptions:{timeout:15000,env:{...process.env,CFFIXED_USER_HOME:appData}}}},{name:'webkit-webgl2',use:{browserName:'webkit'}}]});
