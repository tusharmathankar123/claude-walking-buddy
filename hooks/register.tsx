import type { EngineInterface, Register } from 'claude-code'

const ORANGE = '#D97757'
const EYE = '#141413'
const U = 4 // one "pixel" of the critter, in CSS px
const W = 14 * U // 56
const H = 8 * U // 32
const HOP = 18 // hop height in px; the scene leaves this much headroom
const SCENE_H = H + HOP + 4

// The critter on a 14x8 grid: body, two arms, two eyes, four legs.
// Legs alternate between full and short to look like stepping.
function critter(stepMs: number, working: boolean): string {
  const r = (x: number, y: number, w: number, h: number, fill = ORANGE, extra = '') =>
    `<rect x="${x * U}" y="${y * U}" width="${w * U}" height="${h * U}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`
  const leg = (x: number, phase: 0 | 1) =>
    `<rect x="${x * U}" y="${5 * U}" width="${U}" height="${2 * U}" fill="${ORANGE}">` +
    `<animate attributeName="height" values="${phase ? `${U};${2 * U}` : `${2 * U};${U}`}" ` +
    `dur="${stepMs * 2}ms" calcMode="discrete" repeatCount="indefinite"/></rect>`
  const eye = (x: number) =>
    `<rect x="${x * U}" y="${1 * U}" width="${U}" height="${2 * U}" fill="${EYE}">` +
    `<animate attributeName="height" values="${2 * U};${2 * U};${U / 2};${2 * U}" keyTimes="0;0.94;0.97;1" ` +
    `dur="${working ? 2.5 : 4.5}s" repeatCount="indefinite"/></rect>`
  return (
    `<g>` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${U / 2};0 0" ` +
    `dur="${stepMs * 2}ms" repeatCount="indefinite"/>` +
    r(2, 0, 10, 5) +
    r(0, 2, 2, 2) +
    (working
      ? r(12, 2, 2, 2)
      : // The idle scene remounts when a reply finishes, so this one-shot
        // wave (right arm flapping up and down) plays once per reply.
        `<rect x="${12 * U}" y="${2 * U}" width="${2 * U}" height="${2 * U}" fill="${ORANGE}">` +
        `<animate attributeName="y" values="${[2, 0, -1, 0, -1, 0, -1, 2].map(v => v * U).join(';')}" ` +
        `dur="1.4s" begin="0.1s" calcMode="discrete" repeatCount="1" fill="freeze"/></rect>`) +
    eye(4) +
    eye(9) +
    `</g>` +
    leg(3, 0) +
    leg(5, 1) +
    leg(8, 0) +
    leg(10, 1)
  )
}

function scene(working: boolean): string {
  const walk = working ? 7 : 22 // seconds for a full lap there and back
  const step = working ? 110 : 220
  const thought = working
    ? `<g fill="${ORANGE}" opacity="0.8">` +
      [0, 1, 2]
        .map(
          i =>
            `<rect x="${W + 4 + i * 7}" y="2" width="4" height="4">` +
            `<animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" begin="${i * 0.2}s" repeatCount="indefinite"/></rect>`,
        )
        .join('') +
      `</g>`
    : ''
  // The scene remounts when a turn starts (you sent a message), so a one-shot
  // hop at begin=0 plays once per message: a big jump, then a small bounce.
  const hop = working
    ? `<animateTransform attributeName="transform" type="translate" ` +
      `values="0 0;0 -${HOP};0 0;0 -${HOP / 3};0 0" keyTimes="0;0.35;0.65;0.82;1" ` +
      `keySplines="0.2 0.6 0.4 1;0.6 0 0.8 0.4;0.2 0.6 0.4 1;0.6 0 0.8 0.4" calcMode="spline" ` +
      `dur="0.7s" begin="0s" repeatCount="1" fill="freeze"/>`
    : ''
  // A nested <svg> slides across the full width via its x attribute (in %),
  // pausing at each end.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${SCENE_H}">` +
    `<svg y="${HOP + 2}" width="${W + 30}" height="${H}" overflow="visible">` +
    `<animate attributeName="x" values="0%;88%;88%;0%;0%" keyTimes="0;0.45;0.5;0.95;1" ` +
    `dur="${walk}s" repeatCount="indefinite"/>` +
    `<g>${hop}` +
    critter(step, working) +
    thought +
    `</g></svg></svg>`
  )
}

// Sound is on unless muted with /buddy-sound; the choice persists across sessions.
async function chirp($: EngineInterface, asset: string) {
  if ((await $.store.get('muted')) === true) return
  await $.audio.play({ asset }, { gain: 0.5 }).catch(() => {})
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'buddy-sound', description: 'Turn the walking buddy’s sounds on or off.' })
    return next(e)
  })

  on('command.run', { command: 'buddy-sound' }, async $ => {
    const muted = (await $.store.get('muted')) !== true
    await $.store.set('muted', muted)
    return { text: muted ? 'Buddy is quiet now. 🤫' : 'Buddy has his voice back! 🔊' }
  })

  on('prompt.submit', async ($, e, next) => {
    void chirp($, 'sounds/hop.wav')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    void chirp($, 'sounds/wave.wav')
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const ui = $.ui.resolve(e)
    const working = e.props.isWorking

    if ('Svg' in ui) {
      const { Box, Svg } = ui
      return (
        <Box width="100%">
          <Svg
            key={working ? 'busy' : 'idle'}
            source={scene(working)}
            alt={working ? 'A little orange critter scurrying while Claude works' : 'A little orange critter strolling around'}
            height={SCENE_H}
            isInteractive
          />
        </Box>
      )
    }

    // Terminal fallback: a tiny text critter.
    const { Text } = ui
    return <Text color={ORANGE}>{working ? '▚▞ ▖▘ scurrying…' : '▚▞ ▖ strolling'}</Text>
  })
}
