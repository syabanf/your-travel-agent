import { useEffect, useState } from "react";
import { backend } from "@/api/backend";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import { Save, Loader2, Building2, LifeBuoy, Share2, ToggleRight, Lock } from "lucide-react";
import SearchableSelect from "@/dashboard/SearchableSelect";

const DEFAULTS = {
  id: "app",
  brand_name: "",
  tagline: "",
  support_email: "",
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

const FLAGS = [
  { key: "flag_promotions", label: "Promotions & Events", help: "Show the promotions and events section across the site." },
  { key: "flag_ai_assistant", label: "AI Assistant", help: "Enable the AI travel assistant for visitors." },
  { key: "flag_consultations", label: "Human consultations", help: "Allow customers to book a consultation with a human agent." },
  { key: "flag_ota", label: "OTA booking", help: "Enable online travel agency (OTA) booking flows." },
];

export default function DashboardSettings() {
  const { role } = useRole();
  const canEdit = can(role, "settings", "edit");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    backend.entities.Setting.filter({ id: "app" }).then((r) => setForm(r[0] || DEFAULTS));
  }, []);

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.id;
      await backend.entities.Setting.update("app", payload).catch(async () => {
        await backend.entities.Setting.create({ id: "app", ...payload });
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Couldn't save settings");
    } finally {
      setSaving(false);
    }
  };

  if (form == null) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ich-primary">Settings</h1>
        <p className="text-sm text-ich-neutral mt-0.5">App-wide brand, support, social & feature flags.</p>
      </header>

      {!canEdit && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-ich-primary/10 bg-ich-primary/5 px-4 py-3 text-sm text-ich-neutral">
          <Lock className="w-4 h-4 shrink-0 text-ich-neutral/70" />
          You have read-only access to settings.
        </div>
      )}

      <div className="space-y-6">
        {/* Brand */}
        <Section icon={Building2} title="Brand">
          <Row2>
            <FieldD label="Brand name"><input value={form.brand_name || ""} onChange={(e) => upd("brand_name", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="Icon Holiday Travel" /></FieldD>
            <FieldD label="Tagline"><input value={form.tagline || ""} onChange={(e) => upd("tagline", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="Journeys, curated." /></FieldD>
          </Row2>
          <Row2>
            <FieldD label="Hero title"><input value={form.hero_title || ""} onChange={(e) => upd("hero_title", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="Discover your next escape" /></FieldD>
            <FieldD label="Hero subtitle"><input value={form.hero_subtitle || ""} onChange={(e) => upd("hero_subtitle", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="Handpicked destinations & deals" /></FieldD>
          </Row2>
        </Section>

        {/* Support */}
        <Section icon={LifeBuoy} title="Support">
          <Row2>
            <FieldD label="Support email"><input type="email" value={form.support_email || ""} onChange={(e) => upd("support_email", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="help@example.com" /></FieldD>
            <FieldD label="Support phone"><input value={form.support_phone || ""} onChange={(e) => upd("support_phone", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="+62…" /></FieldD>
          </Row2>
          <FieldD label="Support WhatsApp"><input value={form.support_whatsapp || ""} onChange={(e) => upd("support_whatsapp", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="+62…" /></FieldD>
        </Section>

        {/* Social & currency */}
        <Section icon={Share2} title="Social & currency">
          <Row2>
            <FieldD label="Instagram"><input value={form.instagram || ""} onChange={(e) => upd("instagram", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="@iconholiday" /></FieldD>
            <FieldD label="Facebook"><input value={form.facebook || ""} onChange={(e) => upd("facebook", e.target.value)} disabled={!canEdit} className="dash-input" placeholder="facebook.com/iconholiday" /></FieldD>
          </Row2>
          <FieldD label="Currency">
            <SearchableSelect
              value={form.currency || "IDR"}
              onChange={(v) => upd("currency", v)}
              disabled={!canEdit}
              options={[
                { value: "IDR", label: "IDR — Indonesian Rupiah" },
                { value: "USD", label: "USD — US Dollar" },
                { value: "EUR", label: "EUR — Euro" },
              ]}
              placeholder="IDR — Indonesian Rupiah"
              ariaLabel="Currency"
            />
          </FieldD>
        </Section>

        {/* Feature flags */}
        <Section icon={ToggleRight} title="Feature flags">
          <div className="space-y-3">
            {FLAGS.map((f) => (
              <label key={f.key} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form[f.key]}
                  onChange={(e) => upd(f.key, e.target.checked)}
                  disabled={!canEdit}
                  className="accent-[#AD1F23] w-4 h-4 mt-0.5 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ich-primary">{f.label}</span>
                  <span className="block text-xs text-ich-neutral">{f.help}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 mt-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 bg-white/80 backdrop-blur border-t border-ich-primary/10 flex justify-end">
        <button
          onClick={save}
          disabled={!canEdit || saving}
          className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings
        </button>
      </div>
    </div>
  );
}

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-ich-primary/10 p-6">
    <h2 className="flex items-center gap-2 font-display font-semibold text-ich-primary mb-4">
      <span className="w-8 h-8 rounded-lg bg-ich-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const Row2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
const FieldD = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-ich-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
