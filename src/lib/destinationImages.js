// Normalize a destination record into a gallery array (cover first).
// Older records may only have a single `image`; this keeps everything working.
export function destImages(d) {
  if (!d) return [];
  const arr = Array.isArray(d.images) ? d.images.filter(Boolean) : [];
  if (arr.length) return arr;
  return d.image ? [d.image] : [];
}

export const destCover = (d) => destImages(d)[0] || "";
