---
name: external-skill-loader
description: 手动引入并执行外部 Skill 的桥接器。仅在用户显式请求时使用，例如输入 /external-skill 或“手动加载某个 Skill”，根据用户提供的路径、名称或外部链接（含飞书文档 URL）读取内容并按其指令执行。
version: 0.0.5
last_updater: zhangheng
updateAt: 2026-03-18
---

# External Skill Loader（手动触发）

## 作用与边界

- **作用**：根据用户提供的“外部 Skill 标识（路径、名称或链接）”，读取对应内容并遵循其中的指令执行；
- **边界**：**禁止自动触发**，只能在用户明确表达“我要加载/执行某个外部 Skill”时才使用。

> 外部 Skill 来源可以是：
> - 本地文件：`.cursor/skills/**/SKILL.md`、`~/.cursor/skills/**/SKILL.md`；
> - **外部链接**：任意可访问的 URL，例如**飞书文档**链接；抓取到的页面/文档内容视为 Skill 正文，按其中描述的流程与约束执行；
> - 插件或 MCP 提供的 Skill 文档（用户给出可访问路径或链接时）。

## 何时可以使用本 Skill（必须满足）

仅在以下任一情况时才启用本 Skill：

- 用户输入命令风格前缀，例如：`/external-skill`、`/use-skill`、`/load-skill`；
- 或用户明确说明“手动引入外部 skill / 手动执行某个 skill / 不要自动匹配，按我指定的 skill 来执行”等。

当仅出现模糊语句（如“帮我看看技能”、“自动用合适的技能执行”）时，**不要**启用本 Skill，应由系统的普通技能匹配逻辑决定。

## 标准流程

1. **收集必要信息**
   - 询问或解析出以下至少一项信息：
     - **本地路径**：如 `~/.cursor/skills/foo-bar/SKILL.md`、`.cursor/skills/code-review/SKILL.md`；
     - **Skill 名称**：如 `code-review`、`page-template`（若仅提供名称，需确认搜索范围：当前项目 / 全局）；
     - **外部链接**：如飞书文档 URL、其他可抓取的网页链接；用户提供链接时，将该链接指向的文档内容作为 Skill 使用。

2. **确认来源类型与范围**
   - **链接**：用户提供的是 URL 时，直接进入“读取外部内容”步骤，无需在本地 skill 目录查找；
   - **路径**：按给定绝对/相对路径读取本地 `SKILL.md`；
   - **名称**：若用户说“当前项目里的某个 skill”，只在 `.cursor/skills/**/SKILL.md` 中查找；若说“全局 skill”，只在 `~/.cursor/skills/**/SKILL.md` 中查找；未说明时与用户确认优先级（先项目后全局）。

3. **读取外部 Skill 内容**
   - **本地文件**：用文件读取工具打开目标 `SKILL.md`；可有 YAML frontmatter，也可仅正文；
   - **外部链接（含飞书文档）**：用可用的 fetch/网页抓取工具请求该 URL，将返回的正文（如转成 Markdown 或纯文本）视为 Skill 文档。飞书等文档**不强制要求** YAML frontmatter，只要文档中有清晰的“使用场景、步骤、约束”等说明，即按其中指令执行；
   - 若无法读取（404、无权限、解析失败）或内容完全无法识别为“可执行的指令”，应向用户说明并终止，不要猜测或编造。

4. **遵循外部 Skill**
   - 将外部 Skill 视为当前会话中的高优先级指导文档；
   - 严格按照其中的“使用场景、流程、约束”执行后续操作；
   - 如外部 Skill 与本项目其他规则冲突，以**用户显式指定的外部 Skill** 为主，但需在回复中点明冲突点。

5. **执行完毕后的反馈**
   - 用简短总结说明：
     - 使用了哪个外部 Skill（名称 / 路径 / 链接，如“飞书文档：<url>”）；
     - 按 Skill 完成了哪些关键步骤；
     - 是否有未完成或需要用户继续决策的部分。

## 冲突与安全策略

- 若外部 Skill 要求修改敏感配置（如 CI/CD、密钥文件等），在执行前需再次向用户确认；
- 若同时存在多个同名 Skill（项目内与全局），必须由用户决定优先使用哪一个；
- 若外部 Skill 没有遵循本项目既有的编码、Git 或其他规约，执行时需显式说明“该操作遵循外部 Skill 规则，可能与项目默认规范不完全一致”。

## 不要做的事

- 不要在**没有任何用户显式请求**时主动启用本 Skill；
- 不要在没有成功读取到目标内容（本地文件或链接正文）的情况下“脑补”外部 Skill 的行为；
- 不要自动在多个 Skill 之间做复杂路由，始终由用户明确指定要加载的目标（路径、名称或链接）；
- 外部链接内容若非 Markdown/文本形态（如纯图片、二进制），应明确告知用户无法作为 Skill 解析，而非强行按文本执行。

## 预置外部 Skill（参考链接）

以下链接为本项目内登记的外部 Skill，用户可通过「手动触发 + 指定该链接」加载并执行。执行时用可用工具抓取链接正文，将内容视为 Skill 文档并按其中指令执行。

飞书文档请使用 对应的 feishu mcp尝试访问 如果遇到授权问题 访问不到请提示用户去授权然后再重试

| 用途说明           | 链接 |
|--------------------|------|
| 创建页面 Skill     | https://fiture.feishu.cn/wiki/F6LowFgfoiZhFQkMWsJcyv87nFh |
| 页面模版创建规范 Skill | https://fiture.feishu.cn/wiki/F6LowFgfoiZhFQkMWsJcyv87nFh |
| 创建 React 组件 Skill | https://fiture.feishu.cn/wiki/OfZKwJiWUi7nk5kzjz9cgYqvnrG ｜
| utils 创建与导入规范 Skill | https://fiture.feishu.cn/wiki/SciEwYSMfibFSbkfDbNcatD5nMb |
| API 创建规范 Skill | https://fiture.feishu.cn/wiki/Urhbw6bQmigrDEkU191cmu0bnBd |

- **创建页面 Skill**：飞书文档，用于按规范创建新页面（含路由、目录与模板等）。用户说「用飞书创建页面 skill」「按飞书文档创建页面」或直接提供该链接时，加载该文档内容并按其描述完成页面创建流程。

- **页面模版创建规范 Skill**：飞书文档，用于页面模版创建需遵守的规范。当用户说「按页面模版规范创建」「按飞书页面模版规范」或直接提供该链接时，加载该文档内容并按其描述执行。

- **创建 React 组件 Skill**：飞书文档，用于按规范创建与声明 React 组件。当用户提及 React 组件创建（如「创建 React 组件」「声明 Vue3 组件」「按规范写一个 React 组件」等）、或说「用飞书 React 组件 skill」「按飞书文档创建 React 组件」、或直接提供该链接时，加载该文档内容并按其描述完成 React 组件的创建与声明。

- **utils 创建与导入规范 Skill**：飞书文档，用于规定 utils 函数的创建与导入使用方式。当用户说「按 utils 规范创建/导入」「使用 utils 规范」「按飞书 utils 规范」或直接提供该链接时，加载该文档内容并按其描述执行。

- **API 创建规范 Skill**：飞书文档，用于规范 API 创建的命名、目录与实现方式。当用户说「按 API 规范创建」「用飞书 API 规范」「按飞书文档创建 API」或直接提供该链接时，加载该文档内容并按其描述执行。

