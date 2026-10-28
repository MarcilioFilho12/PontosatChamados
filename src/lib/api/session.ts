const STORAGE_KEY = 'pontosat.session'

type StoredSession = {
  accessToken: string
  expiresAt: number
}

export function readSession(): StoredSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (typeof parsed.accessToken !== 'string' || parsed.accessToken.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function writeSession(accessToken: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000
  const payload: StoredSession = { accessToken, expiresAt }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
