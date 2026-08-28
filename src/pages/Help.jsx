import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { HelpCircle, ChevronDown, Mail, Phone, MessageCircle, Shield, FileText } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import EmptyState from "@/components/EmptyState";
import Skeleton, { SkeletonText } from "@/components/Skeletons";
import { useAppSettings } from "@/lib/useAppSettings";
import { openWhatsApp } from "@/lib/whatsapp";

export default function Help() {
  const { settings } = useAppSettings();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Page.filter({ type: "faq" });
      const published = data
        .filter((p) => p.status === "published")
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFaqs(published);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Help & Support" showBack />

      <div className="px-6 space-y-3 mt-2">
        {/* FAQ accordion */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i} className="p-5">
                <Skeleton className="h-4 w-2/3 mb-3" />
                <SkeletonText lines={2} />
              </GlassCard>
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No help articles yet"
            hint="Check back soon — or reach our team below."
          />
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <GlassCard
                  key={faq.id}
                  className="p-0 overflow-hidden cursor-pointer"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <div className="flex items-center justify-between gap-3 p-5">
                    <h2 className="text-sm font-medium text-ich-primary">{faq.title}</h2>
                    <ChevronDown
                      className={`w-4 h-4 text-ich-neutral flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                  {isOpen && (
                    <p className="px-5 pb-5 -mt-1 text-sm text-ich-neutral/70 leading-relaxed">
                      {faq.body}
                    </p>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Contact support */}
        <GlassCard className="p-5 space-y-1">
          <p className="text-sm font-semibold text-ich-primary mb-2">Contact support</p>

          {settings.support_email && (
            <a
              href={`mailto:${settings.support_email}`}
              className="flex items-center gap-3 py-2.5 text-ich-neutral hover:text-ich-primary transition-colors"
            >
              <Mail className="w-5 h-5 text-gold/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ich-white">Email us</p>
                <p className="text-xs text-ich-neutral/50 truncate">{settings.support_email}</p>
              </div>
            </a>
          )}

          {settings.support_phone && (
            <a
              href={`tel:${settings.support_phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-3 py-2.5 text-ich-neutral hover:text-ich-primary transition-colors"
            >
              <Phone className="w-5 h-5 text-gold/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ich-white">Call us</p>
                <p className="text-xs text-ich-neutral/50 truncate">{settings.support_phone}</p>
              </div>
            </a>
          )}

          {settings.support_whatsapp && (
            <button
              onClick={() =>
                openWhatsApp(
                  settings.support_whatsapp,
                  `Hi ${settings.brand_name} support, I need some help with the app.`
                )
              }
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 glass-light rounded-xl text-sm font-medium text-gold hover:bg-white/10 transition-all"
            >
              <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
            </button>
          )}
        </GlassCard>

        {/* Legal */}
        <GlassCard className="p-5 space-y-1">
          <p className="text-sm font-semibold text-ich-primary mb-2">Legal</p>
          <Link
            to="/privacy"
            className="flex items-center gap-3 py-2.5 text-ich-neutral hover:text-ich-primary transition-colors"
          >
            <Shield className="w-5 h-5 text-gold/70 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-ich-white">Privacy Policy</span>
            <ChevronDown className="w-4 h-4 -rotate-90 text-ich-neutral/50" />
          </Link>
          <Link
            to="/terms"
            className="flex items-center gap-3 py-2.5 text-ich-neutral hover:text-ich-primary transition-colors"
          >
            <FileText className="w-5 h-5 text-gold/70 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-ich-white">Terms of Service</span>
            <ChevronDown className="w-4 h-4 -rotate-90 text-ich-neutral/50" />
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
