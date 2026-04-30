import { useRef, useState } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { serializeSample, serializeGelState, deserializeFile } from '../../lib/gel/serialize';

function downloadJson(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FileControls() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSample = state.samples[state.selectedLane];

  function onSaveSample() {
    if (!selectedSample) {
      setError('No sample in the selected lane');
      return;
    }
    setError(null);
    downloadJson(`${state.fixtureKey}-lane-${state.selectedLane}.json`, serializeSample(selectedSample));
  }

  function onSaveGel() {
    setError(null);
    downloadJson(`${state.fixtureKey}-gel.json`, serializeGelState({
      samples: state.samples,
      numLanes: state.numLanes,
      ctx: state.ctx,
    }));
  }

  function onOpenClick() {
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = deserializeFile(text);
      if (result.kind === 'sample') {
        dispatch({
          type: 'LOAD_FIXTURE',
          key: file.name.replace(/\.json$/i, ''),
          sample: result.sample,
          lane: state.selectedLane,
        });
      } else {
        dispatch({
          type: 'LOAD_GEL_STATE',
          samples: result.samples,
          numLanes: result.numLanes,
          ctx: result.ctx,
        });
      }
      setError(null);
    } catch (err) {
      setError(`Open failed: ${(err as Error).message}`);
    } finally {
      // Reset so the same file can be opened twice in a row
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <section data-testid="file-controls" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          data-testid="save-sample-btn"
          onClick={onSaveSample}
          disabled={!selectedSample}
          style={{ padding: '6px 10px' }}
        >
          Save sample
        </button>
        <button data-testid="save-gel-btn" onClick={onSaveGel} style={{ padding: '6px 10px' }}>
          Save gel
        </button>
        <button data-testid="open-btn" onClick={onOpenClick} style={{ padding: '6px 10px' }}>
          Open…
        </button>
        <input
          ref={fileInputRef}
          data-testid="file-input"
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>
      {error && (
        <div data-testid="file-error" style={{ color: 'var(--color-danger, #c44)', fontSize: 12 }}>
          {error}
        </div>
      )}
    </section>
  );
}
