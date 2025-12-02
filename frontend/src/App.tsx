import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ForgotPassword } from './pages/ForgotPassword';
import { LicensePlateSearch } from './pages/LicensePlateSearch';
import { ProfileSettings } from './pages/ProfileSettings';
import { ResetPassword } from './pages/ResetPassword';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes with layout */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/search" replace />} />
            <Route path="search" element={<LicensePlateSearch />} />
            <Route path="profile" element={<ProfileSettings />} />
          </Route>

          {/* Catch all - redirect to search */}
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
