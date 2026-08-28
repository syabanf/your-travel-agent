import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import EmptyState from "@/components/EmptyState";
import { formatIDR } from "@/lib/currency";
import { categoryLabel, packageDiscount, packageTotal } from "@/data/packageCategories";
import { toast } from "sonner";
import moment from "moment";
import {
  MapPin, CalendarDays, Star, Check, X, Users, Minus, Plus,
  Package as PackageIcon, Sparkles, ArrowRight,
} from "lucide-react";

const Img = (props) => <img {...props} onError={(e) => { e.currentTarget.style.display = "none"; }} />;

const Section = ({ title, icon: Icon, children }) => (
  <GlassCard className="p-5">
    <h2 className="text-sm font-semibold text-ich-primary mb-3 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gold" />} {title}
    </h2>
    {children}
  </GlassCard>
);

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pkg, setPkg] = useState(undefined); // undefined = loading, null = not found
  const [pax, setPax] = useState(2);
  const [departure, setDeparture] = useState("");
  const [booking, setBooking] = useState(false);

  // The party size and departure the user arrived with — kept in a ref so the
  // load effect can honour them without re-fetching on every param change.
  const fromUrl = useRef({
    pax: Number(searchParams.get("pax")) || 0,
    departure: searchParams.get("departure") || "",
  });

  useEffect(() => {
    base44.entities.TourPackage.filter({ id })
      .then((r) => {
        const found = r[0] || null;
        setPkg(found);
        if (found) {
          const min = Math.max(1, Number(found.min_pax) || 1);
          const max = Math.max(min, Number(found.max_pax) || 12);
          const dates = found.departure_dates || [];
          setPax(fromUrl.current.pax ? Math.min(max, Math.max(min, fromUrl.current.pax)) : min);
          setDeparture(dates.includes(fromUrl.current.departure) ? fromUrl.current.departure : (dates[0] || ""));
        }
      })
      .catch(() => setPkg(null));
  }, [id]);

  if (pkg === undefined) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="" showBack />
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Not found" showBack />
        <EmptyState icon={PackageIcon} title="Package unavailable" hint="This holiday package is no longer on sale." />
      </div>
    );
  }

  const off = packageDiscount(pkg);
  const minPax = Math.max(1, Number(pkg.min_pax) || 1);
  const maxPax = Math.max(minPax, Number(pkg.max_pax) || 12);
  const total = packageTotal(pkg, pax);

  // Mirror the choices into the URL so coming back to this page restores them.
  const syncUrl = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set("pax", String(next.pax));
    if (next.departure) params.set("departure", next.departure);
    else params.delete("departure");
    setSearchParams(params, { replace: true });
  };

  const changePax = (value) => {
    const next = Math.min(maxPax, Math.max(minPax, value));
    setPax(next);
    syncUrl({ pax: next, departure });
  };

  const changeDeparture = (d) => {
    setDeparture(d);
    syncUrl({ pax, departure: d });
  };

  const book = async () => {
    if (booking) return;
    setBooking(true);
    try {
      const details = {
        type: "package",
        title: pkg.title,
        provider: "Icon Holiday",
        location: pkg.destination,
        check_in: departure ? new Date(departure).toISOString() : undefined,
        price: total,
        currency: "IDR",
        status: "pending",
        guests: pax,
        image_url: pkg.image,
        package_id: pkg.id,
        notes: `${pkg.duration_days}D/${pkg.duration_nights}N · ${categoryLabel(pkg.category)} · ${pax} traveller${pax > 1 ? "s" : ""}`,
      };

      // Re-use the draft this package may already have instead of piling up a
      // new pending booking every time Book is tapped.
      let pending = null;
      try {
        const drafts = await base44.entities.Booking.filter({ package_id: pkg.id, status: "pending" });
        pending = drafts?.[0] || null;
      } catch {
        /* couldn't look it up — fall through and create a fresh booking */
      }

      const record = pending
        ? await base44.entities.Booking.update(pending.id, details)
        : await base44.entities.Booking.create(details);

      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Package reserved — just a few details left");
      navigate(`/booking/${record.id}/checkout`);
    } catch {
      toast.error("Couldn't start this booking. Please try again.");
      setBooking(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 24 }}>
      {/* Hero */}
      <div className="relative h-60 bg-ich-primary">
        <Img src={pkg.image} alt={pkg.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute top-0 left-0 right-0"><PageHeader showBack title="" /></div>
        <div className="absolute top-3 right-4 flex gap-2">
          {pkg.featured && <span className="chip-glass">Featured</span>}
          {off != null && <span className="chip-glass !bg-ich-gold/90 !border-white/30">{off}% off</span>}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="chip-glass mb-2">{categoryLabel(pkg.category)}</span>
          <h1 className="text-2xl font-display font-bold text-white text-shadow-soft">{pkg.title}</h1>
          <p className="text-xs text-white/85 flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" />{pkg.destination}</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-gold" />{pkg.duration_days}D / {pkg.duration_nights}N</span>
            {pkg.rating > 0 && (
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{Number(pkg.rating).toFixed(1)} ({pkg.reviews_count})</span>
            )}
          </p>
        </div>
      </div>

      <div className="px-6 -mt-4 relative z-10 space-y-4">
        {/* Price + party size */}
        <GlassCard className="p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              {off != null && <p className="text-xs text-ich-neutral/50 line-through leading-none">{formatIDR(pkg.price_before)}</p>}
              <p className="stat-value text-2xl font-display font-bold text-gold">{formatIDR(pkg.price)}</p>
              <p className="text-[11px] text-ich-neutral/70">per person</p>
            </div>
            {pkg.slots_left > 0 && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${pkg.slots_left <= 5 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-700"}`}>
                {pkg.slots_left} seat{pkg.slots_left > 1 ? "s" : ""} left
              </span>
            )}
          </div>

          {/* Travellers */}
          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-ich-primary/10">
            <div className="flex items-center gap-2 text-sm text-ich-primary">
              <Users className="w-4 h-4 text-gold" /> Travellers
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => changePax(pax - 1)}
                disabled={pax <= minPax}
                aria-label="Fewer travellers"
                className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-ich-primary disabled:opacity-40 press-spring"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="stat-value w-6 text-center text-base font-display font-bold text-ich-primary">{pax}</span>
              <button
                onClick={() => changePax(pax + 1)}
                disabled={pax >= maxPax}
                aria-label="More travellers"
                className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-ich-primary disabled:opacity-40 press-spring"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-ich-neutral/60 mt-2">
            This package takes {minPax}–{maxPax} travellers.
          </p>
        </GlassCard>

        {/* Departure dates */}
        {pkg.departure_dates?.length > 0 && (
          <Section title="Choose a departure" icon={CalendarDays}>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
              {pkg.departure_dates.map((d) => (
                <button
                  key={d}
                  onClick={() => changeDeparture(d)}
                  className={`px-4 min-h-[44px] rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 press-spring transition-colors ${
                    departure === d ? "btn-primary text-white" : "glass-light text-ich-neutral"
                  }`}
                >
                  {moment(d).format("D MMM YYYY")}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* About */}
        {(pkg.summary || pkg.description) && (
          <Section title="About this package" icon={Sparkles}>
            <p className="text-sm text-ich-neutral leading-relaxed">{pkg.description || pkg.summary}</p>
          </Section>
        )}

        {/* Highlights */}
        {pkg.highlights?.length > 0 && (
          <Section title="Highlights" icon={Star}>
            <ul className="space-y-2">
              {pkg.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ich-neutral">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />{h}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Includes / excludes */}
        {(pkg.includes?.length > 0 || pkg.excludes?.length > 0) && (
          <Section title="What's included" icon={Check}>
            <ul className="space-y-2">
              {(pkg.includes || []).map((x, i) => (
                <li key={`i${i}`} className="flex items-start gap-2.5 text-sm text-ich-neutral">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{x}
                </li>
              ))}
              {(pkg.excludes || []).map((x, i) => (
                <li key={`e${i}`} className="flex items-start gap-2.5 text-sm text-ich-neutral/60">
                  <X className="w-4 h-4 text-ich-neutral/40 shrink-0 mt-0.5" />{x}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Itinerary */}
        {pkg.itinerary?.length > 0 && (
          <Section title="Day by day" icon={CalendarDays}>
            <ol className="space-y-3.5">
              {pkg.itinerary.map((d, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-8 h-8 rounded-xl bg-ich-gold/10 text-gold flex items-center justify-center text-xs font-display font-bold shrink-0">
                    {d.day ?? i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ich-primary">{d.title}</p>
                    {d.detail && <p className="text-xs text-ich-neutral/70 leading-relaxed mt-0.5">{d.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>

      {/* Sticky booking bar — sits just above the tab dock */}
      <div className="sticky bottom-[92px] z-20 px-6 mt-5">
        <div className="glass-nav shadow-float rounded-2xl p-3 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-ich-neutral/60 uppercase tracking-wider leading-none">Total · {pax} traveller{pax > 1 ? "s" : ""}</p>
            <p className="stat-value text-lg font-display font-bold text-gold leading-tight">{formatIDR(total)}</p>
          </div>
          <button
            onClick={book}
            disabled={booking}
            className="flex-1 min-h-[48px] btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 press-spring"
          >
            {booking ? "Starting…" : "Book this package"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
