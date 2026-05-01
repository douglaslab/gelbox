import { useState } from 'react';
import { SliderView } from '../components/primitives/SliderView';

export function DevSliderPage() {
  const [voltage,  setVoltage ] = useState(70);
  const [wellDmg,  setWellDmg ] = useState(0.3);
  const [graph,    setGraph   ] = useState<number[]>([0.9, 0.6, 0.4, 0.25, 0.15, 0.1, 0.05, 0.05]);

  return (
    <main style={{ maxWidth: 800, margin: '24px auto', padding: 16, fontFamily: 'Inter' }}>
      <h1>Slider primitives</h1>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Slider style — Voltage</h2>
        <SliderView
          testId="slider-voltage"
          config={{
            style: 'slider',
            valueMin: 30,
            valueMax: 170,
            quantize: 10,
            notches: [0, 0.25, 0.5, 0.75, 1],
            notchAction: 'snap',
            formatValue: (v) => `${v} V`,
          }}
          value={voltage}
          onChange={setVoltage}
          iconLo="/assets/slider-icons/voltage-lo.png"
          iconHi="/assets/slider-icons/voltage-hi.png"
        />
      </section>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Bar style — Well damage</h2>
        <SliderView
          testId="slider-welldmg"
          config={{
            style: 'bar',
            valueMin: 0,
            valueMax: 1,
            quantize: 0,
            formatValue: (v) => v.toFixed(2),
          }}
          value={wellDmg}
          onChange={setWellDmg}
          iconLo="/assets/slider-icons/well-damage-lo.png"
          iconHi="/assets/slider-icons/well-damage-hi.png"
        />
      </section>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Graph style — Aggregate distribution</h2>
        <SliderView
          testId="slider-graph"
          config={{
            style: 'graph',
            valueMin: 0,
            valueMax: 1,
            quantize: 0,
          }}
          value={0}
          onChange={() => undefined}
          graphValues={graph}
          onGraphChange={setGraph}
          iconLo="/assets/slider-icons/multimer-lo.png"
          iconHi="/assets/slider-icons/multimer-hi.png"
          width={300}
        />
      </section>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Disabled slider</h2>
        <SliderView
          config={{
            style: 'slider',
            valueMin: 0,
            valueMax: 100,
            quantize: 0,
            enabled: false,
            formatValue: (v) => `${v}%`,
          }}
          value={50}
          onChange={() => undefined}
          iconLo="/assets/slider-icons/aspect-lo.png"
          iconHi="/assets/slider-icons/aspect-hi.png"
        />
      </section>
    </main>
  );
}
