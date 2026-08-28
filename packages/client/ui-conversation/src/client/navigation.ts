/** Public navigation over the existing per-session Conversation view store. */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import type { ISessions, SessionId } from '@deepseek-ai/dsh-client-runtime/client'

/** Client service that selects a registered Conversation view for one Session. */
export interface IConversationNavigation {
  /**
   * Select a registered view without replacing the Conversation shell.
   * @param sessionId - live Session whose existing view store receives the selection.
   * @param viewId - `conversation.view` registration id.
   * @throws When the Session, rendered store, or view registration is unavailable.
   */
  open(sessionId: SessionId, viewId: string): void
}
/** Resolver functions owned by the Conversation assembly. */
interface ConversationNavigationResolver {
  /** Current Client Session registry. */
  readonly sessions: ISessions
  /** Whether one view id is registered on the current slot ledger. */
  readonly hasView: (viewId: string) => boolean
}

/** Root service that writes only through the Conversation store's existing action. */
export class ConversationNavigationController extends Service implements IConversationNavigation {
  private readonly selections = new Map<SessionId, (viewId: string) => void>()

  /**
   * Register the navigation service for the Conversation plugin lifetime.
   * @param ctx - owning Client Context.
   * @param resolver - live Session and view-registration readers.
   */
  constructor(ctx: Context, private readonly resolver: ConversationNavigationResolver) {
    super(ctx, 'conversationNavigation')
    ctx.effect(() => () => { this.selections.clear() }, 'conversation navigation bindings')
  }

  /**
   * Attach the existing store action after a Session view is rendered.
   * @param sessionId - rendered Session identity.
   * @param select - bound `setView` store action.
   */
  bind(sessionId: SessionId, select: (viewId: string) => void): void {
    this.selections.set(sessionId, select)
  }

  /** @inheritdoc */
  open(sessionId: SessionId, viewId: string): void {
    if (this.resolver.sessions.binding(sessionId) === undefined) {
      throw new Error(`conversation navigation: unknown Session ${JSON.stringify(sessionId)}`)
    }
    if (viewId.length === 0 || !this.resolver.hasView(viewId)) {
      throw new Error(`conversation navigation: unknown view ${JSON.stringify(viewId)}`)
    }
    const select = this.selections.get(sessionId)
    if (select === undefined) {
      throw new Error(`conversation navigation: Session ${JSON.stringify(sessionId)} has no rendered view store`)
    }
    select(viewId)
  }
}
