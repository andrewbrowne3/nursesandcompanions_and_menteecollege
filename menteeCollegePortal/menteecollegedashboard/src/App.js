import React from 'react';
import './App.css';

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './screens/Dashboard';
import LoginScreen from './screens/loginScreen';
import CourseScheduleEditor from './screens/CourseScheduleEditor';
import CourseManager from './Components/CourseManager';
import CourseListView from './Components/CourseListView';
import AdminRoute from './Components/AdminRoute';
import AdminDashboard from './Components/AdminDashboard';
import CartPage from './Components/Cart/CartPage';
import CheckoutPage from './screens/CheckoutPage';
import CohortManagement from './Components/CohortManagement';
import StudentProfile from './Components/StudentProfile';
import RequiredDocuments from './Components/RequiredDocuments';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './Components/ProtectedRoute';
import useTokenValidation from './hooks/useTokenValidation';

// Token validation component - checks token validity periodically
const TokenValidator = () => {
  useTokenValidation();
  return null;
};

function App() {
  return (
    <CartProvider>
      <Router>
        <TokenValidator />
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/Dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/course-schedule-editor" element={
              <ProtectedRoute>
                <CourseScheduleEditor />
              </ProtectedRoute>
            } />
            <Route path="/course-manager" element={
              <ProtectedRoute>
                <CourseManager />
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute>
                <CourseListView />
              </ProtectedRoute>
            } />
            <Route path="/cohort-management" element={
              <AdminRoute>
                <CohortManagement />
              </AdminRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/students/:username" element={
              <AdminRoute>
                <StudentProfile />
              </AdminRoute>
            } />
            <Route path="/required-documents" element={
              <AdminRoute>
                <RequiredDocuments />
              </AdminRoute>
            } />
          </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
