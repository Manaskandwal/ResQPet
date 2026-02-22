import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import SubmitRescue from './pages/user/SubmitRescue';
import RescueDetail from './pages/user/RescueDetail';

// NGO
import NGODashboard from './pages/ngo/NGODashboard';

// Hospital
import HospitalDashboard from './pages/hospital/HospitalDashboard';

// Ambulance
import AmbulanceDashboard from './pages/ambulance/AmbulanceDashboard';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    user: '/user/dashboard',
    ngo: '/ngo/dashboard',
    hospital: '/hospital/dashboard',
    ambulance: '/ambulance/dashboard',
    admin: '/admin/dashboard',
  };
  return <Navigate to={routes[user.role] || '/login'} replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* User routes */}
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route element={<Layout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/submit-rescue" element={<SubmitRescue />} />
          <Route path="/user/rescue/:id" element={<RescueDetail />} />
        </Route>
      </Route>

      {/* NGO routes */}
      <Route element={<ProtectedRoute allowedRoles={['ngo']} />}>
        <Route element={<Layout />}>
          <Route path="/ngo/dashboard" element={<NGODashboard />} />
        </Route>
      </Route>

      {/* Hospital routes */}
      <Route element={<ProtectedRoute allowedRoles={['hospital']} />}>
        <Route element={<Layout />}>
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
        </Route>
      </Route>

      {/* Ambulance routes */}
      <Route element={<ProtectedRoute allowedRoles={['ambulance']} />}>
        <Route element={<Layout />}>
          <Route path="/ambulance/dashboard" element={<AmbulanceDashboard />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
