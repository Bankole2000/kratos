// Mounts a component the way a host app would: with createPlatformUi and a mocked fetch.
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { createPlatformUi } from '../src/index.ts'

export const apiBaseUrl = 'http://api.test'

/** A JSON response like the api sends. */
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Sets the happy-dom viewport width (Vuetify reads it when the plugin is installed). */
export function setViewportWidth(width: number): void {
  const { happyDOM } = window as unknown as {
    happyDOM: { setViewport(size: { width: number; height: number }): void }
  }
  happyDOM.setViewport({ width, height: 800 })
}

/** Mounts `component` with the platform plugin; `fetch` answers every api request. */
export function mountWithUi(
  component: Component,
  options: { fetch?: typeof globalThis.fetch; props?: Record<string, unknown>; slot?: string } = {},
) {
  const fetch = options.fetch ?? (async () => jsonResponse(200, {}))
  return mount(component, {
    props: options.props ?? {},
    slots: options.slot ? { default: options.slot } : {},
    global: { plugins: [createPlatformUi({ apiBaseUrl, fetch })] },
    attachTo: document.body,
  })
}
