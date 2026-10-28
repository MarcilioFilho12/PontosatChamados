import fs from 'node:fs'
const s = fs.readFileSync('src/features/auth/edge-hero.tsx', 'utf8')
const i = s.indexOf('SUPPORT 214')
console.log(s.slice(i - 280, i + 40))
console.log('closes', s.includes('</svg>`;'))
