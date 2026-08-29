# Agent Note: 无需访问后端存储即可解码导出的 JSONL 会话产物

Status: implemented

[English](2026-08-29-portable-jsonl-session-raw-decoder.md) | 中文

## 问题

`SessionPersistence.readRaw()` 会公开后端写出的 JSONL 文本用于导出，但受支持的解码器仍是 JSONL 提供方的私有实现。需要在提供方存储根之外验证导出字节的消费方，只能依赖私有构建文件，或自行实现打包行格式。前者耦合内部包布局，后者则复制了拥有物理记录到逻辑事件重建职责的 codec。

## 决策

`@deepseek-ai/dsh-session-persistence-jsonl` 导出 `decodeJsonlSessionRawArtifact(content)`。它接收 `readRaw()` 返回的已解压 UTF-8 文本，把 header、格式版本、打包行和连续序列校验委托给提供方既有 scanner，并返回逻辑 `SessionInspection` 字段。

该函数面向验证而不是恢复。对于 scanner 完整连续前缀以外的任何字节，包括不完整行或前缀后的序列缺口，它都会拒绝。物理 Zstandard 解码仍归活动提供方的 `readRaw()` 实现所有；可移植解码器只消费其逻辑 JSONL 文本，不接受存储路径。

## 曾考虑的替代方案

- **把私有 `format.ts` 和 Zstandard 模块作为公开子路径。** 否决，因为消费方只需要一个受支持操作，而不需要后端物理原语或包布局。
- **在 `SessionRawArtifact` 中加入已解析事件。** 否决，因为原始产物 seam 承诺的是后端写出的文本，而第二份表示无法独立证明这些字节解码出的内容。
- **要求访问原始持久化根或 Harness 源码 checkout。** 否决，因为导出产物本来就应可移植，已安装产品也不能依赖开发 checkout。
- **让每个消费方自行解析存储行。** 否决，因为打包行词汇与未来格式拒绝都属于持久化提供方维护的解码器。

## 结果

- 验证器可以用普通持久化读取所用的同一个解码器，从导出原始文本重建逻辑会话。
- 该 API 刻意不解压 `.jsonl.zstd` 文件；调用方先通过 `readRaw()` 获取可移植明文。
- 严格尾部拒绝把证据验证与崩溃恢复区分开。拥有活动持久化后端的消费方继续使用 `load()` 或 `inspect()` 获取恢复语义。
