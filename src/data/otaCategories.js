import { Plane, Building2, Train, Bus, Ship, Car, Ticket, MapPin, Compass, Camera, Utensils, Tent, Bike, Sparkles } from "lucide-react";

// Booking-category catalogue shared by the mobile OTA search and the dashboard
// OTA Categories manager. `behavior` decides how the mobile app searches/books
// (one of the seven built-in flows); `icon` is stored as a string name and
// resolved via CATEGORY_ICONS so categories are fully data-driven.

export const CATEGORY_ICONS = {
  Plane, Building2, Train, Bus, Ship, Car, Ticket, MapPin, Compass, Camera, Utensils, Tent, Bike, Sparkles,
};

// Pickable icons (for the dashboard category form).
export const ICON_OPTIONS = Object.keys(CATEGORY_ICONS).map((k) => ({ value: k, label: k, icon: CATEGORY_ICONS[k] }));

// The mobile search/book flows that exist. New categories map onto one of these.
export const BEHAVIORS = [
  { value: "flight", label: "Flight (origin → destination)" },
  { value: "hotel", label: "Hotel (stay dates)" },
  { value: "train", label: "Train (origin → destination)" },
  { value: "bus", label: "Bus (origin → destination)" },
  { value: "ship", label: "Ferry / Cruise (origin → destination)" },
  { value: "car_rental", label: "Car rental (pickup dates)" },
  { value: "attraction", label: "Attraction / Activity (destination)" },
];

export const DEFAULT_OTA_CATEGORIES = [
  { key: "flight", label: "Flight", icon: "Plane", behavior: "flight", active: true, order: 1 },
  { key: "hotel", label: "Hotel", icon: "Building2", behavior: "hotel", active: true, order: 2 },
  { key: "train", label: "Train", icon: "Train", behavior: "train", active: true, order: 3 },
  { key: "bus", label: "Bus", icon: "Bus", behavior: "bus", active: true, order: 4 },
  { key: "ship", label: "Ship", icon: "Ship", behavior: "ship", active: true, order: 5 },
  { key: "car_rental", label: "Rental", icon: "Car", behavior: "car_rental", active: true, order: 6 },
  { key: "attraction", label: "Attraction", icon: "Ticket", behavior: "attraction", active: true, order: 7 },
];

export const iconFor = (name) => CATEGORY_ICONS[name] || Ticket;
