# jmViewer

纯静态漫画浏览前端，无后端、无构建、无 npm 依赖。数据全部来自线上接口。

> 仓库：<https://github.com/zrhcdy/Jmcomic-webUI>

## 快速开始

必须走 HTTP 服务（原生 ES Module 不支持 `file://`），在 `project/` 目录下：

```bash
python -m http.server 5501        # 或 npx serve -l 5501
```

访问 <http://127.0.0.1:5501/index.html>。只需较新浏览器（`IntersectionObserver`、可选链），无需 Node.js。

## 页面

| 页面 | 说明 |
| --- | --- |
| `index.html` | 首页：轮播、标签、推荐 |
| `latest.html` | 最新更新，无限滚动 |
| `categories.html` | 分类浏览 + 排序 |
| `search.html` | 搜索，`?sq=关键词`；纯数字自动当 ID 查 |
| `chapter.html` | 章节：信息、图片阅读、评论、下载入口，`?id=` |
| `favorite.html` / `history.html` | 收藏 / 历史（仅本地） |
| `setting.html` | 设置 |
| `download.html` | 下载，`?id=&mode=longimg\|zipper` |

每个页面对应一个入口脚本：`src/pages/<页面名>.js`。

## 目录结构

```
project/
├── *.html
├── image/
├── style/                 basic.css（全局 + 主题变量）+ 各页 CSS
└── src/
    ├── api/               JmcomicApi.js、Crypto.js
    ├── utils/             CryptoJS、jszip.min.js
    ├── dom/               LazyLoader、ErrorDom
    ├── pages/             页面入口脚本
    └── components/        按页面分目录，general/ 为通用组件
```

## 主要功能

- **导航与图源切换**：NavManager 统一管理桌面/移动导航；6 条图源线路可多选，图片按轮询分配，至少保留一条。
- **阅读**：`IntersectionObserver` 懒加载图片；作品信息与图片列表并行请求，互不阻塞。
- **全屏阅读器**：支持横竖屏、宽度调节、进度条、键盘翻页，`Esc` 退出。
- **收藏与历史**：纯 `localStorage`，无账号。
- **接口重试**：两层重试。内层服务器轮询（可选并发，`Promise.any` 取最快）；外层最多 3 次，覆盖状态码异常、解密失败等，重试前自动刷新密钥。
- **无限滚动**：所有列表页复用 `InfinityScrollContainer`，触底加载，失败回滚页码。
- **错误处理**：统一错误块，提供重新加载 / 返回首页 / 清除存储按钮。

## 设置

由 `Setting.js` 管理，带白名单校验。新增项只需改 HTML 选项元素 + Setting.js 白名单与 getter。

| 键 | 可选值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `app_theme` | pink / blue / green / purple / orange / deep-orange / gray / dark | `pink` | 配色主题 |
| `using_imgserver_index` | `"0"`~`"5"` 多选 | `["1","5"]` | 启用的图源线路 |
| `root_margin` | `0px`~`2000px` | `50px` | 懒加载预加载边距 |
| `concurrent_request` | off / on | `on` | 并发请求：向所有服务器同时发请求取最快 |
| `lite_mode` | off / on | `off` | 精简模式：首页不加载横幅与标签区 |
| `cover_img_mode` | dynamic / fixed5 | `fixed5` | 封面图源策略 |
| `reader_is_horizontal` | off / on | `off` | 阅读器默认横屏 |
| `reader_image_width` | `"50"`~`"100"` | `"50"` | 阅读图片宽度百分比 |
| `auto_fullscreen_reader` | off / on | `off` | 点「开始阅读」直接进全屏 |
| `hide_server_switch` | off / on | `off` | 隐藏图源切换按钮 |

设置页提供图片服务器测速，向 6 台同时请求同一张图，自动切到最快。

## 主题

颜色全部走 CSS 变量，定义在 `style/basic.css`。切换改 `documentElement` 类名。每个 HTML 的 `<body>` 顶部有同步脚本在解析前打好主题类，避免闪烁。`:root` 粉色兜底。

## 下载

支持「长图」和「压缩包」两种模式，输出 JPEG。部分站点图片需 canvas 还原（逻辑见 `ImageCutter.js`）。图片需先 `fetch` 为 blob，依赖图源返回 CORS 头。JSZip 本地已提供。

## 技术要点

- 原生 ES Module，无框架无打包，改完刷新即可
- 接口层单一出口 `jmApi`，统一鉴权、解密、重试
- 懒加载 + 队列限流 + 无限滚动
- 本地数据全在 `localStorage`

## 免责声明

本项目仅为界面，不含任何内容；数据与图片均来自第三方接口，与作者无关。请遵守当地法律法规与内容来源方服务条款。下载功能仅供个人离线备份，请勿二次传播或商用。如有侵权请联系删除。