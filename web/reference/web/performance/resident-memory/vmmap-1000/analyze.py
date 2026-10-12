"""Summarize retained footprint and forced-GC observations; no budget assertion."""
import hashlib
import json
from pathlib import Path
import re
import statistics

root = Path(__file__).parent
results = []
for report_path in sorted(root.glob('chromium-*/resource-lifecycle.json')):
    report = json.loads(report_path.read_text())
    assert report['cycles'] == 1000
    assert set(report['closedCycleCounts']) == {report['baseline']}
    assert len(report['closedCycleCounts']) == 1000
    assert report['afterRouteUnmount'] == 0
    assert not list(report_path.parent.glob('*-error.txt'))
    footprints = []
    for path in sorted(report_path.parent.glob('vmmap-*.txt')):
        match = re.fullmatch(r'vmmap-(0|100|1000)-(renderer|GPU)-(\d+)\.txt', path.name)
        assert match, path
        raw = path.read_text()
        value = re.search(r'Physical footprint:\s*([\d.]+)M', raw)
        peak = re.search(r'Physical footprint \(peak\):\s*([\d.]+)M', raw)
        assert value and peak, path
        footprints.append({
            'cycle': int(match[1]), 'process': match[2], 'pid': int(match[3]),
            'physicalFootprintMiB': float(value[1]), 'peakMiB': float(peak[1]),
            'partitionAllocUnavailable': "Can't examine target process's malloc zone PartitionAlloc" in raw,
            'source': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        })
    assert {(p['cycle'], p['process']) for p in footprints} == {
        (cycle, process) for cycle in (0, 100, 1000) for process in ('renderer', 'GPU')
    }
    samples = [s for s in report['memory'] if 500 <= s['cycle'] <= 1000]
    assert len(samples) == 51
    mean_cycle = statistics.mean(s['cycle'] for s in samples)
    heap = {}
    for field in ('usedSize', 'embedderHeapUsedSize', 'backingStorageSize'):
        mean_value = statistics.mean(s[field] for s in samples)
        heap[field] = {
            'endpointChangeBytes': samples[-1][field] - samples[0][field],
            'minBytes': min(s[field] for s in samples),
            'maxBytes': max(s[field] for s in samples),
            'slopeBytesPerCycle': sum((s['cycle']-mean_cycle)*(s[field]-mean_value) for s in samples)
                / sum((s['cycle']-mean_cycle)**2 for s in samples),
        }
    results.append({
        'backend': report['backend'],
        'reportSha256': hashlib.sha256(report_path.read_bytes()).hexdigest(),
        'footprints': footprints,
        'heapCycles': [500, 1000], 'heapSamples': len(samples), 'heap': heap,
        'domRanges': {field: [min(s['dom'][field] for s in samples), max(s['dom'][field] for s in samples)]
            for field in ('documents', 'nodes', 'jsEventListeners')},
    })
assert len(results) == 2
print(json.dumps(results, indent=2))
