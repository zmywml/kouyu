# 口语

面向高校英语课堂的口语训练应用。前端和 API 运行在 Cloudflare Worker，静态资源由 Workers Assets 提供，班级、学生、学习进度、任务、草稿、作业提交和批改结果保存在 D1。

完整项目介绍和操作手册见 [PROJECT_GUIDE.md](PROJECT_GUIDE.md)，产品设计见 [DESIGN.md](DESIGN.md)。

## 架构

- Cloudflare Worker：页面路由、业务 API、教师身份验证及 SiliconFlow 代理。
- Workers Assets：托管 `dist` 中的 React 静态资源。
- D1：保存账号、教师、班级、学生、进度、任务、录音草稿元数据、作业和批改结果。
- Cloudflare Secrets：保存 `SESSION_SECRET`、`TEACHER_TOKEN` 和可选的 `SILICONFLOW_API_KEY`。
- Workers KV：私有保存真实录音 Blob，播放和下载必须经过 Worker 权限校验。
- IndexedDB：保留录音的本机缓存，在网络异常时仍可回放。

账号密码使用独立随机盐和仅服务端持有的 `SESSION_SECRET`（pepper）生成 HMAC-SHA256 哈希，避免 Pages/Workers 紧 CPU 配额导致登录执行异常。Worker 登录成功后签发 8 小时 HttpOnly、Secure、SameSite 会话 Cookie。仓库不保存初始明文密码；更换 `SESSION_SECRET` 时需要同步重置账号密码哈希。

## 本地开发

复制 `.dev.vars.example` 为 `.dev.vars`，填写本地开发密钥，然后运行：

```bash
npm install
npm run db:migrate:local
npm run dev
```

Wrangler 会同时启动 Worker、D1 和静态资源服务。

## 测试与构建

```bash
npm run check
npm audit --audit-level=high
```

## Cloudflare 部署

首次部署前创建 D1 和 KV 命名空间、写入 `wrangler.toml` 的资源 ID，并配置 Secrets：

```bash
npx wrangler d1 migrations apply kouyu-production --remote
npx wrangler kv namespace create kouyu-audio
npx wrangler secret put SESSION_SECRET
npx wrangler secret put TEACHER_TOKEN
npx wrangler secret put SILICONFLOW_API_KEY
npm run deploy
```

`SILICONFLOW_API_KEY` 为可选项；未配置时 AI 接口返回明确的未配置状态，不会伪造反馈。生产环境不得将任何 Secret 写入仓库或前端代码。

## 数据边界

学习进度和课堂业务数据通过 D1 同步。登录学生账号后，录音文件会上传到私有 KV，并在当前浏览器的 IndexedDB 中保留缓存；未登录访客的录音只保存在本机。学生只能读取自己的录音，教师只能读取本班已提交作业的录音。当前没有语音识别或发音评分，文字对话使用显式规则，不展示模拟能力分数。
