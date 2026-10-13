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
    <div className="min-h-screen bg-foreground flex items-center justify-center p-0 md:p-6">
      {/* Device frame — rounded border only on desktop */}
      <div className="w-full md:w-[393px] h-screen md:h-[852px] relative md:rounded-[48px] md:overflow-hidden md:ring-[10px] md:ring-ink-3 md:shadow-float flex flex-col">
        {/* The grey canvas every screen sits on. */}
        <div className="absolute inset-0 z-0 bg-surface md:rounded-[48px]" />

        {/* Status Bar */}
        <div className="relative z-20 flex items-center justify-between px-7 pb-1 flex-shrink-0" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          <span className="text-[13px] font-semibold text-foreground">{timeStr}</span>
          <div className="md:block hidden absolute left-1/2 -translate-x-1/2 top-2 w-28 h-7 bg-foreground rounded-full" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-foreground" />
            <Wifi className="w-3.5 h-3.5 text-foreground" />
            <Battery className="w-4 h-4 text-foreground" />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
