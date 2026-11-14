import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { horizonSvg, PHASES, phaseAt } from './horizon'
import type { Phase } from './horizon'
import { theme } from './palette'

const SCENE = 'horizon'

// How often to look at the clock for a change of phase.
const CHECK_MS = 10 * 60 * 1000

// A pinned phase, or undefined to follow the clock. A reload starts on the clock.
let pinned: Phase | undefined
let shown: Phase | undefined

const phaseNow = (): Phase => pinned ?? phaseAt(new Date().getHours())

const look = (): ThemeSetArgs => ({
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 18, tint: '#121418', opacity: 0.55 } },
  overrideColorScheme: 'dark',
})

const apply = async ($: EngineInterface) => {
  const set = await $.theme.set(look())
  if (!set.isDrawn) $.ui.status(`horizon: ${set.reason}`)
  return set
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'horizon',
      description: 'Show the horizon backdrop. Add dawn, day, dusk or night to pin a time of day, or auto to follow the clock',
    })
    await $.command.register({ name: 'horizon-off', description: 'Take the horizon backdrop and colors off' })

    await apply($)
    // Redraw only when the time of day moves on to a new phase.
    $.clock.every(CHECK_MS, () => {
      if (phaseNow() !== shown) $.ui.invalidate('ui.render')
    })

    return next(e)
  })

  on('command.run', { command: 'horizon' }, async ($, e) => {
    const word = e.args.trim().toLowerCase()

    if (word === 'auto' || word === '') {
      pinned = undefined
    } else if ((PHASES as readonly string[]).includes(word)) {
      pinned = word as Phase
    } else {
      return { text: `Unknown time of day "${word}". Use dawn, day, dusk, night or auto.` }
    }
    const set = await apply($)
    $.ui.invalidate('ui.render')
    const hour = new Date().getHours()
    const mode = pinned ? `pinned to ${pinned}` : `following the clock (hour ${hour}: ${phaseAt(hour)})`

    return { text: set.isDrawn ? `Horizon on, ${mode}.` : `Horizon not drawn: ${set.reason}` }
  })

  on('command.run', { command: 'horizon-off' }, async $ => {
    await $.theme.clear()

    return { text: 'Horizon off. Run /horizon to bring it back.' }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.scene !== SCENE) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    shown = phaseNow()

    return <Svg source={horizonSvg(shown)} alt={`A planet's limb at ${shown}, seen through a fine screen of colored dots`} isInteractive />
  })
}
