# 口语

面向高校英语课堂的口语训练平台 MVP。项目将竞品调研中的主要需求实现为可交互前端：能力画像、个性化路径、精听训练、跟读纠音、AI 情景对话和教师课堂概览。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## Cloudflare Pages

项目包含 `wrangler.toml` 和 SPA 重定向配置，可通过以下命令部署：

```bash
npx wrangler pages deploy dist --project-name kouyu
```

当前版本是前端 MVP，数据和 AI 反馈均为演示数据。接入真实账号、语音识别、模型服务与数据库前，请补充隐私授权、数据保存期限和模型评测标准。
