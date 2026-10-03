# 口语

面向高校英语课堂的口语训练设计体验版，提供独立的学生学习空间和教师工作台。完整设计见 [DESIGN.md](DESIGN.md)。

可体验：基础诊断推荐、三类场景、合成语音精听、真实本地录音与回放、生词收藏、文字角色扮演、复盘提交、教师发布任务和时间点批阅、线下活动计时。

统计由实际操作产生，不提供虚构的能力分数。角色切换用于原型体验，不是身份验证。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

`npm run check` 执行生产构建与学习闭环测试。`npm run dev` 构建并在 `http://127.0.0.1:5173` 预览；修改源码后重新构建、刷新页面。

## Cloudflare Pages

项目包含 `wrangler.toml` 和 SPA 重定向配置，可通过以下命令部署：

```bash
npx wrangler pages deploy dist --project-name kouyu
```

进度、任务和点评保存在 localStorage，录音保存在 IndexedDB；不上传服务器，不跨设备同步。浏览器清除网站数据后记录会丢失。录音要求 HTTPS 或 localhost，需用户授权麦克风。语音示范由浏览器 speechSynthesis 提供，部分设备需安装英语语音。

尚未接入：真实账号和班级权限、AI 语音识别/评分/对话、资源上传与在线音视频课堂。文字对话使用显式规则，只演示沟通目标流程。Cloudflare 发布状态需以实际部署结果为准。
