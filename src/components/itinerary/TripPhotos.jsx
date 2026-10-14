import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, ImageOff, Star } from "lucide-react";
import { backend } from "@/api/backend";
import { getFile } from "@/api/files";
import GlassCard from "../GlassCard";

/** Featured photos first, newest first within each group. */
export const sortPhotos = (list) =>
  [...list].sort((a, b) => b.featured - a.featured || b.created_at.localeCompare(a.created_at));

/**
 * The address to show a trip photo. Seeded photos carry a `url`; uploads keep
 * their bytes in IndexedDB, so they get an object URL that is revoked when the
 * photo leaves the screen. Null means the file isn't on this device.
 */
export function usePhotoSrc(photo) {
  const [src, setSrc] = useState(photo.url || null);
  useEffect(() => {
    if (!photo.file_id) { setSrc(photo.url || null); return undefined; }
    let live = true;
    let url = null;
    setSrc(null);
    getFile(photo.file_id)
      .then((blob) => { if (live && blob) setSrc((url = URL.createObjectURL(blob))); })
      .catch(() => {});
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [photo.file_id, photo.url]);
  return src;
}

export function PhotoTile({ photo, onOpen, className = "" }) {
  const src = usePhotoSrc(photo);
  const label = `${photo.caption || "Photo"} by ${photo.uploader_name}${photo.featured ? ", featured" : ""}`;
  const body = (
    <>
      {src
        ? <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        : <ImageOff className="m-auto size-5 text-muted" aria-hidden="true" />}
      {photo.featured && (
        <span className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-accent-strong text-white shadow-card">
          <Star className="size-3.5 fill-current" aria-hidden="true" />
        </span>
      )}
    </>
  );
  const cls = `relative flex overflow-hidden rounded-xl bg-surface ${className}`;
  return onOpen ? (
    <button type="button" onClick={() => onOpen(photo)} aria-label={label} className={`${cls} transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-[0.98]`}>
      {body}
    </button>
  ) : (
    <span role="img" aria-label={label} className={cls}>{body}</span>
  );
}

/** The trip page's preview of the group album: count, four photos and a link in. */
export default function TripPhotosCard({ tripId }) {
  const [photos, setPhotos] = useState(null);
  useEffect(() => {
    backend.entities.TripPhoto.filter({ trip_id: tripId }).then((p) => setPhotos(sortPhotos(p))).catch(() => setPhotos([]));
  }, [tripId]);
  if (!photos) return null;

  const to = `/itinerary/${tripId}/photos`;
  const featured = photos.filter((p) => p.featured).length;
  return (
    <div className="px-6 mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Group photos ({photos.length})</h2>
        <Link to={to} className="flex items-center gap-1 text-xs text-accent-strong">
          <Camera className="w-4 h-4" /> {photos.length ? "See all" : "Upload"}
        </Link>
      </div>
      <GlassCard className="p-3">
        {photos.length ? (
          <Link to={to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
            <div className="grid grid-cols-4 gap-1.5">
              {photos.slice(0, 4).map((p) => <PhotoTile key={p.id} photo={p} className="aspect-square" />)}
            </div>
            <p className="mt-2.5 px-1 text-xs text-muted">
              {featured ? `${featured} featured · ` : ""}Shared by everyone on this trip. Tap to open the album.
            </p>
          </Link>
        ) : (
          <Link to={to} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted hover:bg-surface">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong"><Camera className="size-5" /></span>
            No photos yet. Upload the first one and the whole group sees it.
          </Link>
        )}
      </GlassCard>
    </div>
  );
}
