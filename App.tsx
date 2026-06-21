import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Workout    = lazy(() => import('./pages/Workout'));
const History    = lazy(() => import('./pages/History'));
const Stats      = lazy(() => import('./pages/Stats'));
const TrophyRoom = lazy(() => import('./pages/TrophyRoom'));
const Settings   = lazy(() => import('./pages/Settings'));
const MuscleLoadScreen = lazy(() => import('./pages/MuscleLoadScreen'));
const ConsistencyScreen = lazy(() => import('./pages/ConsistencyScreen'));
const VolumeEvolutionScreen = lazy(() => import('./pages/VolumeEvolutionScreen'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
  </div>
);

const App: React.FC = () => (
  <HashRouter>
    <ScrollToTop />
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Workout />} />
          <Route path="today"    element={<Dashboard />} />
          <Route path="muscle-load" element={<MuscleLoadScreen />} />
          <Route path="consistency" element={<ConsistencyScreen />} />
          <Route path="volume-evolution" element={<VolumeEvolutionScreen />} />
          <Route path="history"  element={<History />} />
          <Route path="stats"    element={<Stats />} />
          <Route path="trophies" element={<TrophyRoom />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </Suspense>
  </HashRouter>
);

export default App;
