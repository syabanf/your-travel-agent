import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

const sections = [
  {
    title: "Booking & payments",
    body: "When you book through MORA, you agree to pay the price shown at checkout, including any applicable taxes and fees. Bookings are confirmed once payment is completed and you receive a confirmation in the app.",
  },
  {
    title: "Cancellations & refunds",
    body: "Cancellation terms vary by provider and are shown before you confirm a booking. Eligible refunds are processed to your original payment method. Some fares and rates are non-refundable.",
  },
  {
    title: "Traveler responsibilities",
    body: "You are responsible for providing accurate traveler details and for meeting all travel requirements, including valid documents, visas, and health rules for your destination.",
  },
  {
    title: "Liability",
    body: "MORA acts as a platform connecting you with travel providers. We are not liable for the acts, errors, or omissions of third-party providers, or for events beyond our reasonable control.",
  },
  {
    title: "Changes to these terms",
    body: "We may update these terms from time to time. Continued use of MORA after changes take effect means you accept the revised terms.",
  },
  {
    title: "Contact",
    body: "Questions about these terms? Reach our team at support@mora.travel and we'll be happy to help.",
  },
];

export default function Terms() {
  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Terms of Service" subtitle="The rules of using MORA" showBack />
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
