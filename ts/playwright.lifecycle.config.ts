import {defineConfig} from '@playwright/test';
import production from './playwright.production.config';
// This probe requires actual hidden/frozen browser states, not synthetic DOM events.
// Serve compiled artifacts; require real tab hiding before freezing.
export default defineConfig({...production,testDir:'./tests/lifecycle',testMatch:'renderer-resume.spec.ts',workers:1});
