// The layout shell: side rail at 600 px and wider, bottom bar below 600 px (DESIGN.md).
//
// happy-dom does no layout (scrollWidth and getBoundingClientRect are always 0), so "no
// horizontal scroll at 360 px" cannot be measured here. These tests check what decides it
// instead: at 360 px only the bottom bar renders (no fixed-width rail), no inline width is
// wider than the viewport, and the main area clips sideways overflow.
import { afterEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'
import { AppShell, defaultNavItems, narrowBreakpoint } from '../src/index.ts'
import { mountWithUi, setViewportWidth } from './helpers.ts'

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  setViewportWidth(1024)
})

function mountShell(width: number, props: Record<string, unknown> = {}) {
  setViewportWidth(width)
  const wrapper = mountWithUi(AppShell, { props, slot: '<p data-testid="page">Page content</p>' })
  unmount = () => wrapper.unmount()
  return wrapper
}

const rail = '[data-testid="nav-rail"]'
const bottom = '[data-testid="nav-bottom"]'
const labels = ['Portfolio', 'Reference data', 'Tokens', 'Settings']

describe('AppShell', () => {
  test('the narrow breakpoint is 600 px', () => {
    expect(narrowBreakpoint).toBe(600)
  })

  test.each([600, 1024, 1440])('shows the side rail at %i px', (width) => {
    const wrapper = mountShell(width)

    expect(wrapper.find(rail).exists()).toBe(true)
    expect(wrapper.find(bottom).exists()).toBe(false)
    const texts = wrapper
      .get(rail)
      .findAll('button')
      .map((b) => b.text())
    expect(texts).toEqual(labels)
    expect(wrapper.get('[data-testid="page"]').text()).toBe('Page content')
  })

  test.each([360, 599])('shows the bottom bar at %i px', (width) => {
    const wrapper = mountShell(width)

    expect(wrapper.find(rail).exists()).toBe(false)
    expect(wrapper.find(bottom).exists()).toBe(true)
    const names = wrapper
      .get(bottom)
      .findAll('button')
      .map((b) => b.attributes('aria-label'))
    expect(names).toEqual(labels)
    expect(wrapper.get('[data-testid="page"]').text()).toBe('Page content')
  })

  test('switches from rail to bottom bar when the window is resized', async () => {
    const wrapper = mountShell(1024)
    expect(wrapper.find(rail).exists()).toBe(true)

    setViewportWidth(360)
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.find(rail).exists()).toBe(false)
    expect(wrapper.find(bottom).exists()).toBe(true)
  })

  test('at 360 px no inline width is wider than the viewport and main clips overflow', () => {
    const wrapper = mountShell(360)

    for (const el of (wrapper.element as HTMLElement).querySelectorAll<HTMLElement>('[style]')) {
      for (const prop of ['width', 'min-width'] as const) {
        const px = /^(\d+(?:\.\d+)?)px$/.exec(el.style.getPropertyValue(prop))
        if (px) expect(Number(px[1]), `${prop} of ${el.className}`).toBeLessThanOrEqual(360)
      }
    }
    const main = wrapper.get('.platform-shell__main').element as HTMLElement
    const style = getComputedStyle(main)
    expect(style.overflowX).toBe('hidden')
    expect(parseFloat(style.minWidth)).toBe(0)
  })

  test('marks the active destination and emits the selected value', async () => {
    const wrapper = mountShell(1024, { modelValue: 'tokens' })
    const buttons = wrapper.get(rail).findAll('button')
    expect(buttons[2]?.attributes('aria-current')).toBe('page')
    expect(buttons[0]?.attributes('aria-current')).toBeUndefined()

    await buttons[3]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['settings']])
  })

  test('uses the items prop instead of the defaults', () => {
    const items = [defaultNavItems[0]!, { value: 'x', title: 'Extra', icon: 'M0 0h24v24H0z' }]
    const wrapper = mountShell(1024, { items })
    const texts = wrapper
      .get(rail)
      .findAll('button')
      .map((b) => b.text())
    expect(texts).toEqual(['Portfolio', 'Extra'])
  })
})
