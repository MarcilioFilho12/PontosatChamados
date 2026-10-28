import fs from 'node:fs'

const file = 'src/features/auth/edge-hero.tsx'
const source = fs.readFileSync(file, 'utf8')
const start = source.indexOf('M515.92 191.48')
const endMark = '576.4 196.88'
const end = source.indexOf(endMark)
if (start < 0 || end < 0) throw new Error(`markers ${start} ${end}`)
const pathStart = source.lastIndexOf('<path ', start)
const pathEnd = source.indexOf('/>', end)
if (pathStart < 0 || pathEnd < 0) throw new Error(`path ${pathStart} ${pathEnd}`)
const oldPath = source.slice(pathStart, pathEnd + 2)
if (!oldPath.includes('M515.92') || !oldPath.includes('576.4 196.88')) throw new Error('unexpected path')

const text =
  '<text x="507.2" y="196.55" fill="var(--illos-ink,var(--_ink))" stroke="none" font-family="Outfit, sans-serif" font-size="7.1" font-weight="600" letter-spacing="0.15" dominant-baseline="central">SUPPORT 214</text>'
const rectOld = 'x="492.42" y="187.48" width="87.12" height="18.15"'
const rectNew = 'x="492.42" y="187.48" width="112" height="18.15"'
if (!source.includes(rectOld)) throw new Error('rect missing')
if (source.split(rectOld).length !== 2) throw new Error('rect not unique')

const next = source.replace(oldPath, text).replace(rectOld, rectNew)
if (next.includes('M515.92 191.48')) throw new Error('path remains')
if (!next.includes('SUPPORT 214')) throw new Error('label missing')
fs.writeFileSync(file, next)
console.log('updated', oldPath.length, 'path chars')
