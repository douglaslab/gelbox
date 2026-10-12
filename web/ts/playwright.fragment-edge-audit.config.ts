import base from './playwright.production.config';
import { defineConfig } from '@playwright/test';
// Run against freshly built dist; historical split-canvas fixtures remain in tests.
export default defineConfig({...base,testMatch:/native-composition\.spec\.ts/,grep:/compiled native edge /});
