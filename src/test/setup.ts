import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const OriginalRequest = globalThis.Request

globalThis.Request = class extends OriginalRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init && 'signal' in init) {
      const rest = { ...init }
      delete rest.signal
      super(input, rest)
      return
    }
    super(input, init)
  }
}

afterEach(() => {
  cleanup()
})

