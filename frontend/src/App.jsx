import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

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

// New Design Previews
const LandingUIDesign = lazy(() => import('./pages/new-designs/LandingUIDesign'));
const AdminUIDesign = lazy(() => import('./pages/new-designs/AdminUIDesign'));
const CitizenUIDesign = lazy(() => import('./pages/new-designs/CitizenUIDesign'));
const NgoUIDesign = lazy(() => import('./pages/new-designs/NgoUIDesign'));
const AmbulanceUIDesign = lazy(() => import('./pages/new-designs/AmbulanceUIDesign'));
const HospitalUIDesign = lazy(() => import('./pages/new-designs/HospitalUIDesign'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm text-surface-muted font-medium">Loading PawSaarthi...</p>
    </div>
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

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={isNewUI ? withSuspense(<LandingUIDesign />) : <Home />} />
      <Route path="/login" element={withSuspense(<Login />)} />
      <Route path="/register" element={withSuspense(<Register />)} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route element={<Layout />}>
          <Route path="/user/dashboard" element={isNewUI ? withSuspense(<CitizenUIDesign />) : withSuspense(<UserDashboard />)} />
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
          <Route path="/ngo/dashboard" element={isNewUI ? withSuspense(<NgoUIDesign />) : withSuspense(<NGODashboard />)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['hospital']} />}>
        <Route element={<Layout />}>
          <Route path="/hospital/dashboard" element={isNewUI ? withSuspense(<HospitalUIDesign />) : withSuspense(<HospitalDashboard />)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ambulance']} />}>
        <Route element={<Layout />}>
          <Route path="/ambulance/dashboard" element={isNewUI ? withSuspense(<AmbulanceUIDesign />) : withSuspense(<AmbulanceDashboard />)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={isNewUI ? withSuspense(<AdminUIDesign />) : withSuspense(<AdminDashboard />)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
