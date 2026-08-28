# Agent Note: Composable product shell navigation

Status: implemented

English | [中文](2026-08-28-composable-product-shell-navigation.zh.md)

## Problem

Client plugins could contribute a Conversation view or Settings section but could not navigate to that contribution through a public service. A plugin could also occupy only the existing Tool Details seat, so a persistent product-specific details surface had to replace Tool Details or live outside the three-column shell. The sidebar exposed one single Workspace-browser seat, leaving product navigation to wrap or replace its owner. Product-specific CSS also had no stable way to identify the AppFrame without importing a private CSS-module class.

Directly reaching the Conversation store, Settings component state, or package-private React components would make a composed product depend on implementation details. Replacing the existing seats would change the default Web application's ownership and make independently installed client plugins conflict.

## Decision

The Conversation package provides `ctx.conversationNavigation.open(sessionId, viewId)`. It validates the live Session and registered `conversation.view` id, then calls the existing per-session chat store's `setView` action. The service creates no second view registry or selection state. It fails when the Session is unknown, the store has not rendered, or the view is not registered.

The Settings shell provides `ctx.settingsNavigation`, an observable controller for the shell's existing open state and selected `settings.section` id. The trigger, onboarding callbacks, and external callers all use that controller. It changes viewing state only; configuration writes continue through each section's existing Host API.

The details shell declares the optional single `conversation.details.auxiliary` seat beside the existing `conversation.details.tool` seat. An auxiliary subtree remains mounted while a selected Tool call covers it. Back clears the Tool selection through the shared chat store, and Close clears that temporary selection before closing the existing details panel. With no auxiliary registrant, the default details output and controls are unchanged.

The Tool call tree exposes a dedicated Details action for every root and child call. It sends the call id, Tool name, and Conversation anchor to the existing `ChatViewInjected.openDetails` callback, which selects the call in the shared store and opens the existing panel. The Tool row keeps its inline-expansion gesture, while Inspect keeps its Trajectory navigation behavior.

The sidebar declares additive list seats named `sidebar.before.workspaces` and `sidebar.after.workspaces`. They receive the same `wide` and `expandSidebar` owner share as `sidebar.workspaces` and render in the same scrolling region. The existing single Workspace seat keeps its meaning and owner.

AppFrame exposes the inert `data-dsh-layout-frame` marker on its root. Composed products may scope CSS to that marker without importing a private class. The marker carries no state and does not alter layout behavior.

## Alternatives considered

**Put product navigation and details behavior in the Harness bundles.** Rejected because a bundle chooses composition, while the labels, commands, and state belong to the product plugin. The reusable gap was public client composition, not a new built-in product.

**Let external plugins mutate private stores or component state.** Rejected because it would make package-private implementation an accidental API and bypass registration validation. The public controllers write through the same actions the existing controls use.

**Add another Conversation registry or embed a reduced Trajectory view in details.** Rejected because `conversation.view` already owns full-page Conversation views and the per-session store already owns selection. A parallel registry or projection would create competing navigation and trace state.

**Replace Tool Details with an auxiliary product panel.** Rejected because tools own their details presentation. Keeping both subtrees under the existing details shell preserves Tool Details and lets a product retain local viewing state while it is temporarily covered.

**Create a second Settings page or expose settings writes on the navigation service.** Rejected because Settings sections already own their validation and Host operations. Navigation is a viewing concern and must not become a configuration authority.

**Replace `sidebar.workspaces` with a product sidebar.** Rejected because the single seat already belongs to the Workspace browser. Additive seats preserve that contract and allow several independent contributors.

## Consequences

A client plugin can navigate to the built-in Trajectory view, open the built-in Models or Plugins section, place persistent content behind Tool Details, and add product navigation around the Workspace browser without copying Harness UI. Every Tool call also provides an explicit route into the existing Tool Details panel without changing the row's expansion action.

Conversation navigation requires the target Session subtree to have rendered, matching the lifetime of the store it selects. Settings navigation accepts a requested section id before that section is read by the shell; the shell falls back to its first current row if the requested registration is absent. Auxiliary details are single-owner because the panel can present only one persistent surface, while the two sidebar extension seats are ordered lists.

Focused client tests cover controller state, invalid targets, explicit Tool selection, shared-store selection, auxiliary-to-Tool transitions, default Tool Details behavior, sidebar seat ordering, and the AppFrame marker. Package READMEs document the public services and slots in both supported languages.
