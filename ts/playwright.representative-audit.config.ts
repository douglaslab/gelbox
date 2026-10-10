import base from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...base, testDir: './tests/native-representative-audit', testMatch: /compositor\.spec\.ts/ });
