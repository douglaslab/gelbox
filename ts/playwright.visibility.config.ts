import {defineConfig} from '@playwright/test';
import compatibility from './playwright.compatibility.config';
// WebKit engine activity transitions; not physical tab switching or OS sleep.
export default defineConfig({...compatibility,testDir:'./tests/lifecycle',testMatch:'webkit-visibility.spec.ts',workers:1,projects:compatibility.projects!.filter(p=>p.name==='webkit-webgl2')});
