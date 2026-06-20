// Curated destinations for the discovery swipe deck.
// `fromPrice` is an indicative flight/package starting price in IDR.
// `gradient` + `emoji` are used as a graceful fallback if the image fails.

export const DESTINATIONS = [
  { id: 'bali', name: 'Bali', country: 'Indonesia', tagline: 'Island Paradise', vibes: ['Beach', 'Relax', 'Culture'], fromPrice: 1500000, emoji: '🏝️', gradient: ['#0EA5E9', '#14B8A6'], image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80' },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', tagline: 'Ancient Beauty', vibes: ['Culture', 'Temples', 'Food'], fromPrice: 6500000, emoji: '⛩️', gradient: ['#9333EA', '#DB2777'], image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80' },
  { id: 'santorini', name: 'Santorini', country: 'Greece', tagline: 'Aegean Charm', vibes: ['Romance', 'Views', 'Beach'], fromPrice: 9500000, emoji: '🌅', gradient: ['#2563EB', '#06B6D4'], image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80' },
  { id: 'maldives', name: 'Maldives', country: 'Indian Ocean', tagline: 'Overwater Luxury', vibes: ['Luxury', 'Beach', 'Diving'], fromPrice: 8000000, emoji: '🐠', gradient: ['#0891B2', '#22D3EE'], image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80' },
  { id: 'paris', name: 'Paris', country: 'France', tagline: 'City of Light', vibes: ['Romance', 'Art', 'Food'], fromPrice: 11000000, emoji: '🗼', gradient: ['#6366F1', '#A855F7'], image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', tagline: 'Neon Metropolis', vibes: ['City', 'Food', 'Tech'], fromPrice: 6800000, emoji: '🏙️', gradient: ['#EC4899', '#8B5CF6'], image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' },
  { id: 'swiss-alps', name: 'Swiss Alps', country: 'Switzerland', tagline: 'Alpine Majesty', vibes: ['Mountains', 'Adventure', 'Scenic'], fromPrice: 12500000, emoji: '🏔️', gradient: ['#0EA5E9', '#6366F1'], image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', tagline: 'Desert Futurism', vibes: ['Luxury', 'City', 'Shopping'], fromPrice: 5500000, emoji: '🕌', gradient: ['#F59E0B', '#EF4444'], image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80' },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Iceland', tagline: 'Fire & Ice', vibes: ['Nature', 'Adventure', 'Aurora'], fromPrice: 13500000, emoji: '🌋', gradient: ['#14B8A6', '#3B82F6'], image: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80' },
  { id: 'queenstown', name: 'Queenstown', country: 'New Zealand', tagline: 'Adventure Capital', vibes: ['Adventure', 'Mountains', 'Lakes'], fromPrice: 10500000, emoji: '🏞️', gradient: ['#059669', '#0EA5E9'], image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&q=80' },
  { id: 'marrakech', name: 'Marrakech', country: 'Morocco', tagline: 'Spice & Souks', vibes: ['Culture', 'Markets', 'Desert'], fromPrice: 9800000, emoji: '🐪', gradient: ['#F59E0B', '#D97706'], image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80' },
  { id: 'phuket', name: 'Phuket', country: 'Thailand', tagline: 'Tropical Buzz', vibes: ['Beach', 'Nightlife', 'Islands'], fromPrice: 2800000, emoji: '🛶', gradient: ['#10B981', '#06B6D4'], image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80' },
];

export const getDestinationById = (id) => DESTINATIONS.find((d) => d.id === id);
