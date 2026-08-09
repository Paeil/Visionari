import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AccessPage from './pages/AccessPage';
import DashboardHome from './pages/DashboardHome';
import TaskManagement from './pages/TaskManagement';
import UpcomingEvents from './pages/UpcomingEvents';
import ClassFunds from './pages/ClassFunds';
import Photos from './pages/Photos';
import Settings from './pages/Settings';



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The first page users see */}
        <Route path="/" element={<AccessPage />} />
        
        {/* The protected officer dashboard */}
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/tasks" element={<TaskManagement />} />
        <Route path="/events" element={<UpcomingEvents />} />
        <Route path="/class-funds" element={<ClassFunds />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

