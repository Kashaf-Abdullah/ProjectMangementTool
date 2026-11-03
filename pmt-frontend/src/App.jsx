import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { RealtimeProvider } from './context/RealtimeContext';
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';

import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ActivateAccount from './components/auth/ActivateAccount';
import Dashboard from './components/dashboard/Dashboard';
import Projects from './components/projects/Projects';
import ProjectDetails from './components/projects/ProjectDetails';
import Tasks from './components/tasks/Tasks';
import TeamChat from './components/chat/TeamChat';
import FilesHub from './components/files/FilesHub';
import ActivityFeed from './components/activity/ActivityFeed';
import Analytics from './components/analytics/Analytics';
import Users from './components/users/Users';
import Billing from './components/billings/Billing';
import Organizations from './components/organizations/Organizations';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <RealtimeProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                },
              }}
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/activate/:token" element={<ActivateAccount />} />

              {/* Protected Routes with Layout */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />

                  <Route path="projects">
                    <Route index element={<Projects />} />
                    <Route path=":projectId" element={<ProjectDetails />} />
                  </Route>

                  <Route path="tasks" element={<Tasks />} />
                  <Route path="chat" element={<TeamChat />} />
                  <Route path="files" element={<FilesHub />} />
                  <Route path="activity" element={<ActivityFeed />} />
                  <Route path="analytics" element={<Analytics />} />

                  <Route element={<AdminRoute allowPM={true} />}>
                    <Route path="users" element={<Users />} />
                  </Route>

                  <Route element={<AdminRoute />}>
                    <Route path="organizations" element={<Organizations />} />
                  </Route>

                  <Route path="billing" element={<Billing />} />
                </Route>
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </RealtimeProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
