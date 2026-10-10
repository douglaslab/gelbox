import { openSampleSettings } from './sample-helpers';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

test.beforeEach(async ({ page }, info) => {
  if (info.project.name.includes('webgl2')) await page.addInitScript(() => localStorage.setItem('gelBackend', 'webgl2'));
  await page.goto('/#/gel');
});

test('Open native JSON and Save Gel preserves the native document', async ({ page }) => {
  await page.getByRole('button', { name: 'Application settings' }).click();
  await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/files/ladder-after-selection.gel.json'));
  await expect(page.getByRole('button', { name: 'Application settings' })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Application settings' }).click();
  const downloading = page.waitForEvent('download');
  await page.getByTestId('save-gel-btn').click();
  const download = await downloading;
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json', 'utf8')));
});

test('Open native XML, reject malformed XML, then save unchanged sample', async ({ page }) => {
  await page.getByRole('button', { name: 'Application settings' }).click();
  await page.getByTestId('file-input').setInputFiles(path.resolve('../reference/native/files/1kbladder.xml'));
  await expect(page.getByRole('button', { name: 'Application settings' })).toHaveAttribute('aria-expanded', 'false');
  await page.getByTestId('microtube-1').click();
  await page.getByRole('button', { name: 'Application settings' }).click();
  await page.getByTestId('file-input').setInputFiles({ name: 'bad.xml', mimeType: 'text/xml', buffer: Buffer.from('<Sample><Fragment></Sample>') });
  await expect(page.getByTestId('file-error')).toContainText('Open failed');
  const downloading = page.waitForEvent('download');
  await page.getByTestId('save-sample-btn').click();
  const data = JSON.parse(await readFile((await (await downloading).path())!, 'utf8'));
  expect(data.Gelbox).toEqual({ version: '1.0', type: 'sample' });
  expect(data.Sample.name).toBe('1kb ladder');
  expect(data.Sample.iconScale).toBe(0.5);
  expect(data.Sample.Fragments).toHaveLength(11);
  expect(data.Sample.Fragments[0]).toMatchObject({ Bases: 10002, Mass: 42, Color: [0.2,0.2,0.2], Aggregate: [1] });
  expect(data.Sample.Buffer).toEqual({ Tris: 44.5, Borate: 44.5, Acetate: 0, EDTA: 1 });
});

test('Open invokes a file chooser and settings dismiss with Escape', async ({ page }) => {
  const settings = page.getByRole('button', { name: 'Application settings' });
  await settings.click();
  await page.keyboard.press('Escape');
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await settings.click();
  const choosing = page.waitForEvent('filechooser');
  await page.getByTestId('open-btn').click();
  await (await choosing).setFiles(path.resolve('../reference/native/files/1kbladder.xml'));
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await settings.click();
  await page.screenshot({ path: test.info().outputPath('file-menu.png') });
});

test('XML import matches native supported fields and reports unsafe aggregates', async ({ page }) => {
  const settings = page.getByRole('button', { name: 'Application settings' });
  await settings.click();
  await page.getByTestId('file-input').setInputFiles({ name: 'fields.xml', mimeType: 'text/xml', buffer: Buffer.from('<Sample name="A &amp; B" id="8"><Buffer/><Fragment><Bases value="500"/><Mass value="20"/><Degrade value="1"/><Dye value="3"/><AspectRatio value="7"/><Aggregate Size="0" Weight="2"/></Fragment></Sample>') });
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await page.getByTestId('microtube-1').click();
  await settings.click();
  const downloading = page.waitForEvent('download');
  await page.getByTestId('save-sample-btn').click();
  const data = JSON.parse(await readFile((await (await downloading).path())!, 'utf8'));
  expect(data.Sample).toMatchObject({ name: 'A & B', id: -1, Buffer: { Tris: 44.5, Borate: 44.5, Acetate: 0, EDTA: 1 } });
  expect(data.Sample.Fragments).toEqual([{ Bases: 500, Mass: 20, Degrade: 1, AspectRatio: 1, Color: [0.5,0.5,0.5], Aggregate: [2] }]);
  await settings.click();
  await page.getByTestId('file-input').setInputFiles({ name: 'unsafe.xml', mimeType: 'text/xml', buffer: Buffer.from('<Sample><Fragment><Aggregate Size="1" Weight="2"/></Fragment></Sample>') });
  await expect(page.getByTestId('file-error')).toContainText('use native JSON for multimers');
});

test('unselected startup has no Save Selected Sample command', async ({ page }) => {
  await page.getByRole('button', { name: 'Application settings' }).click();
  await expect(page.getByTestId('save-sample-btn')).toHaveCount(0);
});

test('dropping a sample into an empty lane preserves the occupied ladder', async ({ page }) => {
  const overlay = page.getByTestId('gel-overlay');
  const rect = (await overlay.boundingBox())!;
  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['<Sample name="dropped"><Fragment><Bases value="500"/><Mass value="10"/></Fragment></Sample>'], 'dropped.xml', { type: 'text/xml' }));
    return transfer;
  });
  await overlay.dispatchEvent('drop', { dataTransfer, clientX: rect.x + rect.width * 3.5 / 7, clientY: rect.y + 30 });
  await expect(page.getByTestId('drop-error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Application settings' }).click();
  const downloading = page.waitForEvent('download');
  await page.getByTestId('save-gel-btn').click();
  const data = JSON.parse(await readFile((await (await downloading).path())!, 'utf8'));
  expect(data.Gel.Samples[0].Fragments).toHaveLength(11);
  expect(data.Gel.Samples[3].name).toBe('dropped');
});

test('lane reduction hides retained samples and saves only visible lanes', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  const native = JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json', 'utf8'));
  const sample = { ...native.Gel.Samples[0], name: 'retained last lane' };
  native.Gel.Samples = Array.from({ length: 12 }, (_, i) => i === 11 ? sample : null);
  await page.getByTestId('file-input').setInputFiles({ name: 'twelve.gel.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(native)) });
  await page.getByTestId('microtube-11').click();
  await expect(page.getByTestId('sample-view')).toBeVisible();
  await page.getByTestId('settings-button').click();
  const track = await page.getByTestId('gel-lanes-track').boundingBox();
  if (!track) throw new Error('Missing lanes slider');
  await page.mouse.click(track.x + 1, track.y + track.height / 2);
  await expect(page.getByTestId('microtube-11')).toHaveCount(0);
  await expect(page.locator('[data-testid^="microtube-"][data-lane-index]')).toHaveCount(7);

  async function saveGel() {
    await page.getByRole('button', { name: 'Application settings' }).click();
    const pending = page.waitForEvent('download');
    await page.getByTestId('save-gel-btn').click();
    const data = JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
    await page.keyboard.press('Escape');
    return data;
  }
  expect((await saveGel()).Gel.Samples).toEqual(Array(7).fill(null));
  await page.getByTestId('settings-button').click();
  await page.getByTestId('gel-overlay').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
  await page.getByTestId('settings-button').click();
  await page.mouse.click(track.x + track.width - 1, track.y + track.height / 2);
  await expect(page.getByTestId('microtube-11')).not.toHaveAttribute('data-empty', 'true');
  const restored = (await saveGel()).Gel.Samples;
  expect(restored).toHaveLength(20);
  expect(restored[11]).toEqual(sample);
  expect(restored.filter(Boolean)).toHaveLength(1);
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('sample-view')).toBeHidden();
  await page.getByRole('button', { name: 'Application settings' }).click();
  await expect(page.getByTestId('save-sample-btn')).toHaveCount(0);
});

test('native disabled controls preserve imported off-preset buffer values', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 768 });
  const native = JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json', 'utf8'));
  native.Gel.Buffer = { Tris: 37, Borate: 19, Acetate: 11, EDTA: 3 };
  native.Gel.Samples[0].Buffer = { Tris: 23, Borate: 13, Acetate: 7, EDTA: 2 };
  await page.getByTestId('file-input').setInputFiles({ name: 'custom.gel.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(native)) });
  for (const mode of ['gel', 'sample']) {
    await page.getByTestId(mode === 'gel' ? 'settings-button' : 'microtube-0').click();
    if (mode === 'sample') await openSampleSettings(page);
    const buffer = page.getByTestId(`${mode}-buffer-view`);
    await expect(buffer.locator('[data-selected="true"]')).toHaveCount(0);
    for (const key of ['tris', 'borate', 'acetate', 'edta']) {
      const slider = page.getByTestId(`${mode}-buffer-view-${key}`);
      await expect(slider).toHaveAttribute('aria-disabled', 'true');
      // Native disabled backgrounds fade, but value labels remain fully opaque.
      const track = page.getByTestId(`${mode}-buffer-view-${key}-track`);
      await expect(track).toHaveCSS('opacity', '1');
      for (const target of [track, page.getByTestId(`${mode}-buffer-view-${key}-icon-hi`)]) {
        const b = (await target.boundingBox())!;
        await page.mouse.click(b.x + b.width * .9, b.y + b.height / 2);
      }
    }
    if (mode === 'gel') {
      await expect(page.getByTestId('gel-rotate')).toHaveAttribute('aria-disabled', 'true');
      for (const id of ['gel-rotate-track', 'gel-rotate-icon-hi']) {
        const b = (await page.getByTestId(id).boundingBox())!;
        await page.mouse.click(b.x + b.width * .9, b.y + b.height / 2);
      }
      await expect(page.getByTestId('gel-canvas').locator('..')).toHaveCSS('transform', 'none');
    }
    await page.getByRole('button', { name: 'Application settings' }).click();
    const pending = page.waitForEvent('download');
    await page.getByTestId(mode === 'gel' ? 'save-gel-btn' : 'save-sample-btn').click();
    const saved = JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
    expect(mode === 'gel' ? saved.Gel.Buffer : saved.Sample.Buffer)
      .toEqual(mode === 'gel' ? native.Gel.Buffer : native.Gel.Samples[0].Buffer);
    await page.keyboard.press('Escape');
  }
});

test('startup Save Gel matches the independent native startup document', async ({ page }) => {
  await page.getByRole('button', { name: 'Application settings' }).click();
  const downloading = page.waitForEvent('download');
  await page.getByTestId('save-gel-btn').click();
  const actual = JSON.parse(await readFile((await (await downloading).path())!, 'utf8'));
  const native = JSON.parse(await readFile('../reference/native/files/ladder-after-selection.gel.json', 'utf8'));
  expect(actual).toEqual(native);
});
