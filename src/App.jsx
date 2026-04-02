import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import Itinerary from './pages/Itinerary';
import TripDetail from './pages/TripDetail';
import NewTrip from './pages/NewTrip';
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
import ProfilePreferences from './pages/ProfilePreferences';
import ProfileTravelers from './pages/ProfileTravelers';
import ProfilePayments from './pages/ProfilePayments';
import ProfileSecurity from './pages/ProfileSecurity';
import ProfileSettings from './pages/ProfileSettings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/itinerary/new" element={<NewTrip />} />
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
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/preferences" element={<ProfilePreferences />} />
        <Route path="/profile/travelers" element={<ProfileTravelers />} />
        <Route path="/profile/payments" element={<ProfilePayments />} />
        <Route path="/profile/security" element={<ProfileSecurity />} />
        <Route path="/profile/settings" element={<ProfileSettings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
  };


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App