import base from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...base, testDir: './tests/native-fragment-well-audit', testMatch: /compositor\.spec\.ts/ });
