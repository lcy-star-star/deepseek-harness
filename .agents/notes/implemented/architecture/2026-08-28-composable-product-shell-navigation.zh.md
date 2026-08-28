# Agent Note: 可组装产品外壳导航

Status: implemented

[English](2026-08-28-composable-product-shell-navigation.md) | 中文

## Problem

客户端插件可以贡献 Conversation 视图或 Settings 分区，却无法通过公开服务导航到自己的贡献项。插件也只能占用既有 Tool Details seat，因此持久的产品专属详情表层要么替换 Tool Details，要么只能放在三栏外壳之外。侧边栏只暴露一个单实例 Workspace 浏览器 seat，产品导航不得不包装或替换其拥有方。产品专属 CSS 也无法在不导入私有 CSS module class 的情况下稳定识别 AppFrame。

直接访问 Conversation store、Settings 组件状态或包私有 React 组件，会让组装产品依赖实现细节。替换既有 seat 则会改变默认 Web 应用的所有权，并使独立安装的客户端插件发生冲突。

## Decision

Conversation 包提供 `ctx.conversationNavigation.open(sessionId, viewId)`。它验证存活会话与已注册的 `conversation.view` id，随后调用既有逐会话聊天 store 的 `setView` action。该服务不会建立第二份视图注册表或选择状态。会话未知、store 尚未渲染或视图尚未注册时，它都会失败。

Settings 外壳提供 `ctx.settingsNavigation`，作为此外壳既有打开状态与所选 `settings.section` id 的可观察控制器。触发器、首次使用引导回调与外部调用方都使用该控制器。它只改变查看状态；配置写入仍经各分区既有的 Host API 完成。

详情外壳在既有 `conversation.details.tool` seat 旁声明可选的单实例 `conversation.details.auxiliary` seat。辅助子树会在所选工具调用覆盖它的期间保持挂载。「返回」通过共享聊天 store 清除工具选择，「关闭」则会先清除这份临时选择，再关闭既有详情面板。没有辅助注册方时，默认详情输出与控件保持不变。

工具调用树为每个 root 和 child 调用暴露专用「详情」操作。它把调用 id、工具名称与 Conversation 锚点发送给既有 `ChatViewInjected.openDetails` 回调；该回调在共享 store 中选中调用，并打开既有面板。工具行保留行内展开手势，Inspect 保留其 Trajectory 导航行为。

侧边栏声明名为 `sidebar.before.workspaces` 与 `sidebar.after.workspaces` 的可叠加列表 seat。它们接收与 `sidebar.workspaces` 相同的 `wide` 和 `expandSidebar` owner share，并在同一滚动区域内渲染。既有单实例 Workspace seat 保持原有含义与拥有方。

AppFrame 在根节点暴露无行为的 `data-dsh-layout-frame` 标记。组装产品可将 CSS 限定到该标记，而无需导入私有 class。该标记不携带状态，也不改变布局行为。

## Alternatives considered

**把产品导航与详情行为放进 Harness bundle。** 否决，因为 bundle 只选择组合，而标签、命令与状态属于产品插件。可复用缺口是公开客户端组合能力，而不是新的内置产品。

**让外部插件修改私有 store 或组件状态。** 否决，因为这会把包私有实现变成偶然 API，并绕过注册验证。公开控制器通过既有控件所用的同一组 action 写入。

**新增另一份 Conversation 注册表，或在详情中嵌入精简 Trajectory 视图。** 否决，因为 `conversation.view` 已拥有完整 Conversation 视图，逐会话 store 也已拥有选择状态。平行注册表或投影会产生相互竞争的导航与轨迹状态。

**用辅助产品面板替换 Tool Details。** 否决，因为工具拥有自己的详情呈现。把两棵子树都保留在既有详情外壳下，可保留 Tool Details，并让产品在被临时覆盖期间保有本地查看状态。

**建立第二张 Settings 页面，或在导航服务上暴露设置写入。** 否决，因为 Settings 分区已经拥有自己的验证与 Host 操作。导航只负责查看，不得成为配置权威。

**用产品侧边栏替换 `sidebar.workspaces`。** 否决，因为该单实例 seat 已归 Workspace 浏览器所有。可叠加 seat 会保留该约定，并允许多个独立贡献方共存。

## Consequences

客户端插件可以导航到内置 Trajectory 视图，打开内置 Models 或 Plugins 分区，把持久内容放在 Tool Details 后方，并在 Workspace 浏览器周围添加产品导航，而无需复制 Harness UI。每个工具调用也会提供进入既有 Tool Details 面板的显式路径，且不会改变工具行的展开操作。

Conversation 导航要求目标会话子树已经渲染，这与它所选择的 store 生命周期一致。Settings 导航可以在外壳读取目标分区之前接收目标 id；请求的注册缺席时，外壳会回退到当前第一行。辅助详情是单拥有方，因为面板只能呈现一个持久表层；两个侧边栏扩展 seat 则是有序列表。

聚焦客户端测试覆盖控制器状态、非法目标、显式工具选择、共享 store 选择、辅助详情与 Tool Details 切换、默认 Tool Details 行为、侧边栏 seat 顺序以及 AppFrame 标记。各包 README 以两种受支持语言记录这些公开服务与 slot。
