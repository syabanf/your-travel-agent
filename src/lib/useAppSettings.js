import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// App-wide settings (brand, support contacts, feature flags) sourced from the
// CMS `Setting` record (id 'app'). Falls back to sensible defaults so the UI
// never breaks if the record is missing.
const DEFAULTS = {
  brand_name: "MORA",
  tagline: "Your Travel Agent",
  support_email: "support@mora.app",
  support_phone: "",
  support_whatsapp: "",
  currency: "IDR",
  instagram: "",
  facebook: "",
  hero_title: "",
  hero_subtitle: "",
  flag_promotions: true,
  flag_ai_assistant: true,
  flag_consultations: true,
  flag_ota: true,
};

export function useAppSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.entities.Setting.filter({ id: "app" })
      .then((r) => { if (alive) { setSettings({ ...DEFAULTS, ...(r?.[0] || {}) }); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  return { settings, loaded };
}
