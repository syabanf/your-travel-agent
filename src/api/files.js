/**
 * Uploaded files for the mock backend. Rows keep only metadata
 * ({ id, name, size, type, ... }); the bytes live in IndexedDB, which holds far
 * more than localStorage and stores Blobs as they are.
 */

const DB = "ich_files";
const STORE = "files";
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_FILES = "image/jpeg,image/png,image/webp,image/heic,application/pdf";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// A refusal carries a message fit to show the member as is.
const refuse = (message) => Object.assign(new Error(message), { refused: true });

/** Stores a File and returns its metadata. Throws `refused` errors for the wrong type or size. */
export async function saveFile(file) {
  if (!ACCEPTED_FILES.split(",").includes(file.type) && !/\.(jpe?g|png|webp|heic|pdf)$/i.test(file.name)) throw refuse(`${file.name} isn't a photo or PDF.`);
  if (file.size > MAX_FILE_BYTES) throw refuse(`${file.name} is over 8 MB.`);
  const id = `file_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await run("readwrite", (s) => s.put(file, id));
  return { id, name: file.name, size: file.size, type: file.type, uploaded_at: new Date().toISOString() };
}

/**
 * Opens a stored file in a new tab. The tab opens before the read so popup
 * blockers still see the click. Returns false when the file is gone.
 */
export async function openFile(id) {
  const tab = window.open("", "_blank");
  const blob = await run("readonly", (s) => s.get(id));
  if (!blob) { tab?.close(); return false; }
  const url = URL.createObjectURL(blob);
  if (tab) tab.location.href = url;
  else window.location.assign(url);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

export const deleteFile = (id) => run("readwrite", (s) => s.delete(id));

export const fileSize = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
