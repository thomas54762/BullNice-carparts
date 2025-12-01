import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { LicensePlateSearch } from './pages/LicensePlateSearch';
import { SearchResults } from './pages/SearchResults';
import { SearchHistory } from './pages/SearchHistory';
import { ProfileSettings } from './pages/ProfileSettings';
import { Admin } from './pages/Admin';
import { Integrations } from './pages/admin/Integrations';
import { Logs } from './pages/admin/Logs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes with layout */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="search" element={<LicensePlateSearch />} />
          <Route path="results" element={<SearchResults />} />
          <Route path="history" element={<SearchHistory />} />
          <Route path="profile" element={<ProfileSettings />} />
          
          {/* Admin routes */}
          <Route path="admin" element={<Admin />}>
            <Route index element={<Navigate to="/admin/integrations" replace />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="logs" element={<Logs />} />
          </Route>
        </Route>
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
