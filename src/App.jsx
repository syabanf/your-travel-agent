import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from './components/Layout';
import PageNotFound from './lib/PageNotFound';

// Eager — needed for first paint
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Home from './pages/Home';

// Lazy — mobile app (loaded on demand)
const Itinerary = lazy(() => import('./pages/Itinerary'));
const TripDetail = lazy(() => import('./pages/TripDetail'));
const NewTrip = lazy(() => import('./pages/NewTrip'));
const TripWizard = lazy(() => import('./pages/TripWizard'));
const AddActivity = lazy(() => import('./pages/AddActivity'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Booking = lazy(() => import('./pages/Booking'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const MapView = lazy(() => import('./pages/MapView'));
const BudgetView = lazy(() => import('./pages/BudgetView'));
const ChecklistView = lazy(() => import('./pages/ChecklistView'));
const BookingSearch = lazy(() => import('./pages/BookingSearch'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const BookingCheckout = lazy(() => import('./pages/BookingCheckout'));
const AssistantProfile = lazy(() => import('./pages/AssistantProfile'));
const ConsultationBooking = lazy(() => import('./pages/ConsultationBooking'));
const Promotions = lazy(() => import('./pages/Promotions'));
const PromotionDetail = lazy(() => import('./pages/PromotionDetail'));
const DestinationDetail = lazy(() => import('./pages/DestinationDetail'));
const ProfilePreferences = lazy(() => import('./pages/ProfilePreferences'));
const ProfileTravelers = lazy(() => import('./pages/ProfileTravelers'));
const ProfilePayments = lazy(() => import('./pages/ProfilePayments'));
const ProfileSecurity = lazy(() => import('./pages/ProfileSecurity'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const ProfilePrivacy = lazy(() => import('./pages/ProfilePrivacy'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const OTA = lazy(() => import('./pages/OTA'));
const Help = lazy(() => import('./pages/Help'));
const Search = lazy(() => import('./pages/Search'));

// Lazy — admin dashboard (heavy: recharts, OpenLayers, jsPDF) split off the initial bundle
const DashboardLayout = lazy(() => import('./dashboard/DashboardLayout'));
const DashboardOverview = lazy(() => import('./dashboard/DashboardOverview'));
const DashboardDestinations = lazy(() => import('./dashboard/DashboardDestinations'));
const DashboardDestinationDetail = lazy(() => import('./dashboard/DashboardDestinationDetail'));
const DashboardPromotions = lazy(() => import('./dashboard/DashboardPromotions'));
const DashboardPromotionDetail = lazy(() => import('./dashboard/DashboardPromotionDetail'));
const DashboardBookings = lazy(() => import('./dashboard/DashboardBookings'));
const DashboardBookingDetail = lazy(() => import('./dashboard/DashboardBookingDetail'));
const DashboardTripDetail = lazy(() => import('./dashboard/DashboardTripDetail'));
const DashboardCustomers = lazy(() => import('./dashboard/DashboardCustomers'));
const DashboardCustomerDetail = lazy(() => import('./dashboard/DashboardCustomerDetail'));
const DashboardLeads = lazy(() => import('./dashboard/DashboardLeads'));
const DashboardLeadDetail = lazy(() => import('./dashboard/DashboardLeadDetail'));
const DashboardSuppliers = lazy(() => import('./dashboard/DashboardSuppliers'));
const DashboardSupplierDetail = lazy(() => import('./dashboard/DashboardSupplierDetail'));
const DashboardMarketing = lazy(() => import('./dashboard/DashboardMarketing'));
const DashboardCampaignDetail = lazy(() => import('./dashboard/DashboardCampaignDetail'));
const DashboardReports = lazy(() => import('./dashboard/DashboardReports'));
const DashboardBusiness = lazy(() => import('./dashboard/DashboardBusiness'));
const DashboardAIReports = lazy(() => import('./dashboard/DashboardAIReports'));
const DashboardERP = lazy(() => import('./dashboard/DashboardERP'));
const DashboardContent = lazy(() => import('./dashboard/DashboardContent'));
const DashboardMedia = lazy(() => import('./dashboard/DashboardMedia'));
const DashboardSettings = lazy(() => import('./dashboard/DashboardSettings'));
const DashboardAudit = lazy(() => import('./dashboard/DashboardAudit'));
const DashboardTeam = lazy(() => import('./dashboard/DashboardTeam'));

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
  <Suspense fallback={<Spinner />}>
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
          <Route path="destinations/:id" element={<DashboardDestinationDetail />} />
          <Route path="promotions" element={<DashboardPromotions />} />
          <Route path="promotions/:id" element={<DashboardPromotionDetail />} />
          <Route path="bookings" element={<DashboardBookings />} />
          <Route path="bookings/:id" element={<DashboardBookingDetail />} />
          <Route path="trips/:id" element={<DashboardTripDetail />} />
          <Route path="customers" element={<DashboardCustomers />} />
          <Route path="customers/:id" element={<DashboardCustomerDetail />} />
          <Route path="leads" element={<DashboardLeads />} />
          <Route path="leads/:id" element={<DashboardLeadDetail />} />
          <Route path="suppliers" element={<DashboardSuppliers />} />
          <Route path="suppliers/:id" element={<DashboardSupplierDetail />} />
          <Route path="marketing" element={<DashboardMarketing />} />
          <Route path="marketing/:id" element={<DashboardCampaignDetail />} />
          <Route path="reports" element={<DashboardReports />} />
          <Route path="business" element={<DashboardBusiness />} />
          <Route path="ai-reports" element={<DashboardAIReports />} />
          <Route path="erp" element={<DashboardERP />} />
          <Route path="content" element={<DashboardContent />} />
          <Route path="media" element={<DashboardMedia />} />
          <Route path="settings" element={<DashboardSettings />} />
          <Route path="audit" element={<DashboardAudit />} />
          <Route path="team" element={<DashboardTeam />} />
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
          <Route path="/consultation/:assistantId" element={<ConsultationBooking />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/ota" element={<OTA />} />
          <Route path="/search" element={<Search />} />
          <Route path="/help" element={<Help />} />
          <Route path="/booking/search" element={<BookingSearch />} />
          <Route path="/booking/:bookingId" element={<BookingDetail />} />
          <Route path="/booking/:bookingId/checkout" element={<BookingCheckout />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/promotions/:id" element={<PromotionDetail />} />
          <Route path="/destination/:id" element={<DestinationDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/preferences" element={<ProfilePreferences />} />
          <Route path="/profile/travelers" element={<ProfileTravelers />} />
          <Route path="/profile/payments" element={<ProfilePayments />} />
          <Route path="/profile/security" element={<ProfileSecurity />} />
          <Route path="/profile/settings" element={<ProfileSettings />} />
          <Route path="/profile/privacy" element={<ProfilePrivacy />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Route>
    </Routes>
  </Suspense>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
          <SonnerToaster position="top-center" richColors toastOptions={{ style: { fontFamily: 'var(--font-body)' } }} />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
