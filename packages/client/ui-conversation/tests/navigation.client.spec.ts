/** Public Conversation navigation validation and store-action delegation. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import { ConversationNavigationController } from '../src/client/navigation.ts'

const SESSION = 'session-1' as SessionId

function controller(options: { session?: boolean; view?: boolean } = {}) {
  const ctx = new Context()
  const navigation = new ConversationNavigationController(ctx, {
    sessions: {
      binding: (sessionId: SessionId) => options.session === false || sessionId !== SESSION
        ? undefined
        : {},
    } as never,
    hasView: () => options.view !== false,
  })
  return { ctx, navigation }
}

describe('ConversationNavigationController', () => {
  it('delegates a registered view to the bound per-session store action', () => {
    const { navigation } = controller()
    const select = vi.fn()
    navigation.bind(SESSION, select)

    navigation.open(SESSION, 'trajectory')

    expect(select).toHaveBeenCalledWith('trajectory')
  })

  it('rejects unknown Sessions, views, and unrendered stores', () => {
    const unknownSession = controller({ session: false }).navigation
    expect(() => { unknownSession.open(SESSION, 'trajectory') }).toThrow(/unknown Session/)

    const unknownView = controller({ view: false }).navigation
    expect(() => { unknownView.open(SESSION, 'trajectory') }).toThrow(/unknown view/)
    expect(() => { controller().navigation.open(SESSION, '') }).toThrow(/unknown view/)
    expect(() => { controller().navigation.open(SESSION, 'trajectory') }).toThrow(/no rendered view store/)
  })

  it('drops store bindings with the owning plugin fiber', async () => {
    const ctx = new Context()
    let navigation: ConversationNavigationController | undefined
    const fiber = ctx.plugin({
      apply: (pluginCtx) => {
        navigation = new ConversationNavigationController(pluginCtx, {
          sessions: { binding: () => ({}) } as never,
          hasView: () => true,
        })
      },
    })
    await fiber.await()
    const installed = navigation
    if (installed === undefined) throw new Error('navigation was not installed')
    installed.bind(SESSION, vi.fn())

    await fiber.dispose()

    expect(() => { installed.open(SESSION, 'trajectory') }).toThrow(/no rendered view store/)
  })
})
