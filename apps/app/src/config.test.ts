import { describe, expect, it } from 'vitest'
import { DEFAULT_API_BASE_URL, apiBaseUrl } from './config'

describe('apiBaseUrl', () => {
  it('uses VITE_API_BASE_URL when it is set', () => {
    expect(apiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.test' })).toBe(
      'https://api.example.test',
    )
  })

  it('falls back to the local api', () => {
    expect(apiBaseUrl({})).toBe('http://127.0.0.1:18080')
    expect(DEFAULT_API_BASE_URL).toBe('http://127.0.0.1:18080')
  })
})
