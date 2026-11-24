import * as THREE from 'three'

const cache = new Map<string, THREE.CanvasTexture>()

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** Greyscale brick-course pattern used as bump map to give walls a molded brick feel. */
export function brickBump(): THREE.CanvasTexture {
  const key = 'brickbump'
  const hit = cache.get(key)
  if (hit) return hit
  const c = canvas(128, 128)
  const g = c.getContext('2d')!
  g.fillStyle = '#555'
  g.fillRect(0, 0, 128, 128)
  const rows = 8
  const rh = 128 / rows
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? 16 : 0
    for (let x = -32; x < 160; x += 32) {
      g.fillStyle = '#ddd'
      g.fillRect(x + off + 1.5, r * rh + 1.5, 29, rh - 3)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.NoColorSpace
  cache.set(key, t)
  return t
}

/** Greyscale brick colour map: multiplies with the wall colour to show mortar lines and per-brick variation. */
export function brickColorMap(): THREE.CanvasTexture {
  const hit = cache.get('brickcolor')
  if (hit) return hit
  const c = canvas(256, 256)
  const g = c.getContext('2d')!
  g.fillStyle = '#9a9a9a' // mortar
  g.fillRect(0, 0, 256, 256)
  const rows = 8
  const rh = 256 / rows
  let seed = 3
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? 32 : 0
    for (let x = -64; x < 288; x += 64) {
      const v = 226 + Math.floor(rnd() * 29)
      g.fillStyle = `rgb(${v},${v},${v})`
      g.fillRect(x + off + 2, r * rh + 2, 60, rh - 4)
      g.fillStyle = 'rgba(255,255,255,0.35)' // lit top edge
      g.fillRect(x + off + 2, r * rh + 2, 60, 3)
      g.fillStyle = 'rgba(0,0,0,0.12)' // shaded bottom edge
      g.fillRect(x + off + 2, r * rh + rh - 6, 60, 4)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  cache.set('brickcolor', t)
  return t
}

/** Framed window with mullions and sill. `neon` gives a dark glass with a glowing edge. */
export function windowTexture(neon?: string): THREE.CanvasTexture {
  const key = `win:${neon ?? 'day'}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = canvas(128, 160)
  const g = c.getContext('2d')!
  const frame = neon ? '#0b0d14' : '#f6f3ea'
  // sill
  g.fillStyle = neon ? '#1c2438' : '#d8d2c2'
  g.fillRect(2, 140, 124, 16)
  // frame
  g.fillStyle = frame
  g.beginPath()
  g.roundRect(10, 6, 108, 136, 8)
  g.fill()
  // glass
  const grd = g.createLinearGradient(0, 16, 0, 132)
  if (neon) {
    grd.addColorStop(0, '#0b1020')
    grd.addColorStop(1, '#16213a')
  } else {
    grd.addColorStop(0, '#bfe3ff')
    grd.addColorStop(0.6, '#7fb9ee')
    grd.addColorStop(1, '#ffe6b0')
  }
  g.fillStyle = grd
  g.fillRect(20, 16, 88, 116)
  if (!neon) {
    g.fillStyle = 'rgba(255,255,255,0.35)'
    g.beginPath()
    g.moveTo(20, 16); g.lineTo(58, 16); g.lineTo(20, 70); g.closePath()
    g.fill()
  } else {
    g.strokeStyle = neon
    g.lineWidth = 4
    g.shadowColor = neon
    g.shadowBlur = 12
    g.strokeRect(22, 18, 84, 112)
    g.shadowBlur = 0
    g.fillStyle = neon
    g.globalAlpha = 0.28
    g.fillRect(24, 20, 80, 108)
    g.globalAlpha = 1
  }
  // mullions
  g.fillStyle = neon ? neon : frame
  g.fillRect(62, 16, 4, 116)
  g.fillRect(20, 70, 88, 4)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  cache.set(key, t)
  return t
}

export function radialShadow(): THREE.CanvasTexture {
  const hit = cache.get('shadow')
  if (hit) return hit
  const c = canvas(128, 128)
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  grd.addColorStop(0, 'rgba(0,0,0,0.55)')
  grd.addColorStop(0.6, 'rgba(0,0,0,0.25)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  cache.set('shadow', t)
  return t
}

export function signTexture(text: string, color = '#ffffff', bg = 'rgba(10,12,20,0.88)', accent = '#f6c445'): THREE.CanvasTexture {
  const key = `sign:${text}:${color}:${bg}:${accent}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = canvas(512, 128)
  const g = c.getContext('2d')!
  g.fillStyle = bg
  g.beginPath()
  g.roundRect(4, 4, 504, 120, 22)
  g.fill()
  g.strokeStyle = accent
  g.lineWidth = 5
  g.stroke()
  g.fillStyle = color
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let size = 54
  g.font = `700 ${size}px "Space Grotesk", Inter, Arial, sans-serif`
  while (g.measureText(text).width > 450 && size > 22) {
    size -= 3
    g.font = `700 ${size}px "Space Grotesk", Inter, Arial, sans-serif`
  }
  g.fillText(text, 256, 66)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  cache.set(key, t)
  return t
}

export function techTexture(label: string, color: string): THREE.CanvasTexture {
  const key = `tech:${label}:${color}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = canvas(256, 256)
  const g = c.getContext('2d')!
  g.fillStyle = color
  g.beginPath()
  g.roundRect(8, 8, 240, 240, 40)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.18)'
  g.beginPath()
  g.roundRect(8, 8, 240, 110, 40)
  g.fill()
  const dark = parseInt(color.slice(1), 16)
  const lum = ((dark >> 16) & 255) * 0.299 + ((dark >> 8) & 255) * 0.587 + (dark & 255) * 0.114
  g.fillStyle = lum > 150 ? '#10131c' : '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let size = 110
  g.font = `700 ${size}px "Space Grotesk", Arial, sans-serif`
  while (g.measureText(label).width > 190 && size > 30) {
    size -= 6
    g.font = `700 ${size}px "Space Grotesk", Arial, sans-serif`
  }
  g.fillText(label, 128, 134)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  cache.set(key, t)
  return t
}

/**
 * Face print for a 109 degree slice of the head cylinder (u = angle, v = height).
 * Eyes themselves are separate meshes so they can blink.
 */
export function faceTexture(): THREE.CanvasTexture {
  const hit = cache.get('face')
  if (hit) return hit
  const W = 512, H = 336
  const c = canvas(W, H)
  const g = c.getContext('2d')!
  const ink = '#3b1d12'
  g.lineCap = 'round'
  // blush
  for (const x of [74, W - 74]) {
    const grd = g.createRadialGradient(x, 190, 2, x, 190, 30)
    grd.addColorStop(0, 'rgba(255,120,120,0.5)')
    grd.addColorStop(1, 'rgba(255,120,120,0)')
    g.fillStyle = grd
    g.fillRect(x - 32, 156, 64, 64)
  }
  // eyebrows
  g.strokeStyle = '#4a2a18'
  g.lineWidth = 7
  for (const s of [-1, 1]) {
    const cx = W / 2 + s * 96
    g.beginPath()
    g.moveTo(cx - 30, 74)
    g.quadraticCurveTo(cx, 58, cx + 30, 72)
    g.stroke()
  }
  // lashes on the outer corners
  g.strokeStyle = '#1a1010'
  g.lineWidth = 4
  for (const s of [-1, 1]) {
    const cx = W / 2 + s * 96
    for (let i = 0; i < 3; i++) {
      g.beginPath()
      g.moveTo(cx + s * 26, 118 - i * 2)
      g.lineTo(cx + s * (42 + i * 3), 104 - i * 10)
      g.stroke()
    }
  }
  // smile
  g.strokeStyle = ink
  g.lineWidth = 8
  g.beginPath()
  g.arc(W / 2, 176, 66, 0.2 * Math.PI, 0.8 * Math.PI)
  g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  cache.set('face', t)
  return t
}

export function hoodiePrint(): THREE.CanvasTexture {
  const hit = cache.get('hoodie')
  if (hit) return hit
  const c = canvas(256, 256)
  const g = c.getContext('2d')!
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '700 96px "JetBrains Mono", ui-monospace, Consolas, monospace'
  g.shadowColor = 'rgba(125,255,235,0.9)'
  g.shadowBlur = 18
  g.fillStyle = '#eafffb'
  g.fillText('</>', 128, 120)
  g.shadowBlur = 0
  g.fillStyle = 'rgba(234,255,251,0.7)'
  g.fillRect(70, 186, 116, 6)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  cache.set('hoodie', t)
  return t
}

export function glowTexture(): THREE.CanvasTexture {
  const hit = cache.get('glow')
  if (hit) return hit
  const c = canvas(64, 64)
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.3, 'rgba(255,255,255,0.45)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  cache.set('glow', t)
  return t
}
