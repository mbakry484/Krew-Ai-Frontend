import { CapitalColor } from '@/lib/ivy/types';

// Metallic card gradients — same material language as the pricing membership
// cards. `darkText` flips the on-card text to dark (only the light "silver"
// finish needs it). Consumed by the Visa-style capital cards + color picker.
export const CARD_THEME: Record<CapitalColor, { label: string; gradient: string; darkText?: boolean }> = {
  teal: {
    label: 'Teal',
    gradient: 'radial-gradient(circle at 20% 15%, #5fe3d0 0%, #23b0a0 38%, #12756c 75%, #06322f 100%)',
  },
  obsidian: {
    label: 'Obsidian',
    gradient: 'radial-gradient(circle at 22% 15%, #3a3a3d 0%, #1d1d1f 40%, #0a0a0b 85%, #000 100%)',
  },
  silver: {
    label: 'Silver',
    gradient: 'radial-gradient(circle at 20% 15%, #f4f6f7 0%, #c7cdd1 38%, #8f979e 75%, #5a6166 100%)',
    darkText: true,
  },
  copper: {
    label: 'Copper',
    gradient: 'radial-gradient(circle at 20% 15%, #d6926a 0%, #a46a44 35%, #6e4128 75%, #3a2414 100%)',
  },
  indigo: {
    label: 'Indigo',
    gradient: 'radial-gradient(circle at 20% 15%, #9aa0f2 0%, #5b63d6 38%, #333a94 75%, #171a44 100%)',
  },
  rose: {
    label: 'Rose',
    gradient: 'radial-gradient(circle at 20% 15%, #f2a7c4 0%, #d65b8a 38%, #92364f 75%, #431925 100%)',
  },
};
