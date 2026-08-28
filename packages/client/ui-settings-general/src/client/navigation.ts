/** Observable navigation state for the existing Settings shell. */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'

/** Stable Settings visibility and requested section. */
export interface SettingsNavigationSnapshot {
  /** Whether the Settings dialog is visible. */
  readonly open: boolean
  /** Requested `settings.section` id; omission selects the first registered section. */
  readonly sectionId?: string
}
/** Public controller for opening the existing Settings shell and its registered sections. */
export interface ISettingsNavigation {
  /** @returns the stable current snapshot. */
  getSnapshot(): SettingsNavigationSnapshot
  /**
   * Subscribe to snapshot replacement.
   * @param listener - notified after visibility or section changes.
   * @returns disposer removing the listener.
   */
  subscribe(listener: () => void): () => void
  /**
   * Open Settings at the requested registered section, or its first section when omitted.
   * @param sectionId - optional `settings.section` registration id.
   * @throws When a supplied id is empty.
   */
  open(sectionId?: string): void
  /** Close Settings and clear the requested section. */
  close(): void
}

/** Root-scoped Settings navigation service. */
export class SettingsNavigationController extends Service implements ISettingsNavigation {
  private snapshot: SettingsNavigationSnapshot = Object.freeze({ open: false })
  private readonly listeners = new Set<() => void>()

  /** @param ctx - owning Client Context. */
  constructor(ctx: Context) {
    super(ctx, 'settingsNavigation')
    ctx.effect(() => () => { this.listeners.clear() }, 'settings navigation listeners')
  }

  /** @inheritdoc */
  readonly getSnapshot = (): SettingsNavigationSnapshot => this.snapshot

  /** @inheritdoc */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** @inheritdoc */
  open(sectionId?: string): void {
    if (sectionId !== undefined && sectionId.length === 0) {
      throw new Error('settings navigation: section id must be non-empty')
    }
    this.publish(Object.freeze({ open: true, ...(sectionId === undefined ? {} : { sectionId }) }))
  }

  /** @inheritdoc */
  close(): void {
    this.publish(Object.freeze({ open: false }))
  }

  private publish(next: SettingsNavigationSnapshot): void {
    if (this.snapshot.open === next.open && this.snapshot.sectionId === next.sectionId) return
    this.snapshot = next
    for (const listener of [...this.listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('settings navigation listener threw:', error)
      }
    }
  }
}
