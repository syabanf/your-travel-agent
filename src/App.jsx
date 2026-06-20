import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';

// Public / full-screen
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';

// Mobile app
import Home from './pages/Home';
import Itinerary from './pages/Itinerary';
import TripDetail from './pages/TripDetail';
import NewTrip from './pages/NewTrip';
import TripWizard from './pages/TripWizard';
import AddActivity from './pages/AddActivity';
import AIAssistant from './pages/AIAssistant';
import Booking from './pages/Booking';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import CalendarView from './pages/CalendarView';
import MapView from './pages/MapView';
import BudgetView from './pages/BudgetView';
import ChecklistView from './pages/ChecklistView';
import BookingSearch from './pages/BookingSearch';
import BookingDetail from './pages/BookingDetail';
import BookingCheckout from './pages/BookingCheckout';
import AssistantProfile from './pages/AssistantProfile';
import Promotions from './pages/Promotions';
import ProfilePreferences from './pages/ProfilePreferences';
import ProfileTravelers from './pages/ProfileTravelers';
import ProfilePayments from './pages/ProfilePayments';
import ProfileSecurity from './pages/ProfileSecurity';
import ProfileSettings from './pages/ProfileSettings';

// Admin dashboard (desktop)
import DashboardLayout from './dashboard/DashboardLayout';
import DashboardOverview from './dashboard/DashboardOverview';
import DashboardDestinations from './dashboard/DashboardDestinations';
import DashboardPromotions from './dashboard/DashboardPromotions';
import DashboardBookings from './dashboard/DashboardBookings';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-mora-gold/20 border-t-mora-gold rounded-full animate-spin" />
  </div>
);

const RequireSession = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/splash" replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public, full-screen */}
    <Route path="/splash" element={<Splash />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Login register />} />

    {/* Everything below requires a session */}
    <Route element={<RequireSession />}>
      {/* Admin dashboard / CMS (desktop) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="destinations" element={<DashboardDestinations />} />
        <Route path="promotions" element={<DashboardPromotions />} />
        <Route path="bookings" element={<DashboardBookings />} />
      </Route>

      {/* Mobile app */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/itinerary/new" element={<NewTrip />} />
        <Route path="/itinerary/wizard" element={<TripWizard />} />
        <Route path="/itinerary/calendar" element={<CalendarView />} />
        <Route path="/itinerary/map" element={<MapView />} />
        <Route path="/itinerary/budget" element={<BudgetView />} />
        <Route path="/itinerary/checklist" element={<ChecklistView />} />
        <Route path="/itinerary/:tripId" element={<TripDetail />} />
        <Route path="/itinerary/:tripId/add" element={<AddActivity />} />
        <Route path="/itinerary/:tripId/edit" element={<NewTrip />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/assistant/ai" element={<AIAssistant />} />
        <Route path="/assistant/profile/:assistantId" element={<AssistantProfile />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/search" element={<BookingSearch />} />
        <Route path="/booking/:bookingId" element={<BookingDetail />} />
        <Route path="/booking/:bookingId/checkout" element={<BookingCheckout />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/preferences" element={<ProfilePreferences />} />
        <Route path="/profile/travelers" element={<ProfileTravelers />} />
        <Route path="/profile/payments" element={<ProfilePayments />} />
        <Route path="/profile/security" element={<ProfileSecurity />} />
        <Route path="/profile/settings" element={<ProfileSettings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Route>
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors toastOptions={{ style: { fontFamily: 'var(--font-body)' } }} />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
