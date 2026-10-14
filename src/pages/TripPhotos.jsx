import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Camera, ImageOff, Loader2, Share2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { backend } from "@/api/backend";
import { deleteFile, getFile, saveFile } from "@/api/files";
import { currentEmail } from "@/lib/featureAccess";
import { confirmDialog } from "@/components/ConfirmDialog";
import { PickerSheet } from "@/components/picker";
import EmptyState from "@/components/EmptyState";
import PageHeader from "../components/PageHeader";
import { PhotoTile, sortPhotos, usePhotoSrc } from "../components/itinerary/TripPhotos";

const PHOTO_TYPES = "image/jpeg,image/png,image/webp,image/heic";
const { TripPhoto } = backend.entities;

/**
 * The trip group's shared album. Everyone on the trip uploads and sees the
 * same photos; the organizer stars the best ones, which lead the album and the
 * trip page. Uploaders and the organizer can delete a photo.
 */
export default function TripPhotos() {
  const { tripId } = useParams();
  const me = currentEmail();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const reload = async () => setPhotos(sortPhotos(await TripPhoto.filter({ trip_id: tripId })));
  useEffect(() => {
    Promise.all([
      backend.entities.Trip.filter({ id: tripId }).then((t) => setTrip(t[0] || null)),
      backend.entities.TripMember.filter({ trip_id: tripId }).then(setMembers),
      reload(),
    ]).catch(() => { setPhotos([]); toast.error("Couldn't load the album. Please try again."); });
  }, [tripId]);

  const self = members.find((m) => m.email === me);
  const isOrganizer = self?.role === "organizer";
  const featured = (photos || []).filter((p) => p.featured);
  const open = photos?.find((p) => p.id === openId);

  const upload = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    let added = 0;
    for (const f of files) {
      try {
        if (!PHOTO_TYPES.split(",").includes(f.type) && !/\.(jpe?g|png|webp|heic)$/i.test(f.name)) throw Object.assign(new Error(`${f.name} isn't a photo.`), { refused: true });
        const meta = await saveFile(f);
        await TripPhoto.create({ trip_id: tripId, file_id: meta.id, caption: "", uploader_name: self?.name || me, uploader_email: me, featured: false });
        added += 1;
      } catch (err) {
        toast.error(err.refused ? err.message : `Couldn't upload ${f.name}.`);
      }
    }
    setUploading(false);
    if (added) toast.success(`${added} photo${added > 1 ? "s" : ""} shared with the group`, { description: trip?.title });
    await reload();
  };

  const toggleFeatured = async (p) => {
    await TripPhoto.update(p.id, { featured: !p.featured });
    toast.success(p.featured ? "Removed from featured" : "Featured for the group", { description: p.caption || `Photo by ${p.uploader_name}` });
    await reload();
  };

  const remove = async (p) => {
    const ok = await confirmDialog({ title: "Delete this photo?", body: "It disappears for everyone on the trip.", confirmLabel: "Delete photo", destructive: true });
    if (!ok) return;
    await TripPhoto.delete(p.id);
    if (p.file_id) await deleteFile(p.file_id).catch(() => {});
    setOpenId(null);
    toast.success("Photo deleted", { description: p.caption || `Photo by ${p.uploader_name}` });
    await reload();
  };

  return (
    <div className="animate-fade-in pb-16">
      <PageHeader
        title="Group photos"
        subtitle={trip?.title}
        showBack
        rightAction={
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-10 items-center gap-1.5 rounded-full bg-accent-strong px-4 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload
          </button>
        }
      />
      <input ref={inputRef} type="file" accept={PHOTO_TYPES} multiple className="hidden" onChange={upload} aria-hidden="true" tabIndex={-1} />

      <div className="space-y-6 px-6">
        <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-body">
          Everyone on this trip sees what you upload.{" "}
          {isOrganizer ? "Tap a photo and star it to feature it at the top." : "The organizer stars the best ones to feature them."}
        </p>

        {photos === null && <div className="skeleton h-40" />}
        {photos?.length === 0 && (
          <EmptyState
            icon={Camera}
            title="No photos yet"
            hint="Share the first one from your phone. The whole group sees it here."
            action={<button type="button" onClick={() => inputRef.current?.click()} className="rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-accent-dark">Upload photos</button>}
          />
        )}

        {featured.length > 0 && (
          <section aria-labelledby="featuredTitle">
            <h2 id="featuredTitle" className="mb-3 text-base font-semibold text-foreground">Featured ({featured.length})</h2>
            <div className="no-scrollbar -mx-6 flex snap-x gap-3 overflow-x-auto px-6">
              {featured.map((p) => (
                <figure key={p.id} className="w-64 shrink-0 snap-start">
                  <PhotoTile photo={p} onOpen={() => setOpenId(p.id)} className="aspect-[4/3] w-full rounded-2xl" />
                  <figcaption className="mt-1.5 truncate text-xs text-muted">
                    <b className="font-semibold text-foreground">{p.caption || "Untitled"}</b> · {p.uploader_name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {photos?.length > 0 && (
          <section aria-labelledby="allTitle">
            <h2 id="allTitle" className="mb-3 text-base font-semibold text-foreground">All photos ({photos.length})</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((p) => <PhotoTile key={p.id} photo={p} onOpen={() => setOpenId(p.id)} className="aspect-square" />)}
            </div>
          </section>
        )}
      </div>

      <PickerSheet
        open={Boolean(open)}
        onOpenChange={(v) => !v && setOpenId(null)}
        title={open?.caption || "Photo"}
        hint={open && `${open.uploader_name} · ${moment(open.created_at).format("D MMM YYYY, HH:mm")}`}
      >
        {open && (
          <PhotoViewer
            photo={open}
            title={trip?.title}
            canFeature={isOrganizer}
            canDelete={isOrganizer || open.uploader_email === me}
            onFeature={toggleFeatured}
            onDelete={remove}
          />
        )}
      </PickerSheet>
    </div>
  );
}

function PhotoViewer({ photo, title, canFeature, canDelete, onFeature, onDelete }) {
  const src = usePhotoSrc(photo);

  // Shares the photo itself where the phone allows it, else a link or a download.
  const share = async () => {
    try {
      if (photo.file_id) {
        const blob = await getFile(photo.file_id);
        const file = new File([blob], `${photo.id}.${(blob.type.split("/")[1] || "jpg")}`, { type: blob.type });
        if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title });
        const a = Object.assign(document.createElement("a"), { href: src, download: file.name });
        a.click();
        return toast.success("Photo saved to your downloads");
      }
      if (navigator.share) return await navigator.share({ title, text: photo.caption, url: photo.url });
      await navigator.clipboard.writeText(photo.url);
      return toast.success("Photo link copied");
    } catch (err) {
      if (err?.name !== "AbortError") toast.error("Couldn't share this photo.");
    }
    return undefined;
  };

  const btn = "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors";
  return (
    <div className="space-y-4 px-5 pb-6">
      <div className="flex max-h-[55dvh] min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-surface">
        {src
          ? <img src={src} alt={photo.caption || `Photo by ${photo.uploader_name}`} className="max-h-[55dvh] w-full object-contain" />
          : <p className="flex items-center gap-2 p-6 text-sm text-muted"><ImageOff className="size-4" /> This photo isn't on this device.</p>}
      </div>
      <div className="flex gap-2">
        {canFeature && (
          <button type="button" onClick={() => onFeature(photo)} aria-pressed={photo.featured} className={`${btn} ${photo.featured ? "bg-accent-strong text-white shadow-glow hover:bg-accent-dark" : "bg-surface text-foreground hover:bg-border"}`}>
            <Star className={`size-4 ${photo.featured ? "fill-current" : ""}`} /> {photo.featured ? "Featured" : "Feature"}
          </button>
        )}
        <button type="button" onClick={share} disabled={!src} className={`${btn} bg-surface text-foreground hover:bg-border disabled:opacity-50`}>
          <Share2 className="size-4" /> Share
        </button>
        {canDelete && (
          <button type="button" onClick={() => onDelete(photo)} aria-label="Delete photo" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-accent-soft hover:text-accent-strong">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
