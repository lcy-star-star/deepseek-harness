# Agent Note: 显式详情操作可作用于 blank Session

Status: implemented

[English](2026-08-29-explicit-details-on-blank-sessions.md) | 中文

## 问题

详情面板包含附加式辅助内容，这些内容在对话产生第一条消息之前也可能有用。`openDetails()` 会更新根布局首选值，但只要选中 Session 的摘要仍为 blank，`AppFrame` 就会丢弃该宽度。因此，即使 Session 作用域 slot 已有有效 owner，组装后的产品也无法在真实空 Session 上呈现显式请求的辅助表面。

## 决策

当前 Session id 是详情所有权信号。调用方显式执行 `ctx.layout.openDetails()` 时，已连接的 blank Session 可以渲染详情；瞬时 store 的详情默认值仍然是关闭。没有当前 Session 时仍属于无 owner 状态，其详情轨道派生为零宽度，但不会改变存储的首选值。

现有的 [Session 生命周期规则](2026-07-29-web-details-session-lifecycle.md)仍会在选中的 Session id 改变时关闭详情。该修正不会自动打开详情、持久化面板几何信息、改变 slot 作用域，也不会为 blank Session 伪造对话事件。

## 考虑过的替代方案

**要求产品先创建非 blank 对话，再打开辅助详情。** 之所以否决：合成的用户或助手消息会污染权威 Session 日志，并且仅为满足呈现状态而错误表示学习者活动。

**在根作用域 overlay 中渲染产品辅助内容。** 之所以否决：这会绕过详情栏、复制响应式面板行为，并在 Tool Details 旁建立第二个呈现 owner。

**默认打开每个 blank Session 的详情栏。** 之所以否决：整个外壳的默认值仍应保持关闭；只有显式面板操作才会让组装后的产品启用辅助表面。

## 后果

产品可以从第一个真实 Session 起保持三栏外壳，无需发明对话活动。现有部署的默认行为不变，因为布局 store 仍以详情宽度为零进行初始化。切换 Session id 仍会关闭详情，而没有当前 Session 的状态仍不会渲染详情轨道。AppFrame 行为测试在现有生命周期案例旁固定了已连接 blank Session 上的显式打开行为。
