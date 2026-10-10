import {defineConfig} from '@playwright/test';
import compatibility from './playwright.compatibility.config';
import production from './playwright.production.config';
// Source-level ImageView scene comparison. This complements compiled codec
// checks; it does not certify shipping Safari or the original native GUI.
export default defineConfig({...compatibility,testDir:'./tests/visual',
 testMatch:/shared-image-(native|mips)\.spec\.ts/,workers:1,
 projects:[...production.projects!,...compatibility.projects!],
 use:{...compatibility.use,baseURL:'http://127.0.0.1:5186'},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5186 --strictPort',url:'http://127.0.0.1:5186',reuseExistingServer:false},
});
