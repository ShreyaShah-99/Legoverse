import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { islands, type IslandId } from '../world/layout'

export type Phase = 'loading' | 'intro' | 'world'
export type Hair = 'bob' | 'ponytail' | 'long'
export type Outfit = 'teal' | 'violet' | 'sunset' | 'ocean'
export type GameId = 'hunter' | 'debug' | 'build' | 'race'
export type PanelKind = 'info' | 'resume' | 'settings' | 'arcade' | 'nav' | null

const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface GameState {
  phase: Phase
  setPhase: (p: Phase) => void

  // settings (persisted)
  sound: boolean
  lowGfx: boolean
  reducedMotion: boolean
  force2D: boolean
  hair: Hair
  outfit: Outfit
  glasses: boolean
  setSetting: <K extends 'sound' | 'lowGfx' | 'reducedMotion' | 'force2D' | 'hair' | 'outfit' | 'glasses'>(k: K, v: GameState[K]) => void

  // progress (persisted)
  bricks: number[]
  collectBrick: (id: number) => void
  achievements: string[]
  unlock: (id: string) => void
  visited: IslandId[]
  visit: (id: IslandId) => void
  builtSites: string[]
  buildSite: (id: string) => void
  resetProgress: () => void

  // session
  location: IslandId
  setLocation: (l: IslandId) => void
  panel: PanelKind
  activeId: string | null // interactable being inspected
  activeGame: GameId | null
  openInfo: (id: string) => void
  openPanel: (p: Exclude<PanelKind, 'info' | null>) => void
  closePanel: () => void
  startGame: (g: GameId | null) => void
  nearby: string | null
  setNearby: (id: string | null) => void
  travel: IslandId | null
  travelTo: (id: IslandId) => void
  clearTravel: () => void
  toast: { id: number; text: string } | null
  showToast: (text: string) => void
}

let toastId = 0

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'loading',
      setPhase: (phase) => set({ phase }),

      sound: true,
      lowGfx: false,
      reducedMotion: !!prefersReduced,
      force2D: false,
      hair: 'ponytail',
      outfit: 'teal',
      glasses: false,
      setSetting: (k, v) => set({ [k]: v } as Partial<GameState>),

      bricks: [],
      collectBrick: (id) => {
        const s = get()
        if (s.bricks.includes(id)) return
        const bricks = [...s.bricks, id]
        set({ bricks })
        if (bricks.length >= 10) {
          get().unlock('golden-builder')
        } else {
          get().showToast(`Golden brick collected: ${bricks.length}/10`)
        }
      },
      achievements: [],
      unlock: (id) => {
        if (get().achievements.includes(id)) return
        set({ achievements: [...get().achievements, id] })
        get().showToast(`Achievement unlocked: ${id.replace(/-/g, ' ')}`)
      },
      visited: [],
      visit: (id) => {
        const s = get()
        if (s.visited.includes(id)) return
        const visited = [...s.visited, id]
        set({ visited })
        if (visited.length >= islands.length) get().unlock('explorer')
      },
      builtSites: [],
      buildSite: (id) => {
        if (!get().builtSites.includes(id)) set({ builtSites: [...get().builtSites, id] })
      },
      resetProgress: () => set({ bricks: [], achievements: [], visited: [], builtSites: [] }),

      location: 'story',
      setLocation: (location) => {
        if (get().location !== location) set({ location })
        get().visit(location)
      },
      panel: null,
      activeId: null,
      activeGame: null,
      openInfo: (id) => set({ panel: 'info', activeId: id }),
      openPanel: (panel) => set({ panel, activeId: null }),
      closePanel: () => set({ panel: null, activeId: null }),
      startGame: (activeGame) => set({ activeGame, panel: activeGame ? null : get().panel }),
      nearby: null,
      setNearby: (nearby) => {
        if (get().nearby !== nearby) set({ nearby })
      },
      travel: null,
      travelTo: (travel) => set({ travel, panel: null, activeId: null }),
      clearTravel: () => set({ travel: null }),
      toast: null,
      showToast: (text) => set({ toast: { id: ++toastId, text } }),
    }),
    {
      name: 'legoverse-v1',
      partialize: (s) => ({
        sound: s.sound,
        lowGfx: s.lowGfx,
        reducedMotion: s.reducedMotion,
        force2D: s.force2D,
        hair: s.hair,
        outfit: s.outfit,
        glasses: s.glasses,
        bricks: s.bricks,
        achievements: s.achievements,
        visited: s.visited,
        builtSites: s.builtSites,
      }),
    },
  ),
)

export function explorationProgress(visited: IslandId[], bricks: number[], achievements: string[]) {
  // 50% islands visited, 30% bricks, 20% achievements
  const a = visited.length / islands.length
  const b = bricks.length / 10
  const c = Math.min(achievements.length / 5, 1)
  return Math.round((a * 0.5 + b * 0.3 + c * 0.2) * 100)
}
