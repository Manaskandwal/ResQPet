import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PawLoader from './components/PawLoader';

const Fundraisers = lazy(() => import('./pages/Fundraisers'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const SubmitRescue = lazy(() => import('./pages/user/SubmitRescue'));
const RescueDetail = lazy(() => import('./pages/user/RescueDetail'));
const PaymentHistory = lazy(() => import('./pages/user/PaymentHistory'));
const Impact = lazy(() => import('./pages/Impact'));
const MyRescueReports = lazy(() => import('./pages/user/MyRescueReports'));
const NGODashboard = lazy(() => import('./pages/ngo/NGODashboard'));
const HospitalDashboard = lazy(() => import('./pages/hospital/HospitalDashboard'));
const AmbulanceDashboard = lazy(() => import('./pages/ambulance/AmbulanceDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Notifications = lazy(() => import('./pages/Notifications'));

// New Design Previews (landing only - other pages use isNewUI flag internally)
const LandingUIDesign = lazy(() => import('./pages/new-designs/LandingUIDesign'));

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const RouteFallback = () => (
  <div className={`min-h-screen flex items-center justify-center ${isNewUI ? 'bg-[#131313]' : 'bg-slate-50'}`}>
    <PawLoader />
  </div>
);

const withSuspense = (element) => (
  <Suspense fallback={<RouteFallback />}>
    {element}
  </Suspense>
);

const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <RouteFallback />;
  if (!user) return <Navigate to="/login" replace />;

  const routes = {
    user: '/user/dashboard',
    ngo: '/ngo/dashboard',
    hospital: '/hospital/dashboard',
    ambulance: '/ambulance/dashboard',
    admin: '/admin/dashboard',
  };

  if (user.isAdmin && !user.impersonating) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to={routes[user.role] || '/user/dashboard'} replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={isNewUI ? withSuspense(<LandingUIDesign />) : <Home />} />
      <Route path="/login" element={withSuspense(<Login />)} />
      <Route path="/register" element={withSuspense(<Register />)} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route element={<ProtectedRoute allowedRoles={['user', 'ngo', 'hospital', 'ambulance', 'admin']} />}>
        <Route element={<Layout />}>
          <Route path="/notifications" element={withSuspense(<Notifications />)} />
        </Route>
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route element={<Layout />}>
          <Route path="/user/dashboard" element={withSuspense(<UserDashboard />)} />
          <Route path="/user/submit-rescue" element={withSuspense(<SubmitRescue />)} />
          <Route path="/user/rescue/:id" element={withSuspense(<RescueDetail />)} />
          <Route path="/user/payments" element={withSuspense(<PaymentHistory />)} />
          <Route path="/user/reports" element={withSuspense(<MyRescueReports />)} />
          <Route path="/fundraisers" element={withSuspense(<Fundraisers />)} />
          <Route path="/impact" element={withSuspense(<Impact />)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ngo']} />}>
        <Route element={<Layout />}>
          <Route path="/ngo/dashboard" element={withSuspense(<NGODashboard />)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['hospital']} />}>
        <Route element={<Layout />}>
          <Route path="/hospital/dashboard" element={withSuspense(<HospitalDashboard />)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ambulance']} />}>
        <Route element={<Layout />}>
          <Route path="/ambulance/dashboard" element={withSuspense(<AmbulanceDashboard />)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={withSuspense(<AdminDashboard />)} />
          <Route path="/admin/notifications" element={withSuspense(<Notifications />)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
