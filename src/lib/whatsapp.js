// WhatsApp click-to-chat — opens WhatsApp (app or web) with a prefilled message.
// No backend needed: uses the public wa.me deep link.

export function waLink(phone, message) {
  const num = String(phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message || "");
  return num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function openWhatsApp(phone, message) {
  window.open(waLink(phone, message), "_blank", "noopener,noreferrer");
}
