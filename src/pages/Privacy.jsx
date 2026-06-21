import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

const sections = [
  {
    title: "What we collect",
    body: "We collect the information you give us to plan and book travel — your name, contact details, trip preferences, saved destinations, and booking history. We may also record basic device and usage information to keep the app working smoothly.",
  },
  {
    title: "How we use it",
    body: "Your information is used to personalize recommendations, complete bookings, remember your preferences, and improve the MORA experience. We never sell your personal data to third parties.",
  },
  {
    title: "Data storage",
    body: "This demo stores all data locally in your browser — nothing is sent to a server. Clearing your browser data or using the in-app delete option will remove it permanently.",
  },
  {
    title: "Your rights",
    body: "You can access, export, or delete your data at any time from Privacy & Data in your profile. You may also adjust your consent preferences for marketing and personalized recommendations whenever you like.",
  },
  {
    title: "Contact",
    body: "Questions about your privacy? Reach our team at privacy@mora.travel and we'll be happy to help.",
  },
];

export default function Privacy() {
  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Privacy Policy" subtitle="How we handle your data" showBack />
      <div className="px-6 space-y-3 mt-2">
        <p className="text-xs text-mora-neutral/50 px-1">Last updated June 2026</p>
        {sections.map((s) => (
          <GlassCard key={s.title} className="p-5">
            <h2 className="text-sm font-semibold text-mora-primary mb-2">{s.title}</h2>
            <p className="text-sm text-mora-neutral/70 leading-relaxed">{s.body}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
