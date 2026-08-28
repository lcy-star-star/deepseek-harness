/** Public Settings navigation controller state and listener lifecycle. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SettingsNavigationController } from '../src/client/navigation.ts'
import type { ISettingsNavigation } from '../src/client/navigation.ts'

describe('SettingsNavigationController', () => {
  it('publishes open, section replacement, and close snapshots', () => {
    const ctx = new Context()
    const navigation = new SettingsNavigationController(ctx)
    const listener = vi.fn()
    const off = navigation.subscribe(listener)

    navigation.open('models')
    expect(navigation.getSnapshot()).toEqual({ open: true, sectionId: 'models' })
    navigation.open('models')
    expect(listener).toHaveBeenCalledOnce()
    navigation.close()
    expect(navigation.getSnapshot()).toEqual({ open: false })
    expect(listener).toHaveBeenCalledTimes(2)

    off()
    navigation.open()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('rejects an empty contributed section id', () => {
    const ctx = new Context()
    const navigation = new SettingsNavigationController(ctx)
    expect(() => { navigation.open('') }).toThrow(/section id must be non-empty/)
  })

  it('isolates a listener failure from state publication', () => {
    const ctx = new Context()
    const navigation = new SettingsNavigationController(ctx)
    const failure = new Error('listener failure')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    navigation.subscribe(() => { throw failure })

    navigation.open()

    expect(navigation.getSnapshot()).toEqual({ open: true })
    expect(error).toHaveBeenCalledWith('settings navigation listener threw:', failure)
    error.mockRestore()
  })

  it('drops listeners with the owning plugin fiber', async () => {
    const ctx = new Context()
    let navigation: ISettingsNavigation | undefined
    const fiber = ctx.plugin({
      apply: (pluginCtx) => { navigation = new SettingsNavigationController(pluginCtx) },
    })
    await fiber.await()
    if (navigation === undefined) throw new Error('navigation was not installed')
    const listener = vi.fn()
    navigation.subscribe(listener)

    await fiber.dispose()
    navigation.open()

    expect(listener).not.toHaveBeenCalled()
  })
})
