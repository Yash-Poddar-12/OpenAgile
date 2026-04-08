import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PMDashboard } from './pages/PMDashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { IssuesPage } from './pages/IssuesPage';
import { KanbanPage } from './pages/KanbanPage';
import { FileMapPage } from './pages/FileMapPage';
import { ExportPage } from './pages/ExportPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RolesPage } from './pages/RolesPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

const FallbackRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/admin" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FallbackRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      <Route element={<DashboardLayout />}>
        <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/roles" element={<Navigate to="/roles" replace />} />
        
        <Route path="/dashboard" element={<PrivateRoute element={<PMDashboard />} />} />
        <Route path="/projects" element={<PrivateRoute element={<ProjectsPage />} />} />
        <Route path="/issues" element={<PrivateRoute element={<IssuesPage />} />} />
        <Route path="/kanban" element={<PrivateRoute element={<KanbanPage />} />} />
        <Route path="/filemap" element={<PrivateRoute element={<FileMapPage />} />} />
        <Route path="/export" element={<PrivateRoute element={<ExportPage />} />} />
        <Route path="/analytics" element={<PrivateRoute element={<AnalyticsPage />} />} />
        <Route path="/roles" element={<PrivateRoute element={<RolesPage />} />} />
        
        <Route path="*" element={<FallbackRedirect />} />
      </Route>
    </Routes>
  );
}
