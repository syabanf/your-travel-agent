import { Signal, Wifi, Battery } from "lucide-react";

/**
 * PhoneFrame — the shared device shell (backdrop, rounded frame, notch,
 * status bar and ambient background) used by every mobile screen so they all
 * sit inside the same phone border on desktop. Children fill the area below
 * the status bar (give the top child `flex-1`).
 */
export default function PhoneFrame({ children }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-0 md:p-6">
      {/* Device frame — rounded border only on desktop */}
      <div className="w-full md:w-[393px] h-screen md:h-[852px] relative md:rounded-[48px] md:overflow-hidden md:shadow-[0_0_0_10px_#1a1a1a,0_0_0_12px_#333,0_40px_80px_rgba(0,0,0,0.8)] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 z-0 md:rounded-[48px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-[#FBFAF5] to-[#F3F6FB]" />
          <div className="absolute -top-10 right-0 w-96 h-96 bg-[#AD1F23]/[0.07] rounded-full blur-3xl" />
          <div className="absolute bottom-24 -left-10 w-80 h-80 bg-[#0B1B3B]/[0.06] rounded-full blur-3xl" />
        </div>

        {/* Status Bar */}
        <div className="relative z-20 flex items-center justify-between px-7 pb-1 flex-shrink-0" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          <span className="text-[13px] font-semibold text-mora-white">{timeStr}</span>
          <div className="md:block hidden absolute left-1/2 -translate-x-1/2 top-2 w-28 h-7 bg-[#0d0d0d] rounded-full" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-mora-white" />
            <Wifi className="w-3.5 h-3.5 text-mora-white" />
            <Battery className="w-4 h-4 text-mora-white" />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
