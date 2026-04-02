import { Outlet, useLocation } from "react-router-dom";
import { Signal, Wifi, Battery } from "lucide-react";
import BottomNav from "./BottomNav";

export default function Layout() {
  const location = useLocation();
  const hideNav = ['/onboarding', '/splash'].includes(location.pathname);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-0 md:p-6">
      {/* Device frame — only visible on desktop */}
      <div className="w-full md:w-[393px] md:min-h-[852px] relative md:rounded-[48px] md:overflow-hidden md:shadow-[0_0_0_10px_#1a1a1a,0_0_0_12px_#333,0_40px_80px_rgba(0,0,0,0.8)] flex flex-col">
        {/* Background */}
        <div className="fixed md:absolute inset-0 z-0 md:rounded-[48px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e22] via-[#2A4631] to-[#162a1e]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#A5997E]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-0 w-80 h-80 bg-[#606A54]/10 rounded-full blur-3xl" />
        </div>

        {/* Status Bar */}
        <div className="relative z-20 flex items-center justify-between px-7 pt-4 pb-1 flex-shrink-0">
          <span className="text-[13px] font-semibold text-mora-white">{timeStr}</span>
          <div className="md:block hidden absolute left-1/2 -translate-x-1/2 top-2 w-28 h-7 bg-[#0d0d0d] rounded-full" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-mora-white" />
            <Wifi className="w-3.5 h-3.5 text-mora-white" />
            <Battery className="w-4 h-4 text-mora-white" />
          </div>
        </div>

        {/* Page content */}
        <main className="relative z-10 flex-1 overflow-y-auto hide-scrollbar" style={{ paddingBottom: hideNav ? 0 : 88 }}>
          <Outlet />
        </main>

        {/* Bottom Nav */}
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}