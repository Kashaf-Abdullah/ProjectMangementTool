import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';

// Layout Components
import Layout from './components/common/Layout';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ActivateAccount from './components/auth/ActivateAccount';

// Dashboard Components
import Dashboard from './components/dashboard/Dashboard';

// Projects Components
import Projects from './components/projects/Projects';
import ProjectDetails from './components/projects/ProjectDetails';

// Tasks Components
import Tasks from './components/tasks/Tasks';

// Users Components
import Users from './components/users/Users';

// Billing Components
import Billing from './components/billings/Billing';

// Organizations Components
import Organizations from './components/organizations/Organizations';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
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
              
              {/* Projects Routes */}
              <Route path="projects">
                <Route index element={<Projects />} />
                <Route path=":projectId" element={<ProjectDetails />} />
              </Route>
              
              {/* Tasks Routes */}
              <Route path="tasks" element={<Tasks />} />
              
              {/* Users Routes (Admin only) */}
              <Route element={<AdminRoute />}>
                <Route path="users" element={<Users />} />
                <Route path="organizations" element={<Organizations />} />
              </Route>
              
              {/* Billing Routes */}
              <Route path="billing" element={<Billing />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;