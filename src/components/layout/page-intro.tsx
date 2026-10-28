import type { ReactNode } from 'react'

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-medium tracking-[0.18em] text-mist uppercase">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
      </div>
      {children}
    </header>
  )
}
