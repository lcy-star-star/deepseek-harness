# Agent Note: Explicit details actions work on blank Sessions

Status: implemented

English | [中文](2026-08-29-explicit-details-on-blank-sessions.zh.md)

## Problem

The details panel has additive auxiliary content that can be useful before a conversation contains its first message. `openDetails()` updated the root layout preference, but `AppFrame` discarded that width whenever the selected Session summary was blank. A composed product therefore could not present an explicitly requested auxiliary surface on its real empty Session even though the Session-scoped slot had a valid owner.

## Decision

The current Session id is the details ownership signal. A connected blank Session can render details when a caller explicitly invokes `ctx.layout.openDetails()`; the transient store still defaults details to closed. A missing current Session remains ownerless and derives a zero-width details track without changing the stored preference.

The existing [Session lifecycle rule](2026-07-29-web-details-session-lifecycle.md) still closes details when the selected Session id changes. The change does not open details automatically, persist panel geometry, alter slot scope, or give blank Sessions fabricated conversation events.

## Alternatives considered

**Require products to create a non-blank conversation before opening auxiliary details.** Rejected because a synthetic user or assistant message would pollute the authoritative Session log and misrepresent learner activity solely to satisfy presentation state.

**Render product auxiliary content in a root-scoped overlay.** Rejected because it would bypass the details column, duplicate responsive panel behavior, and create a second presentation owner alongside Tool Details.

**Open details for every blank Session by default.** Rejected because the shell-wide default remains closed. Only an explicit panel action opts a composed product into the auxiliary surface.

## Consequences

Products can keep a three-column shell from their first real Session without inventing conversation activity. Existing deployments see no default change because the layout store still initializes details at zero. Switching Session ids still closes details, and states with no current Session still render no details track. The AppFrame behavior test pins explicit opening on a connected blank Session alongside the existing lifecycle cases.
