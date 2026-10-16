# Focus Training

一个本地优先、低刺激、数据可解释的个人专注力训练 Web 应用。它关注持续注意、走神后的恢复、手机冲动延迟、视觉搜索与呼吸觉察，而不是生成没有科学依据的综合分数。

本项目完全在浏览器本地运行，不需要账号或后端服务。欢迎在遵守 MIT 许可证的前提下使用、修改和贡献。

## 技术栈

- React 19 + TypeScript
- Vite / Vinext（Sites 托管构建）
- Tailwind CSS 4 与语义化 CSS
- Recharts
- Vitest

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

生产构建与质量检查：

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## 已实现功能

- Dashboard：今日训练原始指标、最近 7 天趋势与固定训练建议。
- Focus Session：任务与时长设置、时间戳计时、走神记录、手机冲动记录、2 分钟延迟复查、训练报告。
- 舒尔特方格：1–25 随机排列、错误记录、点击间隔、最慢转换、最近/7 天/最佳/20 次趋势。
- 注意训练：5/10/15 分钟呼吸觉察，点击记录注意变化，统计训练时长。
- 认知控制：Stroop 颜色干扰训练与 Go/No-Go 反应抑制训练，记录正确率、反应时、误按和漏按。
- Analytics：7 天、28 天与全部范围，展示可解释指标和趋势图。
- Settings：JSON 导出、结构校验导入、双重确认清除、明暗主题。
- 恢复能力：进行中的专注会话保存开始时间、事件与待复查冲动，刷新后继续。

## 目录结构

```text
app/                         页面入口、布局、全局样式
src/
  components/                通用布局、指标卡、图表卡
  constants/                 训练常量
  features/
    analytics/               数据分析
    dashboard/               首页总览
    focus/                   专注训练与报告
    meditation/              呼吸注意训练
    schulte/                 舒尔特方格
    cognitive/               Stroop 与 Go/No-Go 训练
    settings/                数据与隐私设置
  hooks/                     基于时间戳的计时 hook
  services/                  统一数据访问层
  types/                     TypeScript 数据模型
  utils/                     时间、统计、ID、舒尔特算法
```

## 数据保存与隐私

训练数据保存在浏览器 `localStorage` 中，由 `src/services/storage.ts` 统一读写。组件不直接操作训练数据键，方便未来迁移到 IndexedDB。当前版本没有账号、云数据库、广告 SDK、行为分析或 AI API，也不会把训练数据上传到服务器。

导出文件采用版本化结构（当前 `schemaVersion: 2`）；导入时会校验顶层集合与核心字段。旧版 `schemaVersion: 1` 数据会自动迁移并保留。清除数据需要连续确认两次。

## 统计口径

- 每小时走神次数 = 走神记录数 ÷ 实际专注小时数
- 每小时手机冲动次数 = 手机冲动数 ÷ 实际专注小时数
- 手机冲动转化率 = 实际查看手机次数 ÷ 手机冲动次数
- 舒尔特错误率 = 错误点击数 ÷ 全部点击数

所有指标保持独立展示，不合成为“专注力分数”。主观专注质量始终标记为主观评分。

## 测试

Vitest 覆盖计时器时间戳计算、存储读写、JSON 导入导出、手机冲动转化率、每小时走神次数、日期范围筛选、舒尔特随机排列和点击顺序判断，以及认知控制训练的核心逻辑。

## 贡献

欢迎提交 Issue 或 Pull Request。修改前请先运行测试、类型检查、代码检查和生产构建。

## 许可证

[MIT](LICENSE) © 2026 kkkul191
