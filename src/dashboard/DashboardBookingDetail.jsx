import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ArrowLeft,
  Building2,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Hash,
  StickyNote,
  Trash2,
} from "lucide-react";

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-mora-gold/10 text-gold",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
};
const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

function Row({ icon: Icon, label, children }) {
  if (children == null || children === "") return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-mora-primary/5 last:border-0">
      <Icon className="w-4 h-4 text-mora-neutral/60 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-mora-neutral/70">{label}</div>
        <div className="text-sm text-mora-primary mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardBookingDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const rows = await base44.entities.Booking.filter({ id });
      if (active) {
        setB(rows[0] || null);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const backLink = (
    <Link to="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-mora-primary transition-colors">
      <ArrowLeft className="w-4 h-4" /> Back to bookings
    </Link>
  );

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!b) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-6">{backLink}</div>
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-10 text-center text-mora-neutral">
          Booking not found.
        </div>
      </div>
    );
  }

  const updateStatus = async (status) => {
    await base44.entities.Booking.update(id, { status });
    setB((prev) => ({ ...prev, status }));
    toast.success("Status updated");
  };

  const remove = async () => {
    await base44.entities.Booking.delete(id);
    toast.success("Booking deleted");
    navigate("/dashboard/bookings");
  };

  const canEdit = can(role, "bookings", "edit");
  const canDelete = can(role, "bookings", "delete");
  const dates =
    b.check_in
      ? `${moment(b.check_in).format("MMM D, YYYY")}${b.check_out ? ` → ${moment(b.check_out).format("MMM D, YYYY")}` : ""}`
      : "";

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">{backLink}</div>

      {b.image_url && (
        <img
          src={b.image_url}
          alt={b.title}
          className="w-full h-48 object-cover rounded-2xl mb-6"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}

      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-mora-primary">{b.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          {b.type && (
            <span className="text-[11px] px-2 py-0.5 rounded-full capitalize bg-mora-primary/10 text-mora-neutral">{b.type}</span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[b.status] || statusPill.pending}`}>{b.status}</span>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 mb-6">
        <Row icon={Building2} label="Provider">{b.provider}</Row>
        <Row icon={MapPin} label="Location">{b.location}</Row>
        <Row icon={CalendarDays} label="Dates">{dates}</Row>
        <Row icon={Users} label="Guests">{b.guests}</Row>
        <Row icon={Wallet} label="Price">
          {b.price != null ? <span className="font-semibold text-gold">{formatIDR(b.price)}</span> : null}
        </Row>
        <Row icon={Hash} label="Confirmation code">
          {b.confirmation_code ? <span className="font-mono">{b.confirmation_code}</span> : null}
        </Row>
        <Row icon={StickyNote} label="Notes">{b.notes}</Row>
      </div>

      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
        <h2 className="text-sm font-semibold text-mora-primary mb-4">Actions</h2>
        {!canEdit && !canDelete ? (
          <p className="text-sm text-mora-neutral/60">You have read-only access.</p>
        ) : (
          <div className="space-y-4">
            {canEdit && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-mora-neutral/70 mb-1.5">Status</label>
                <select
                  value={b.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="dash-input max-w-xs capitalize"
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {canDelete && (
              <button
                onClick={remove}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete booking
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
