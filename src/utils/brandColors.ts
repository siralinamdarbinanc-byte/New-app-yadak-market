export interface BrandColorStyle {
  bg: string;
  border: string;
  text: string;
  icon: string;
  glow: string;
}

// Pre-defined signature brand color mappings for top automotive manufacturers
const KNOWN_BRANDS: Record<string, BrandColorStyle> = {
  'ایساکو': {
    bg: 'bg-cyan-950/90 hover:bg-cyan-900/90',
    border: 'border-cyan-600/70',
    text: 'text-cyan-200',
    icon: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
  'سایپا': {
    bg: 'bg-amber-950/90 hover:bg-amber-900/90',
    border: 'border-amber-600/70',
    text: 'text-amber-200',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  'سایپا یدک': {
    bg: 'bg-amber-950/90 hover:bg-amber-900/90',
    border: 'border-amber-600/70',
    text: 'text-amber-200',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  'عظام': {
    bg: 'bg-rose-950/90 hover:bg-rose-900/90',
    border: 'border-rose-600/70',
    text: 'text-rose-200',
    icon: 'text-rose-400',
    glow: 'shadow-rose-500/20',
  },
  'دیناپارت': {
    bg: 'bg-yellow-950/90 hover:bg-yellow-900/90',
    border: 'border-yellow-600/70',
    text: 'text-yellow-200',
    icon: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
  },
  'کروز': {
    bg: 'bg-purple-950/90 hover:bg-purple-900/90',
    border: 'border-purple-600/70',
    text: 'text-purple-200',
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  'جی آی اس پی': {
    bg: 'bg-emerald-950/90 hover:bg-emerald-900/90',
    border: 'border-emerald-600/70',
    text: 'text-emerald-200',
    icon: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  'امیرنیا': {
    bg: 'bg-teal-950/90 hover:bg-teal-900/90',
    border: 'border-teal-600/70',
    text: 'text-teal-200',
    icon: 'text-teal-400',
    glow: 'shadow-teal-500/20',
  },
  'رینوس': {
    bg: 'bg-blue-950/90 hover:bg-blue-900/90',
    border: 'border-blue-600/70',
    text: 'text-blue-200',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  'بوش': {
    bg: 'bg-red-950/90 hover:bg-red-900/90',
    border: 'border-red-600/70',
    text: 'text-red-200',
    icon: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  'تکستار': {
    bg: 'bg-orange-950/90 hover:bg-orange-900/90',
    border: 'border-orange-600/70',
    text: 'text-orange-200',
    icon: 'text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  'سرتوس': {
    bg: 'bg-fuchsia-950/90 hover:bg-fuchsia-900/90',
    border: 'border-fuchsia-600/70',
    text: 'text-fuchsia-200',
    icon: 'text-fuchsia-400',
    glow: 'shadow-fuchsia-500/20',
  },
  'والئو': {
    bg: 'bg-lime-950/90 hover:bg-lime-900/90',
    border: 'border-lime-600/70',
    text: 'text-lime-200',
    icon: 'text-lime-400',
    glow: 'shadow-lime-500/20',
  }
};

const PALETTES: BrandColorStyle[] = [
  { bg: 'bg-indigo-950/90 hover:bg-indigo-900/90', border: 'border-indigo-600/70', text: 'text-indigo-200', icon: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
  { bg: 'bg-emerald-950/90 hover:bg-emerald-900/90', border: 'border-emerald-600/70', text: 'text-emerald-200', icon: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  { bg: 'bg-sky-950/90 hover:bg-sky-900/90', border: 'border-sky-600/70', text: 'text-sky-200', icon: 'text-sky-400', glow: 'shadow-sky-500/20' },
  { bg: 'bg-fuchsia-950/90 hover:bg-fuchsia-900/90', border: 'border-fuchsia-600/70', text: 'text-fuchsia-200', icon: 'text-fuchsia-400', glow: 'shadow-fuchsia-500/20' },
  { bg: 'bg-amber-950/90 hover:bg-amber-900/90', border: 'border-amber-600/70', text: 'text-amber-200', icon: 'text-amber-400', glow: 'shadow-amber-500/20' },
  { bg: 'bg-teal-950/90 hover:bg-teal-900/90', border: 'border-teal-600/70', text: 'text-teal-200', icon: 'text-teal-400', glow: 'shadow-teal-500/20' },
  { bg: 'bg-rose-950/90 hover:bg-rose-900/90', border: 'border-rose-600/70', text: 'text-rose-200', icon: 'text-rose-400', glow: 'shadow-rose-500/20' },
  { bg: 'bg-violet-950/90 hover:bg-violet-900/90', border: 'border-violet-600/70', text: 'text-violet-200', icon: 'text-violet-400', glow: 'shadow-violet-500/20' },
  { bg: 'bg-cyan-950/90 hover:bg-cyan-900/90', border: 'border-cyan-600/70', text: 'text-cyan-200', icon: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
];

export function getBrandColorStyle(brandName?: string): BrandColorStyle {
  if (!brandName) {
    return PALETTES[0];
  }
  const trimmed = brandName.trim();

  // Check known brands
  for (const [key, style] of Object.entries(KNOWN_BRANDS)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return style;
    }
  }

  // Deterministic hashing for any custom brand
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}
