import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Gift, CalendarClock, Lock, UserRound, Phone, MessageCircle, FileText, Backpack,
  Hotel, Navigation, Users, Landmark, ChevronRight,
} from "lucide-react";
import moment from "moment";
import { daysUntil, isPrepOpen, isItineraryOpen, opensOn } from "@/data/membership";
import { waLink } from "@/lib/whatsapp";

/**
 * The member-facing information for a guided trip, opened in the stages the
 * Icon Membership spec sets: the overview always, pre-departure from H-2,
 * on-trip travel information from the day of departure.
 */
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "prep", label: "Pre-departure" },
  { id: "travel", label: "Travel info" },
];

function Locked({ trip, daysBefore, what }) {
  const date = opensOn(trip, daysBefore);
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 px-4 py-6 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-card text-muted shadow-card">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-foreground">{what} opens {daysBefore ? `on H-${daysBefore}` : "on departure day"}</p>
      {date && <p className="text-xs text-muted">{moment(date).format("dddd, D MMMM YYYY")}</p>}
    </div>
  );
}

const Row = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
      <Icon className="size-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="eyebrow">{label}</p>
      <div className="mt-0.5 text-sm text-foreground">{children}</div>
    </div>
  </div>
);

const PILL = "inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-border";

const MapButton = ({ href, label = "Open in Google Maps" }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`mt-2 ${PILL}`}
  >
    <Navigation className="size-3.5" aria-hidden="true" /> {label}
  </a>
);

function TourLeader({ leader }) {
  if (!leader) return null;
  return (
    <Row icon={UserRound} label="Tour Leader">
      <p className="font-semibold">{leader.name}</p>
      <p className="text-xs text-muted">{leader.phone}</p>
      <div className="mt-2 flex gap-2">
        <a href={`tel:${leader.phone.replace(/\s/g, "")}`} className={PILL}>
          <Phone className="size-3.5" aria-hidden="true" /> Call
        </a>
        <a
          href={waLink(leader.phone, `Hi ${leader.name}, this is a traveller on your Icon Holiday trip.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-success-soft px-3 text-xs font-semibold text-success transition-colors hover:bg-success/20"
        >
          <MessageCircle className="size-3.5" aria-hidden="true" /> WhatsApp
        </a>
      </div>
    </Row>
  );
}

export default function TripMemberInfo({ trip }) {
  const [tab, setTab] = useState(() => (isItineraryOpen(trip) ? "travel" : isPrepOpen(trip) ? "prep" : "overview"));
  if (!trip?.tour_leader) return null;

  const left = daysUntil(trip);

  return (
    <section className="mx-6 mt-6 rounded-card bg-card p-4 shadow-card" aria-label="Trip information">
      <div role="tablist" aria-label="Trip information" className="flex gap-1 rounded-full bg-surface p-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const locked = (t.id === "prep" && !isPrepOpen(trip)) || (t.id === "travel" && !isItineraryOpen(trip));
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative isolate flex h-9 flex-1 items-center justify-center gap-1 rounded-full text-xs font-semibold transition-colors ${active ? "text-white" : "text-muted hover:text-foreground"}`}
            >
              {active && (
                <motion.span layoutId="trip-info-tab" aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-accent-strong shadow-glow" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
              )}
              {locked && <Lock className="size-3" aria-hidden="true" />}
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} className="animate-rise mt-4 space-y-4">
        {tab === "overview" && (
          <>
            {left !== null && left > 0 && (
              <p className="flex items-center gap-2 rounded-2xl bg-info-soft px-3 py-2.5 text-sm font-semibold text-info">
                <CalendarClock className="size-4" aria-hidden="true" /> Departs in {left} day{left === 1 ? "" : "s"}
              </p>
            )}
            {trip.cities?.length > 0 && (
              <Row icon={MapPin} label={(trip.countries || []).join(" · ") || "Route"}>
                <ol className="mt-1 flex flex-wrap items-center gap-1">
                  {trip.cities.map((c, i) => (
                    <li key={c} className="flex items-center gap-1">
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-body">{c}</span>
                      {i < trip.cities.length - 1 && <ChevronRight className="size-3 text-silver" aria-hidden="true" />}
                    </li>
                  ))}
                </ol>
              </Row>
            )}
            {trip.benefits?.length > 0 && (
              <Row icon={Gift} label="Included">
                <ul className="mt-1 grid grid-cols-1 gap-1">
                  {trip.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-body">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />{b}
                    </li>
                  ))}
                </ul>
              </Row>
            )}
          </>
        )}

        {tab === "prep" && (isPrepOpen(trip) ? (
          <>
            <Row icon={CalendarClock} label="Meeting time">
              <p className="font-semibold">{moment(trip.meeting_at).format("dddd, D MMMM YYYY · HH:mm")}</p>
            </Row>
            <Row icon={MapPin} label="Meeting point">
              <p className="font-semibold">{trip.meeting_location}</p>
              {trip.meeting_map_url && <MapButton href={trip.meeting_map_url} />}
            </Row>
            <TourLeader leader={trip.tour_leader} />
            {trip.required_documents?.length > 0 && (
              <Row icon={FileText} label="Bring these documents">
                <ul className="mt-1 space-y-1">
                  {trip.required_documents.map((d) => <li key={d} className="text-sm text-body">• {d}</li>)}
                </ul>
                <Link to="/profile/documents" className="mt-2 inline-block text-xs font-semibold text-accent-strong hover:underline">See document status</Link>
              </Row>
            )}
            {trip.packing_list?.length > 0 && (
              <Row icon={Backpack} label="What to pack">
                <ul className="mt-1 space-y-1">
                  {trip.packing_list.map((d) => <li key={d} className="text-sm text-body">• {d}</li>)}
                </ul>
              </Row>
            )}
          </>
        ) : (
          <Locked trip={trip} daysBefore={2} what="Pre-departure information" />
        ))}

        {tab === "travel" && (isItineraryOpen(trip) ? (
          <>
            {(trip.hotels || []).map((h) => (
              <Row key={h.name} icon={Hotel} label={`Hotel${h.nights ? ` · ${h.nights}` : ""}`}>
                <p className="font-semibold">{h.name}</p>
                <p className="text-xs text-muted">{h.address}</p>
                {h.map_url && <MapButton href={h.map_url} />}
              </Row>
            ))}
            <TourLeader leader={trip.tour_leader} />
            {trip.whatsapp_group_url && (
              <Row icon={Users} label="Group chat">
                <p className="text-sm text-body">Updates from the Tour Leader during the trip.</p>
                <a
                  href={trip.whatsapp_group_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sheen mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-success px-4 text-xs font-semibold text-white transition-colors hover:bg-success/90"
                >
                  <MessageCircle className="size-4" aria-hidden="true" /> Join the WhatsApp group
                </a>
              </Row>
            )}
            {(trip.important_locations || []).map((l) => (
              <Row key={l.label} icon={Landmark} label="Important place">
                <p className="font-semibold">{l.label}</p>
                <p className="text-xs text-muted">{l.address}</p>
                {l.map_url && <MapButton href={l.map_url} label="Directions" />}
              </Row>
            ))}
          </>
        ) : (
          <Locked trip={trip} daysBefore={0} what="Travel information" />
        ))}
      </div>
    </section>
  );
}
