import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { LoadingState } from '../components/LoadingState';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import SetupAdmin from '../pages/auth/SetupAdmin';

// Dashboards
import StudentDashboard from '../pages/dashboards/StudentDashboard';
import FacultyDashboard from '../pages/dashboards/FacultyDashboard';
import MaintenanceDashboard from '../pages/dashboards/MaintenanceDashboard';
import TransportDashboard from '../pages/dashboards/TransportDashboard';
import ClubDashboard from '../pages/dashboards/ClubDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';

// Modules
import Profile from '../pages/profile/Profile';
import CampusConnect from '../pages/connect/CampusConnect';
import ProjectHub from '../pages/projects/ProjectHub';
import ProjectWorkspace from '../pages/projects/ProjectWorkspace';
import SkillSwapHub from '../pages/skillswap/SkillSwapHub';
import StudyHub from '../pages/studyhub/StudyHub';
import ResourceLibrary from '../pages/resources/ResourceLibrary';
import CampusSlot from '../pages/campusslot/CampusSlot';
import CampusFix from '../pages/campusfix/CampusFix';
import CampusLost from '../pages/campuslost/CampusLost';
import EventHub from '../pages/events/EventHub';
import ClubHub from '../pages/clubs/ClubHub';
import CampusRide from '../pages/campusride/CampusRide';
import CampusVoice from '../pages/campusvoice/CampusVoice';
import { MyCertificates } from '../pages/certificates/MyCertificates';
import { GlobalSearch } from '../pages/search/GlobalSearch';

// Admin Pages
import CollegeSetup from '../pages/admin/CollegeSetup';
import { UserManagement } from '../pages/admin/UserManagement';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Verifying session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Dynamic Dashboard Selector
const DynamicDashboard = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'faculty':
      return <FacultyDashboard />;
    case 'maintenance_staff':
      return <MaintenanceDashboard />;
    case 'transport_staff':
      return <TransportDashboard />;
    case 'club_coordinator':
      return <ClubDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/setup-admin" element={<SetupAdmin />} />

      {/* Main role-based Dashboard routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DynamicDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DynamicDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/dashboard"
        element={
          <ProtectedRoute allowedRoles={['maintenance_staff']}>
            <MaintenanceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transport/dashboard"
        element={
          <ProtectedRoute allowedRoles={['transport_staff']}>
            <TransportDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/club/dashboard"
        element={
          <ProtectedRoute allowedRoles={['club_coordinator']}>
            <ClubDashboard />
          </ProtectedRoute>
        }
      />

      {/* Global & Shared Core Pages */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <GlobalSearch />
          </ProtectedRoute>
        }
      />

      <Route
        path="/certificates"
        element={
          <ProtectedRoute>
            <MyCertificates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-certificates"
        element={
          <ProtectedRoute>
            <MyCertificates />
          </ProtectedRoute>
        }
      />

      {/* Campus Modules (with dual aliases matching Sidebar & Cards) */}
      <Route
        path="/campus-connect"
        element={
          <ProtectedRoute>
            <CampusConnect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connect"
        element={
          <ProtectedRoute>
            <CampusConnect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectWorkspace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/skill-swap"
        element={
          <ProtectedRoute>
            <SkillSwapHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <SkillSwapHub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/study-hub"
        element={
          <ProtectedRoute>
            <StudyHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-groups"
        element={
          <ProtectedRoute>
            <StudyHub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <ResourceLibrary />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campus-slot"
        element={
          <ProtectedRoute>
            <CampusSlot />
          </ProtectedRoute>
        }
      />
      <Route
        path="/slots"
        element={
          <ProtectedRoute>
            <CampusSlot />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campus-fix"
        element={
          <ProtectedRoute>
            <CampusFix />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campus-lost"
        element={
          <ProtectedRoute>
            <CampusLost />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lost-found"
        element={
          <ProtectedRoute>
            <CampusLost />
          </ProtectedRoute>
        }
      />

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <EventHub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clubs"
        element={
          <ProtectedRoute>
            <ClubHub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campus-ride"
        element={
          <ProtectedRoute>
            <CampusRide />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ride"
        element={
          <ProtectedRoute>
            <CampusRide />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campus-voice"
        element={
          <ProtectedRoute>
            <CampusVoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice"
        element={
          <ProtectedRoute>
            <CampusVoice />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Pages */}
      <Route
        path="/admin/setup"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CollegeSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/college-setup"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CollegeSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default AppRoutes;
