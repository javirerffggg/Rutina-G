import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Workout    = lazy(() => import('./pages/Workout'));
const Plan       = lazy(() => import('./pages/Plan'));
const Stats      = lazy(() => import('./pages/Stats'));
const TrophyRoom = lazy(() => import('./pages/TrophyRoom'));

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
  </div>
);

const App: React.FC = () => (
  <HashRouter>
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Workout />} />
          <Route path="today"    element={<Dashboard />} />
          <Route path="plan"     element={<Plan />} />
          <Route path="stats"    element={<Stats />} />
          <Route path="trophies" element={<TrophyRoom />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </Suspense>
  </HashRouter>
);

export default App;
