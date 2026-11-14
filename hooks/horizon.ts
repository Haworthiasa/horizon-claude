// A planet's limb seen through a fine screen of colored dots, lit for the
// time of day: a red dawn, a white-blue day, a violet dusk, and a dark night
// with an aurora over the rim. One SVG for the Desktop backdrop; slow CSS
// motion only, no script.

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
export const PHASES: readonly Phase[] = ['dawn', 'day', 'dusk', 'night']

/** The phase for a local hour, 0 to 23. */
export function phaseAt(hour: number): Phase {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

const W = 1600
const H = 1000

// The planet: a huge circle whose edge crosses the screen on a diagonal.
const PX = -578
const PY = 3024
const R = 3000
const OUTER = R + 1000

const PITCH = 4 // px between dots
const DOT = 1.45 // dot radius

// A stop: distance from the limb in px (negative is inside the planet), color.
type Stop = [number, string]

type Light = {
  limb: Stop[]
  sun?: { x: number; y: number; r: number; core: string; mid: string; edge: string }
  grain: number // opacity of the colored grain
  aurora: boolean
}

const LIGHT: Record<Phase, Light> = {
  dawn: {
    limb: [
      [-400, '#000000'], [-130, '#140302'], [-70, '#8a1605'], [-36, '#ff3410'], [-14, '#ff9a2a'],
      [-3, '#ffe2b0'], [3, '#ffffff'], [12, '#c4e8ff'], [40, '#62b0ff'], [110, '#2a6cc8'],
      [230, '#123a7a'], [380, '#081a38'], [560, '#020610'], [1000, '#000000'],
    ],
    sun: { x: 1450, y: 813, r: 620, core: '#fff0d0', mid: '#ff7a24', edge: '#d8300c' },
    grain: 0.6,
    aurora: false,
  },
  day: {
    limb: [
      [-400, '#000000'], [-120, '#06080c'], [-50, '#2a2420'], [-20, '#b08060'], [-6, '#ffe6c8'],
      [2, '#ffffff'], [16, '#e6f4ff'], [60, '#8ccaff'], [160, '#3f8ae6'], [320, '#1d55a8'],
      [520, '#0c2a5c'], [760, '#040c1c'], [1000, '#000000'],
    ],
    sun: { x: 1180, y: 600, r: 260, core: '#fffaf0', mid: '#ffe9c0', edge: '#3f8ae6' },
    grain: 0.45,
    aurora: false,
  },
  dusk: {
    limb: [
      [-400, '#000000'], [-140, '#100208'], [-80, '#5e0a1e'], [-40, '#d8203a'], [-16, '#ff6a3a'],
      [-4, '#ffc08a'], [3, '#ffe0d0'], [16, '#e0a0ff'], [50, '#9a5ae0'], [130, '#5a34b0'],
      [260, '#2c1c6a'], [420, '#120c30'], [600, '#04030c'], [1000, '#000000'],
    ],
    sun: { x: 1560, y: 930, r: 560, core: '#ffd0a0', mid: '#ff4a2a', edge: '#8a1030' },
    grain: 0.6,
    aurora: false,
  },
  night: {
    limb: [
      [-400, '#000000'], [-60, '#020306'], [-10, '#0c1428'], [0, '#2a4a80'], [8, '#1a3060'],
      [60, '#0a1630'], [200, '#040a18'], [400, '#010204'], [1000, '#000000'],
    ],
    grain: 0.5,
    aurora: true,
  },
}

const stopsOf = (limb: Stop[]) =>
  limb.map(([d, color]) => `<stop offset="${((R + d) / OUTER).toFixed(4)}" stop-color="${color}"/>`).join('')

// The aurora: a green-to-violet band above the rim, hung in curtains.
const AURORA: Stop[] = [
  [0, '#000000'], [14, '#0a3a2a'], [40, '#2bd88a'], [80, '#7cffc0'], [150, '#2aa07a'],
  [240, '#2c6a8a'], [330, '#3a2a8a'], [440, '#120a30'], [560, '#000000'], [1000, '#000000'],
]

function scene(phase: Phase): string {
  const light = LIGHT[phase]
  const sun = light.sun
  const style =
    (sun
      ? `.sun{mix-blend-mode:screen;transform-origin:${sun.x}px ${sun.y}px;animation:sun 18s ease-in-out infinite}` +
        `@keyframes sun{50%{transform:translate(-26px,-18px) scale(1.08);opacity:.85}}`
      : '') +
    `.air{transform-origin:${PX}px ${PY}px;animation:air 60s ease-in-out infinite}` +
    `@keyframes air{50%{transform:rotate(-.6deg)}}` +
    `.curtains{animation:curtains 40s ease-in-out infinite alternate}` +
    `@keyframes curtains{to{transform:translateX(-180px)}}` +
    `.aurora{mix-blend-mode:screen;animation:glow 12s ease-in-out infinite}` +
    `@keyframes glow{50%{opacity:.6}}` +
    `@media (prefers-reduced-motion:reduce){.sun,.air,.curtains,.aurora{animation:none}}`

  // The rim fades away from the light, so one end of the limb is quieter.
  const lx = sun?.x ?? 1450
  const ly = sun?.y ?? 813

  const defs =
    `<defs>` +
    // The screen of dots every color shows through.
    `<pattern id="dots" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse">` +
    `<circle cx="${PITCH / 2}" cy="${PITCH / 2}" r="${DOT}" fill="#fff"/></pattern>` +
    `<mask id="screen" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="url(#dots)"/></mask>` +
    `<radialGradient id="limb" gradientUnits="userSpaceOnUse" cx="${PX}" cy="${PY}" r="${OUTER}">${stopsOf(light.limb)}</radialGradient>` +
    (sun
      ? `<radialGradient id="glare" gradientUnits="userSpaceOnUse" cx="${sun.x}" cy="${sun.y}" r="${sun.r}">` +
        `<stop offset="0" stop-color="${sun.core}"/><stop offset=".14" stop-color="${sun.mid}" stop-opacity=".9"/>` +
        `<stop offset=".42" stop-color="${sun.edge}" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`
      : '') +
    `<linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="${lx}" y1="${ly}" x2="0" y2="0">` +
    `<stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#9a9a9a"/><stop offset="1" stop-color="#5a5a5a"/></linearGradient>` +
    `<mask id="falloff" maskUnits="userSpaceOnUse" x="-400" y="-400" width="${W + 800}" height="${H + 800}">` +
    `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#fade)"/></mask>` +
    (light.aurora
      ? `<radialGradient id="aurora" gradientUnits="userSpaceOnUse" cx="${PX}" cy="${PY}" r="${OUTER}">${stopsOf(AURORA)}</radialGradient>` +
        // Curtains: noise stretched along one axis, as light falling in folds.
        `<filter id="folds" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".022 .0007" numOctaves="3" seed="5"/>` +
        `<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -.55"/></filter>` +
        `<mask id="curtain" maskUnits="userSpaceOnUse" x="-400" y="-400" width="${W + 800}" height="${H + 800}">` +
        `<rect class="curtains" x="-400" y="-400" width="${W + 800}" height="${H + 800}" filter="url(#folds)"/></mask>`
      : '') +
    // Noise dither: each dot lights by chance, more often where it is bright.
    `<filter id="dither" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency=".42" numOctaves="2" seed="3" result="n"/>` +
    `<feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -.3" result="na"/>` +
    `<feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .55 .9 .45 0 0" result="lum"/>` +
    `<feComposite in="lum" in2="na" operator="arithmetic" k2="1" k3="1" k4="-.55" result="sum"/>` +
    `<feComponentTransfer in="sum" result="on"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>` +
    `<feColorMatrix in="SourceGraphic" values="1.5 0 0 0 0  0 1.5 0 0 0  0 0 1.5 0 0  0 0 0 1 0" result="vivid"/>` +
    `<feComposite in="vivid" in2="on" operator="in"/>` +
    `</filter>` +
    // Colored grain in the dark: sparse red, green and blue specks.
    `<filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="11"/>` +
    `<feColorMatrix values="3 0 0 0 -1.1  0 3 0 0 -1.1  0 0 3 0 -1.1  0 0 0 4 -2.3"/>` +
    `</filter>` +
    `</defs>`

  const air = `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#limb)"/>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<style>${style}</style>${defs}` +
    `<rect width="${W}" height="${H}" fill="#000"/>` +
    `<g mask="url(#screen)">` +
    // A dim continuous tone under the dither, so the air reads as one field.
    `<g class="air" mask="url(#falloff)" opacity=".22">${air}</g>` +
    `<g filter="url(#dither)">` +
    `<g class="air" mask="url(#falloff)">${air}</g>` +
    (light.aurora
      ? `<g class="aurora" mask="url(#curtain)"><rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#aurora)"/></g>`
      : '') +
    (sun ? `<ellipse class="sun" cx="${sun.x}" cy="${sun.y}" rx="${sun.r * 0.84}" ry="${sun.r * 0.68}" fill="url(#glare)"/>` : '') +
    `</g>` +
    `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="${light.grain}" style="mix-blend-mode:screen"/>` +
    `</g>` +
    `</svg>`
  )
}

const CACHE = new Map<Phase, string>()

/** The scene for a phase of the day. */
export function horizonSvg(phase: Phase): string {
  let svg = CACHE.get(phase)
  if (svg === undefined) {
    svg = scene(phase)
    CACHE.set(phase, svg)
  }
  return svg
}
