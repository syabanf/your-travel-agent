import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Download, Plus, Share, Sparkles, X } from "lucide-react";

const DISMISS_KEY = "ich_install_dismissed";
// Long enough not to nag, short enough that someone who taps "Not now" while
// browsing casually still gets a second chance next season.
const SNOOZE_DAYS = 30;

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

const isSnoozed = () => {
  const at = Number(read(DISMISS_KEY));
  if (!at) return false;
  return Date.now() - at < SNOOZE_DAYS * 864e5;
};

const isInstalled = () => {
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      window.matchMedia?.("(display-mode: minimal-ui)").matches === true ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://")
    );
  } catch { return false; }
};

/**
 * iOS never fires `beforeinstallprompt`, so it needs the manual Share sheet
 * route instead. iPadOS 13+ reports itself as a Mac, hence the touch check.
 * In-app webviews (Facebook, Instagram, Line) have no Add to Home Screen at
 * all — showing them instructions would just be a dead end.
 */
const detectIOS = () => {
  try {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    if (!iOS) return false;
    return !/FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger/.test(ua);
  } catch { return false; }
};

// Clears the floating BottomNav (Layout reserves 88px for it) so the sheet's
// CTA is never buried under it. Pass "0px" on screens that have no bottom nav.
const NAV_CLEARANCE = "calc(4.75rem + max(0.75rem, env(safe-area-inset-bottom)))";

export default function InstallPrompt({ delay = 2500, offsetBottom = NAV_CLEARANCE, className = "" }) {
  const reduce = useReducedMotion();
  const [platform, setPlatform] = useState(null); // 'android' | 'ios'
  const [deferred, setDeferred] = useState(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const dismiss = useCallback(() => {
    write(DISMISS_KEY, String(Date.now()));
    close();
  }, [close]);

  useEffect(() => {
    if (isInstalled() || isSnoozed()) return undefined;

    let timer;
    const show = (ms) => { timer = window.setTimeout(() => setOpen(true), ms); };

    const onBeforeInstall = (e) => {
      e.preventDefault(); // stop Chrome's own mini-infobar; we drive the UI
      setDeferred(e);
      setPlatform("android");
      show(delay);
    };

    // Chrome usually fires the event before React mounts, so index.html stashes
    // it on window — pick that up rather than waiting for one that already fired.
    const stashed = window.__ichInstallEvent;
    if (stashed) {
      setDeferred(stashed);
      setPlatform("android");
      show(delay);
    } else if (detectIOS()) {
      setPlatform("ios");
      show(delay);
    }

    const onInstalled = () => {
      setInstalled(true);
      drop(DISMISS_KEY);
      window.setTimeout(() => setOpen(false), 2200);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [delay]);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        drop(DISMISS_KEY);
        window.setTimeout(() => setOpen(false), 2200);
      } else {
        dismiss();
      }
    } catch {
      close(); // the event is single-use; a failed prompt just closes the sheet
    } finally {
      // Chrome invalidates the event once prompted, so don't offer it twice.
      setDeferred(null);
      try { delete window.__ichInstallEvent; } catch { /* ignore */ }
    }
  }, [deferred, dismiss, close]);

  if (!platform) return null;

  const rise = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 28 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...rise}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          role="region"
          aria-label="Install Icon Holiday"
          className={`fixed inset-x-0 z-[90] px-3 pointer-events-none ${className}`}
          style={{ bottom: offsetBottom }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-[369px] glass-card rounded-[1.75rem] shadow-float p-4">
            {installed ? (
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 rounded-2xl bg-ich-gold/10 text-gold flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-bold text-ich-primary text-[15px]">Added to your home screen</p>
                  <p className="text-[13px] text-ich-neutral leading-snug">Open Icon Holiday any time, even offline.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl btn-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-ich-primary text-[15px] leading-tight">
                      Install Icon Holiday
                    </p>
                    <p className="text-[13px] text-ich-neutral leading-snug mt-0.5">
                      Full screen, instant launch, and your trips available offline.
                    </p>
                  </div>
                  <button
                    onClick={dismiss}
                    aria-label="Dismiss install prompt"
                    className="w-10 h-10 -mt-1 -mr-1 rounded-full flex items-center justify-center text-ich-neutral hover:bg-white/10 shrink-0 press-spring"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {platform === "ios" ? (
                  <ol className="mt-3.5 space-y-2">
                    <IosStep n="1" icon={Share}>
                      Tap <span className="font-semibold text-ich-primary">Share</span> in the Safari toolbar
                    </IosStep>
                    <IosStep n="2" icon={Plus}>
                      Choose <span className="font-semibold text-ich-primary">Add to Home Screen</span>
                    </IosStep>
                  </ol>
                ) : (
                  <button
                    onClick={install}
                    className="mt-3.5 w-full min-h-[44px] rounded-xl btn-primary text-sm font-semibold text-white flex items-center justify-center gap-2 press-spring"
                  >
                    <Download className="w-4 h-4" />
                    Install app
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IosStep({ n, icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="w-6 h-6 rounded-lg bg-ich-gold/10 text-gold text-[11px] font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <Icon className="w-4 h-4 text-gold shrink-0" strokeWidth={2} />
      <span className="text-[13px] text-ich-neutral leading-snug">{children}</span>
    </li>
  );
}
