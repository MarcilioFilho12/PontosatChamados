import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'

const motion = 'transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'

const primaryClass = `inline-flex items-center justify-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-sm font-medium text-foam ${motion}`
const quietClass = `inline-flex items-center justify-center rounded-lg border border-line bg-foam px-4 py-2.5 text-sm text-ink ${motion}`
const dangerClass = `inline-flex items-center justify-center rounded-lg border border-clay/30 px-4 py-2.5 text-sm text-clay ${motion}`

function classes(variant: 'primary' | 'quiet' | 'danger'): string {
  if (variant === 'quiet') return quietClass
  if (variant === 'danger') return dangerClass
  return primaryClass
}

type IconName = 'arrow' | 'plus'

function Inner({
  icon,
  children,
}: {
  icon?: IconName
  children: ReactNode
}) {
  if (!icon) return children
  return (
    <>
      <Icon name={icon} />
      <span>{children}</span>
    </>
  )
}

export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'quiet' | 'danger'
  icon?: IconName
}) {
  return (
    <button className={`${classes(variant)} ${className ?? ''}`} {...props}>
      <Inner icon={variant === 'primary' ? icon : undefined}>{children}</Inner>
    </button>
  )
}

export function ButtonLink({
  to,
  icon,
  children,
  variant = 'primary',
}: {
  to: string
  icon?: IconName
  children: ReactNode
  variant?: 'primary' | 'quiet' | 'danger'
}) {
  return (
    <Link to={to} className={classes(variant)}>
      <Inner icon={variant === 'primary' ? icon : undefined}>{children}</Inner>
    </Link>
  )
}
