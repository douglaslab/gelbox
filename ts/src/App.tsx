import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './routes/HomePage';
import { GelPage } from './routes/GelPage';
import { DevPage } from './routes/DevPage';
import { ThemeProvider } from './lib/theme';

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="gel" element={<GelPage />} />
            <Route path="dev" element={<DevPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
