import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./interactions',fullyParallel:true,updateSnapshots:'none',grepInvert:/loupe particles remain paused without the screenshot freeze hook/,workers:4,retries:0,
reporter:[['list'],['json',{outputFile:'/tmp/gel-browser-compat-1.64/interactions-results.json'}]],
outputDir:'/tmp/gel-browser-compat-1.64/interactions-results',
use:{browserName:'webkit',baseURL:'http://localhost:5178',viewport:{width:1365,height:768},deviceScaleFactor:2},
webServer:{command:'npm run dev -- --port 5178',cwd:'/Users/shawn/.codex/worktrees/3f9f/gel/ts',url:'http://localhost:5178',reuseExistingServer:false},
projects:[{name:'webkit-webgl2'}]});
