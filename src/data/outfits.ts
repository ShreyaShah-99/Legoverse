import type { Outfit } from '../store/game'

export const OUTFITS: Record<Outfit, { name: string; hoodie: string; pack: string; pants: string }> = {
  teal: { name: 'Teal', hoodie: '#1f8a8a', pack: '#e4572e', pants: '#2b3a67' },
  violet: { name: 'Violet', hoodie: '#6d4bd1', pack: '#f6c445', pants: '#23283d' },
  sunset: { name: 'Sunset', hoodie: '#e4572e', pack: '#2b3a67', pants: '#2b2f3d' },
  ocean: { name: 'Ocean', hoodie: '#2f6fb5', pack: '#4ade80', pants: '#2a2f3d' },
}
