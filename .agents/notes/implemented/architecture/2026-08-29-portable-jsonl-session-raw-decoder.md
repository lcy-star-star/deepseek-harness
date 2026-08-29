# Agent Note: Decode exported JSONL session artifacts without backend storage access

Status: implemented

English | [中文](2026-08-29-portable-jsonl-session-raw-decoder.zh.md)

## Problem

`SessionPersistence.readRaw()` exposes the backend-written JSONL text for export, but the supported decoder remained private to the JSONL provider. A consumer that must validate the exported bytes outside the provider's storage root could either depend on private built files or implement the packed-row format independently. Both choices couple the consumer to internal package layout or duplicate the codec that owns physical-to-logical reconstruction.

## Decision

`@deepseek-ai/dsh-session-persistence-jsonl` exports `decodeJsonlSessionRawArtifact(content)`. It accepts the decompressed UTF-8 text returned by `readRaw()`, delegates header, format-version, packed-row, and contiguous-sequence validation to the provider's existing scanner, and returns the logical `SessionInspection` fields.

The function is verification-oriented rather than recovery-oriented. It rejects any bytes beyond the scanner's complete contiguous prefix, including an incomplete line or a post-prefix sequence gap. Physical Zstandard decoding remains owned by the live provider's `readRaw()` implementation; the portable decoder consumes only its logical JSONL text and does not accept a storage path.

## Alternatives considered

- **Expose the private `format.ts` and Zstandard modules as public subpaths.** Rejected because consumers need one supported operation, not the backend's physical primitives or package layout.
- **Add parsed events to `SessionRawArtifact`.** Rejected because the raw-artifact seam promises backend-written text, while a second representation would not independently prove what those bytes decode to.
- **Require access to the original persistence root or a Harness source checkout.** Rejected because exported artifacts are intentionally portable and installed products cannot depend on a development checkout.
- **Let each consumer parse storage rows.** Rejected because packed-row vocabulary and future format refusal belong to the persistence provider's maintained decoder.

## Consequences

- Verifiers can reconstruct the logical session from exported raw text using the exact decoder that normal persistence reads use.
- The API deliberately does not decompress `.jsonl.zstd` files; callers obtain portable plaintext through `readRaw()` first.
- Strict tail refusal distinguishes evidence validation from crash recovery. Consumers that own a live persistence backend continue to use `load()` or `inspect()` for recovery semantics.
