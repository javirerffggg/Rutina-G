import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Plan from './pages/Plan';
import Stats from './pages/Stats';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Workout />} />
          <Route path="today" element={<Dashboard />} />
          <Route path="plan" element={<Plan />} />
          <Route path="stats" element={<Stats />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;