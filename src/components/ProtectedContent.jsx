import { useEffect, useState } from "react";
import { EyeOff, Lock } from "lucide-react";
import { currentEmail } from "@/lib/featureAccess";

/**
 * Wraps content the agency doesn't want copied — a priced proposal, or an
 * itinerary someone has paid for.
 *
 * A browser cannot actually block a screenshot: the OS capture path is not
 * visible to the page, and on mobile it doesn't even disturb the tab. So this
 * is deterrence, in descending order of how much it's really worth:
 *
 *   1. A watermark carrying the viewer's identity. This is the one that
 *      survives the capture, so a leaked screenshot points back at a person.
 *   2. Blanking on print — `@media print` genuinely works.
 *   3. Blanking when the window loses focus, which catches desktop capture
 *      tools that steal focus. It does nothing on a phone.
 *   4. Blocking selection, drag and the context menu, which stops the lazier
 *      copy-paste and save-image routes.
 *
 * Anyone determined still gets the pixels. The point is to make casual sharing
 * traceable and inconvenient, not to claim the content is secure.
 */
export default function ProtectedContent({ children, label = "Protected content", className = "" }) {
  const [obscured, setObscured] = useState(false);
  const viewer = currentEmail();

  useEffect(() => {
    const hide = () => setObscured(true);
    const show = () => setObscured(false);
    const onVisibility = () => setObscured(document.visibilityState !== "visible");

    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const stamp = `${viewer} · ${new Date().toLocaleDateString()}`;

  return (
    <div
      className={`ich-protected relative ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className={obscured ? "pointer-events-none blur-lg select-none" : ""}>{children}</div>

      {/* Repeating identity stamp. aria-hidden so it isn't read aloud on every
          line of the itinerary. */}
      <div
        aria-hidden="true"
        className="ich-watermark pointer-events-none absolute inset-0 overflow-hidden select-none"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-[10px] tracking-wider whitespace-nowrap text-ich-primary/[0.06] font-medium"
            style={{ top: `${i * 11}%`, left: "-10%", transform: "rotate(-24deg)" }}
          >
            {`${stamp}   ${stamp}   ${stamp}`}
          </span>
        ))}
      </div>

      {/* Shown while the window is in the background. */}
      {obscured && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-ich-cream/80 backdrop-blur-sm">
          <EyeOff className="h-5 w-5 text-ich-neutral" />
          <p className="text-xs font-medium text-ich-neutral">{label} hidden</p>
          <p className="text-[10px] text-ich-neutral/70">Return to this window to view it</p>
        </div>
      )}

      {/* Replaces the content in print and PDF export. */}
      <div className="ich-print-notice hidden items-center justify-center gap-2 p-8 text-center">
        <Lock className="h-4 w-4" />
        <span className="text-sm">
          {label} isn&apos;t available for printing. Contact Icon Holiday for a copy.
        </span>
      </div>
    </div>
  );
}
