import {defineConfig} from '@playwright/test';
import production from './playwright.production.config';
export default defineConfig({...production,testDir:'./tests/performance',workers:1,fullyParallel:false,timeout:90000});
