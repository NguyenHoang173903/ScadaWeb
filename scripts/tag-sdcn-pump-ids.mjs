import fs from 'fs'

const path = 'D:/Hoang_Web/workspace/ScadaWeb/src/assets/images/sdcn.svg'
let raw = fs.readFileSync(path, 'utf8')

// Idempotent cleanup from previous runs
raw = raw.replace(
  /\s+id="pump-\d+-yellow-\d+"\s+class="pump-yellow"\s+data-pump="\d+"\s+data-part="yellow"/g,
  '',
)
raw = raw.replace(
  /\n<!-- process-pumps:[^>]*>\n(?:<g id="pump-\d+"[^>]*><\/g>\n)*/g,
  '\n',
)
raw = raw.replace(/\n<g id="pump-\d+" class="process-pump" data-pump="\d+"><\/g>/g, '')

const centers = [236.1, 360.7, 506.0, 660.4, 798.0, 939.4, 1074.0, 1213.0, 1367.0, 1501.0]

function pumpIdForX(x) {
  let best = 1
  let bestDist = Infinity
  centers.forEach((c, i) => {
    const d = Math.abs(x - c)
    if (d < bestDist) {
      bestDist = d
      best = i + 1
    }
  })
  return best
}

const counters = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 0]))
const re = /<path d="M([\d.]+)\s+([\d.]+)[^"]*"\s+fill="#FFFF13"[^/]*\/>/g

const updated = raw.replace(re, (full) => {
  const m = full.match(/^<path d="M([\d.]+)/)
  if (!m) return full
  const x = parseFloat(m[1])
  const pump = pumpIdForX(x)
  counters[pump] += 1
  const part = counters[pump]
  return full.replace(
    '<path ',
    `<path id="pump-${pump}-yellow-${part}" class="pump-yellow" data-pump="${pump}" data-part="yellow" `,
  )
})

let finalSvg = updated
if (!finalSvg.includes('<!-- process-pumps:')) {
  finalSvg = finalSvg.replace(
    /<svg([^>]*)>/,
    `<svg$1>\n<!-- process-pumps: id=pump-N-yellow-M | class=pump-yellow | data-pump=N | data-part=yellow. Set fill on [data-pump="N"][data-part="yellow"] -->`,
  )
}

fs.writeFileSync(path, finalSvg)
console.log('Yellow parts per pump:', counters)
console.log(
  'Total tagged:',
  Object.values(counters).reduce((a, b) => a + b, 0),
)
