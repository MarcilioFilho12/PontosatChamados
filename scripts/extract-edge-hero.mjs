import fs from 'node:fs'

const transcript =
  'C:/Users/Marcilio/.cursor/projects/c-Users-Marcilio-Desktop-Desafio-PontoSat/agent-transcripts/8f6646f1-eb19-4679-8705-0448736294c0/8f6646f1-eb19-4679-8705-0448736294c0.jsonl'
const lines = fs.readFileSync(transcript, 'utf8').split(/\n/)
const line = lines.find((entry) => entry.includes('const EDGE_SVG'))
if (!line) throw new Error('transcript line missing')
const message = JSON.parse(line)
const text = message.message.content.find((part) => part.type === 'text').text
const marker = 'const EDGE_SVG = `'
const start = text.indexOf(marker)
const end = text.indexOf('`;', start)
if (start < 0 || end < 0) throw new Error(`markers ${start} ${end}`)
const svgConst = text.slice(start, end + 2)
const inner = svgConst.slice(marker.length, -2)
if (!inner.startsWith('<svg') || !inner.endsWith('</svg>')) {
  throw new Error(`svg bounds ${inner.slice(0, 20)} … ${inner.slice(-20)}`)
}
if (inner.includes('`') || inner.includes('${')) throw new Error('template unsafe')

const header = `import { useEffect, useRef, type CSSProperties } from 'react'

// Ilustração Edge network (HUD), Illos — https://illos.dev/license
// Uso no produto é permitido, inclusive com alteração de cor.
// Não redistribuir o desenho como pacote de ilustração.
// A lógica de reprodução abaixo segue o componente de origem (MIT).

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

`

const footer = `

export function LoginEdgeArt({ className }: { className?: string }) {
  return (
    <IllosArt
      svg={EDGE_SVG}
      className={cx(
        'mt-8 max-h-52 w-full overflow-hidden [--illos-accent:#465fff] [--illos-ink:#101828] [--illos-line:#667085] [&>svg]:origin-[50%_64%] [&>svg]:scale-[1.35] lg:max-h-none',
        className,
      )}
    />
  )
}

function IllosArt({ svg, className, style }: { svg: string; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? loopInView(ref.current) : undefined), [])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx('[&>svg]:h-auto [&>svg]:w-full', className)}
      style={{ '--illos-play': 'paused', ...style } as CSSProperties}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function loopInView(host: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const animations = () => host.getAnimations({ subtree: true })
  let visible = false
  let stopped = false
  let waiting = false
  const loop = () => {
    if (waiting || stopped || !visible) return
    const list = animations()
    if (!list.length) return
    waiting = true
    Promise.all(list.map((animation) => animation.finished)).then(
      () =>
        requestAnimationFrame(() => {
          waiting = false
          if (stopped || !visible) return
          for (const animation of animations()) animation.currentTime = 0
          loop()
        }),
      () =>
        requestAnimationFrame(() => {
          waiting = false
          loop()
        }),
    )
  }
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
      host.style.setProperty('--illos-play', visible ? 'running' : 'paused')
      loop()
    },
    { threshold: 0.25 },
  )
  observer.observe(host)
  return () => {
    stopped = true
    observer.disconnect()
  }
}
`

const out = 'C:/Users/Marcilio/Desktop/Desafio PontoSat/src/features/auth/edge-hero.tsx'
fs.writeFileSync(out, header + svgConst + '\n' + footer)
console.log('wrote', out, 'bytes', fs.statSync(out).size)
