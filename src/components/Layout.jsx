import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  const location = useLocation();
  const hideNav = ['/onboarding', '/splash'].includes(location.pathname);

  return (
    <div className="min-h-screen max-w-lg mx-auto relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e22] via-[#2A4631] to-[#162a1e]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A5997E]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-0 w-80 h-80 bg-[#606A54]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2A4631]/30 rounded-full blur-3xl" />
      </div>
      
      <main className="relative z-10 pb-24 min-h-screen">
        <Outlet />
      </main>
      
      {!hideNav && <BottomNav />}
    </div>
  );
}