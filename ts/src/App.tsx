import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './routes/HomePage';
import { ThemeProvider } from './lib/theme';

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
