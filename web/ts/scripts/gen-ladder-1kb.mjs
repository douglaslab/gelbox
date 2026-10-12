// Reproduce the native startup ladder from its recorded native export.
// Source/provenance: reference/native/manifest.json and GelboxApp::setup at 5f51097.
// Keep channel floats unchanged: Cinder RGB is not gamma-decoded on XML import.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const reference = resolve(here, '../../reference/native/files/ladder-after-selection.gel.json');
const { Gel: { Samples: [sample] } } = JSON.parse(readFileSync(reference, 'utf8'));
assert.equal(sample.name, '1kb ladder');
const fixture = {
  schema: 'gel-sample-v0',
  name: sample.name, icon: sample.icon, iconScale: sample.iconScale, id: sample.id,
  buffer: { tris: sample.Buffer.Tris, borate: sample.Buffer.Borate,
    acetate: sample.Buffer.Acetate, edta: sample.Buffer.EDTA },
  fragments: sample.Fragments.map(f => {
    assert.equal(f.Dye, undefined, 'startup ladder must contain DNA species, not dyes');
    return { bases: f.Bases, mass: f.Mass, degrade: f.Degrade, dye: -1,
      aggregate: f.Aggregate, aspectRatio: f.AspectRatio, color: f.Color };
  }),
};
const out = resolve(here, '../fixtures/states/ladder-1kb.json');
writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n');
console.log(`Wrote ${out} (${fixture.fragments.length} native fragments)`);
