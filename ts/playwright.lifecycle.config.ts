import {defineConfig} from '@playwright/test';
import visual from './playwright.config';
// This probe requires actual hidden/frozen browser states, not synthetic DOM events.
// It currently fails its visibility precondition on the recorded macOS runner.
export default defineConfig({...visual,testDir:'./tests/lifecycle',workers:1});
