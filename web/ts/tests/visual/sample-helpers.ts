import type { Page } from '@playwright/test';

/** Native sample settings are opened by a background click, not a tube click. */
export async function openSampleSettings(page: Page) {
  const panel = page.getByTestId('sample-settings-view');
  if (await panel.isVisible()) return;
  const canvas = page.getByTestId('molecular-sim-canvas');
  for (const y of [10, 30, 60, 100]) {
    for (const x of [10, 40, 80, 120]) {
      await canvas.click({ position: { x, y } });
      if (await panel.isVisible()) return;
    }
  }
  throw new Error('Could not find sample background to open settings');
}
