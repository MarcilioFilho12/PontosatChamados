type IconName = 'arrow' | 'arrow-up' | 'arrow-down' | 'plus' | 'search' | 'close' | 'logout' | 'menu' | 'tickets' | 'users' | 'profile'

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    viewBox: '0 0 20 20',
    className: className ?? 'h-4 w-4',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.25,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="8.5" cy="8.5" r="4.25" />
        <path d="M12 12.5 16.5 17" />
      </svg>
    )
  }

  const path = {
    arrow: 'M4 10h11M11 6l4 4-4 4',
    'arrow-up': 'M10 16V4M6 8l4-4 4 4',
    'arrow-down': 'M10 4v12M6 12l4 4 4-4',
    plus: 'M10 4v12M4 10h12',
    close: 'M5 5l10 10M15 5 5 15',
    logout: 'M8 5H5v10h3M9 10h7M13 7l3 3-3 3',
    menu: 'M4 6h12M4 10h12M4 14h12',
    tickets: 'M4.5 6.5h11v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-8zM4.5 6.5 10 10.5l5.5-4',
    users: 'M7.2 9.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3.2 15.2c.4-2 1.8-3 4-3s3.6 1 4 3M13.2 8.6a1.7 1.7 0 1 0 0-3.2M14.4 12.2c1.2.3 2.1 1.2 2.4 2.8',
    profile: 'M10 10.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM5.2 16c.6-2.2 2.4-3.4 4.8-3.4s4.2 1.2 4.8 3.4',
  }[name]

  return (
    <svg {...common}>
      <path d={path} />
    </svg>
  )
}
