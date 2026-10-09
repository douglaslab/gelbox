import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { GelPage } from './routes/GelPage';
import { DevPage } from './routes/DevPage';
import { DevMultiPage } from './routes/DevMultiPage';
import { DevPerfPage } from './routes/DevPerfPage';
import { DevSimPage } from './routes/DevSimPage';
import { DevSliderPage } from './routes/DevSliderPage';
import { ThemeProvider } from './lib/theme';

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route index element={<GelPage />} />
          <Route path="gel" element={<GelPage />} />
          <Route element={<AppLayout />}>
            <Route path="dev" element={<DevPage />} />
            <Route path="dev/multi" element={<DevMultiPage />} />
            <Route path="dev/perf" element={<DevPerfPage />} />
            <Route path="dev/sim" element={<DevSimPage />} />
            <Route path="dev/slider" element={<DevSliderPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
