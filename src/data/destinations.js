// Curated destinations for the discovery swipe deck.
// `fromPrice` is an indicative flight/package starting price in IDR.
// `gradient` + `emoji` are used as a graceful fallback if the image fails.
// `image` is the cover photo; `images` is the full gallery (cover first).

const U = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;
const gallery = (...ids) => ids.map(U);

export const DESTINATIONS = [
  { id: 'bali', name: 'Bali', country: 'Indonesia', tagline: 'Island Paradise', vibes: ['Beach', 'Relax', 'Culture'], fromPrice: 1500000, emoji: '🏝️', gradient: ['#0EA5E9', '#14B8A6'], image: U('1537996194471-e657df975ab4'), images: gallery('1537996194471-e657df975ab4', '1518548419970-58e3b4079ab2', '1604999333679-b86d54738315') },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', tagline: 'Ancient Beauty', vibes: ['Culture', 'Temples', 'Food'], fromPrice: 6500000, emoji: '⛩️', gradient: ['#9333EA', '#DB2777'], image: U('1493976040374-85c8e12f0c0e'), images: gallery('1493976040374-85c8e12f0c0e', '1528360983277-13d401cdc186', '1545569341-9eb8b30979d9') },
  { id: 'santorini', name: 'Santorini', country: 'Greece', tagline: 'Aegean Charm', vibes: ['Romance', 'Views', 'Beach'], fromPrice: 9500000, emoji: '🌅', gradient: ['#2563EB', '#06B6D4'], image: U('1613395877344-13d4a8e0d49e'), images: gallery('1613395877344-13d4a8e0d49e', '1570077188670-e3a8d69ac5ff', '1601581875309-fafbf2d3ed3a') },
  { id: 'maldives', name: 'Maldives', country: 'Indian Ocean', tagline: 'Overwater Luxury', vibes: ['Luxury', 'Beach', 'Diving'], fromPrice: 8000000, emoji: '🐠', gradient: ['#0891B2', '#22D3EE'], image: U('1514282401047-d79a71a590e8'), images: gallery('1514282401047-d79a71a590e8', '1573843981267-be1999ff37cd', '1439066615861-d1af74d74000') },
  { id: 'paris', name: 'Paris', country: 'France', tagline: 'City of Light', vibes: ['Romance', 'Art', 'Food'], fromPrice: 11000000, emoji: '🗼', gradient: ['#6366F1', '#A855F7'], image: U('1502602898657-3e91760cbb34'), images: gallery('1502602898657-3e91760cbb34', '1431274172761-fca41d930114', '1549144511-f099e773c147') },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', tagline: 'Neon Metropolis', vibes: ['City', 'Food', 'Tech'], fromPrice: 6800000, emoji: '🏙️', gradient: ['#EC4899', '#8B5CF6'], image: U('1540959733332-eab4deabeeaf'), images: gallery('1540959733332-eab4deabeeaf', '1503899036084-c55cdd92da26', '1513407030348-c983a97b98d8') },
  { id: 'swiss-alps', name: 'Swiss Alps', country: 'Switzerland', tagline: 'Alpine Majesty', vibes: ['Mountains', 'Adventure', 'Scenic'], fromPrice: 12500000, emoji: '🏔️', gradient: ['#0EA5E9', '#6366F1'], image: U('1531366936337-7c912a4589a7'), images: gallery('1531366936337-7c912a4589a7', '1502786129293-79981df4e689', '1464822759023-fed622ff2c3b') },
  { id: 'dubai', name: 'Dubai', country: 'UAE', tagline: 'Desert Futurism', vibes: ['Luxury', 'City', 'Shopping'], fromPrice: 5500000, emoji: '🕌', gradient: ['#F59E0B', '#EF4444'], image: U('1512453979798-5ea266f8880c'), images: gallery('1512453979798-5ea266f8880c', '1546412414-e1885259563a', '1564507592333-c60657eea523') },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Iceland', tagline: 'Fire & Ice', vibes: ['Nature', 'Adventure', 'Aurora'], fromPrice: 13500000, emoji: '🌋', gradient: ['#14B8A6', '#3B82F6'], image: U('1504829857797-ddff29c27927'), images: gallery('1504829857797-ddff29c27927', '1476610182048-b716b8518aae', '1531168556467-80aace0d0144') },
  { id: 'queenstown', name: 'Queenstown', country: 'New Zealand', tagline: 'Adventure Capital', vibes: ['Adventure', 'Mountains', 'Lakes'], fromPrice: 10500000, emoji: '🏞️', gradient: ['#059669', '#0EA5E9'], image: U('1589802829985-817e51171b92'), images: gallery('1589802829985-817e51171b92', '1469521669194-babb45599def', '1507699622108-4be3abd695ad') },
  { id: 'marrakech', name: 'Marrakech', country: 'Morocco', tagline: 'Spice & Souks', vibes: ['Culture', 'Markets', 'Desert'], fromPrice: 9800000, emoji: '🐪', gradient: ['#F59E0B', '#D97706'], image: U('1597212618440-806262de4f6b'), images: gallery('1597212618440-806262de4f6b', '1539020140153-e479b8c22e70', '1531761535209-180857e963b9') },
  { id: 'phuket', name: 'Phuket', country: 'Thailand', tagline: 'Tropical Buzz', vibes: ['Beach', 'Nightlife', 'Islands'], fromPrice: 2800000, emoji: '🛶', gradient: ['#10B981', '#06B6D4'], image: U('1589394815804-964ed0be2eb5'), images: gallery('1589394815804-964ed0be2eb5', '1552465011-b4e21bf6e79a', '1528181304800-259b08848526') },
];

export const getDestinationById = (id) => DESTINATIONS.find((d) => d.id === id);
