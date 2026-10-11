# jmViewer

一个**纯静态**的漫画浏览前端：界面数据全部来自线上接口，本地没有后端、没有构建步骤、没有 npm 依赖。把仓库克隆下来，用任意静态服务器打开 `index.html` 就能跑。

> 仓库地址：<https://github.com/zrhcdy/Jmcomic-webUI>

---

## 快速开始

**不能用 `file://` 直接双击打开 HTML** —— 项目用的是原生 ES Module，浏览器会以 CORS 为由拒绝加载，`fetch` 也一样。必须走 HTTP 服务。

任选一种起服务的方式，在项目根目录执行：

```bash
# VS Code：装 Live Server 插件，右键 index.html → Open with Live Server（默认 5501 端口）

# 或者 Python
python -m http.server 5501

# 或者 Node
npx serve -l 5501
```

然后访问 <http://127.0.0.1:5501/index.html>。

> 端口随便，5501 只是开发时用的习惯值。页面之间的跳转全是相对路径，换端口不用改代码。

**环境要求**：只要求一个较新的浏览器（需要支持 `IntersectionObserver`、`createImageBitmap`、可选链等）。不需要 Node.js、不需要 npm install —— `src/utils/jszip.min.js` 已经作为普通文件随仓库提供。

---

## 页面一览

| 页面 | 入口脚本 | 说明 |
| --- | --- | --- |
| [index.html](index.html) | [src/pages/index.js](src/pages/index.js) | 首页：热门轮播、标签快捷入口、推广推荐位 |
| [latest.html](latest.html) | [src/pages/latest.js](src/pages/latest.js) | 最新更新，滚动到底自动加载下一页 |
| [categories.html](categories.html) | [src/pages/categories.js](src/pages/categories.js) | 分类浏览：分类选择 + 排序筛选，同样无限加载 |
| [search.html](search.html) | [src/pages/search.js](src/pages/search.js) | 搜索，地址栏参数 `?sq=关键词` |
| [chapter.html](chapter.html) | [src/pages/chapter.js](src/pages/chapter.js) | 章节阅读页：作品信息、章节列表、图片阅读、评论、下载入口 |
| [favorite.html](favorite.html) | [src/pages/favorite.js](src/pages/favorite.js) | 收藏列表（存在本地） |
| [history.html](history.html) | [src/pages/history.js](src/pages/history.js) | 浏览历史（存在本地） |
| [setting.html](setting.html) | [src/pages/setting.js](src/pages/setting.js) | 设置：图片预加载边距、主题配色、并发请求 |
| [download.html](download.html) | [src/pages/download.js](src/pages/download.js) | 下载页：`?id=作品id&mode=longimg\|zipper` |

### 各页面的参数

- **search.html** — `?sq=关键词`。如果关键词是一个大于 10 的纯整数，会先把它当作品 ID 直接查一次作品并置顶（方便直接粘 JM 号），再照常出搜索结果。
- **chapter.html** — `?id=作品id`。如果这部作品有多话，章节列表按 `album.series` 的顺序渲染；只有一话时就是作品本身。
- **download.html** — `?id=作品id&mode=longimg|zipper`，两个参数都会校验，非法值直接报错。

---

## 目录结构

```
.
├── index.html / latest.html / categories.html / search.html
├── chapter.html / favorite.html / history.html / setting.html
├── download.html
├── image/                        静态图标（封面占位、hot、looking）
├── style/                        每个页面一个 CSS + 一个 basic.css（全局与主题变量）
│   ├── basic.css                 全局样式 + 6 套主题的全部颜色变量
│   ├── index.css  chapter.css  categories.css  favorite.css
│   ├── history.css  latest.css  search.css  setting.css  download.css
└── src/
    ├── api/
    │   ├── JmcomicApi.js         接口封装（唯一对外出口 jmApi）
    │   └── Crypto.js             接口数据的解密
    ├── utils/
    │   ├── crypto.js             CryptoJS（供 Crypto.js 使用）
    │   └── jszip.min.js          JSZip 3.10.1（打包 zip 用）
    ├── dom/
    │   └── LazyLoader.js         封面图懒加载
    ├── pages/                    每个 HTML 对应一个入口脚本
    ├── components/               按页面/职责拆分的 UI 组件
    │   ├── general/              Setting、NavManager、Queue、ImageCutter、
    │   │                         SwitchServerBtnManager、ServerSpeedTester、
    │   │                         InfinityScrollContainer、Carousel
    │   ├── index/                BannerManager、TagContainerManager、RecommendationsManager
    │   ├── latest/ categories/ search/ favorite/ history/
    │   ├── chapter/              HeadManager、SeriesManager、ComicImageManager、
    │   │                         ComicImageLoader、CommentManager、Evaluation、
    │   │                         ReadingProgress、RecommendedComicsManager、DownloadBtnManager
    │   └── download/             ComicImageFetcher、LongImageMaker、ZipPacker
    └── ...
```

每个 HTML 的 `<body>` 第一个子元素都是一小段同步脚本（见[主题](#主题)），紧接着才是页面结构。

---

## 功能说明

### 导航与图源

每个页面顶部都有同一套导航：桌面端 `.nav`（首页 / 最新 / 分类 ｜ 收藏 / 历史 / 设置 + 搜索框），移动端 `.mob-nav`（汉堡菜单）。这两块由 [NavManager.js](src/components/general/NavManager.js) 统一接管，搜索框提交后跳 `search.html?sq=`。

导航右侧的「图源 N」是图片服务器切换（共 6 条线路），由 [SwitchServerBtnManager.js](src/components/general/SwitchServerBtnManager.js) 处理，选中的线路记在 `localStorage`，所有图片链接都跟着它走。

不知道选哪条的时候，去设置页点一下[图片服务器测速](#图片服务器测速)，它会把这 6 条线路挨个量一遍，并把最快的那条直接切上。

### 阅读体验

章节页 [ComicImageManager.js](src/components/chapter/ComicImageManager.js) 按 `chapter.images` 生成占位容器，[ComicImageLoader.js](src/components/chapter/ComicImageLoader.js) 用 `IntersectionObserver` 逐张加载：滚动到附近才开始下载，加载完更新顶部与移动端的阅读进度。预加载的提前量就是设置里的「图片预加载边距」。

作品信息（封面 / 标题 / 作者 / 收藏按钮）、章节列表、点赞与浏览量、评论区、相关推荐分别由 `HeadManager`、`SeriesManager`、`Evaluation`、`CommentManager`、`RecommendedComicsManager` 填充。

### 收藏与历史

两者都只存在浏览器本地（`localStorage`），没有账号系统。章节页的收藏按钮写入 `favorite`，浏览章节时写入 `history`。

### 主题

见下方[主题](#主题)一节。

### 下载

见下方[下载功能](#下载功能)一节。

---

## 设置项

设置由 [Setting.js](src/components/general/Setting.js) 统一管理（单例 `setting`）。它有一份白名单，只有白名单里的键值才允许读写 —— 设置项的合法取值由代码裁定，HTML 里的选项只是把可选值画出来。

设置页的选项元素**全部写在 [setting.html](setting.html) 里**，统一用 `option-list` + `option-item` 两个类名，值放在 `data-value` 上，要写哪个设置项看列表上的 `data-key`：

```html
<div class="option">
    <span>标题: </span>
    <div class="option-list" data-key="app_theme">
        <div class="option-item" data-value="pink">…</div>
    </div>
</div>
```

[setting.js](src/pages/setting.js) 里没有一行硬编码的设置清单，点一下就是把 `data-value` 写进 `data-key`。所以**加一个设置项只需要改两处**：`setting.html` 的选项元素 + `Setting.js` 的白名单与 getter（`data-key` 必须能在 `setting` 上取到同名值）。主题是唯一需要立刻改变外观的设置项，切换时另外替换 `<html>` 上的 `${值}-theme` 类。

| 键（localStorage） | 可选值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `using_imgserver_index` | `"0"` ~ `"5"` | `"0"` | 使用第几条图片服务器线路（对应导航上的「图源 N」，也可以让[测速](#图片服务器测速)自动挑） |
| `app_theme` | `pink` `blue` `green` `purple` `gray` `dark` | `pink` | 配色主题 |
| `root_margin` | `0px` `50px` `100px` `200px` `500px` | `50px` | 图片懒加载的预加载边距，越大越早开始加载 |
| `concurrent_request` | `off` `on` | `off` | 并发请求：同时向所有服务器发起同一个请求，只保留最快返回的那个（见[并发请求](#并发请求)） |
| `lite_mode` | `off` `on` | `off` | 精简模式：首页不加载横幅轮播与标签区，少发一批请求（见[精简模式](#精简模式)） |

> 注意：`root_margin` 是在创建 `IntersectionObserver` 时读取的，而 `rootMargin` 一旦创建就不能修改 —— **改完设置要重新进一次章节页才生效**。

`setting.init()` 会在读取时校验本地存的值：合法就采用，非法就把它改回默认值。

### 并发请求

开启后，[JmcomicApi.js](src/api/JmcomicApi.js) 里的 `retryFetch` 会走一条并发分支：把原本「第一个服务器失败再试下一个」的顺序重试，改成**同时把所有候选服务器都请求一遍**，谁先成功返回就用谁，其余请求立刻被 `AbortController` 取消。

- **只对「按序号拼出不同服务器地址」的调用生效** —— 作品信息、章节列表、搜索、最新、分类、评论。传固定 URL 的调用（例如图片下载）每次重试都是同一个地址，并发没有意义，仍然走顺序重试。
- 适合图源线路不稳定、有几条线路特别慢的情况：省掉「等第一个超时」的等待。
- 代价是**一次请求会打出好几倍的流量**，也可能触发服务器限流。所以**默认关闭**。
- 该设置在每次发起请求时重新读取，**改完立即生效，不用刷新页面**。

### 精简模式

开启后首页不再加载顶部的横幅轮播与标签区：[index.html](index.html) 里直接用 `localStorage.getItem("lite_mode")` 把 `.banner` 与 `.tag-cr` 隐藏掉（同步脚本，不会先闪一下再消失），[index.js](src/pages/index.js) 也不再创建 `BannerManager` 与 `TagContainerManager`，省掉它们各自的接口请求。

这个设置是**每个页面各写一段同步脚本**实现的效果 —— 页面结构上的取舍没法由一个统一的管理器代劳。设置页仍然只是把 `data-value` 写进 `data-key`，没有为它多加一行代码。

### 图片服务器测速

设置页的「图片服务器测速」会向全部 6 台图片服务器**同时**请求同一张图（章节 `1479091` 的第 1 张图 `00001.webp`），比出各自的实际加载耗时，测完自动切到最快的那台。由 [ServerSpeedTester.js](src/components/general/ServerSpeedTester.js) 实现。

- **用 `<img>` 而不是 `fetch`**：图床不一定返回 CORS 头，`fetch` 会被浏览器拦下报错，可图片本身其实加载得动 —— 那样测出来的是「能不能跨域」而不是「快不快」。也正是因为这个原因**没有**设置 `crossOrigin`。
- **避免缓存**：每台的地址都挂了一个唯一查询参数（`_t=<时间戳>_<序号>`），浏览器和中间的缓存都会把它当成一张全新的图。
- **6 台同时起跑，所以最先加载完的那台就是最快的** —— 界面一收到结果就立刻把 `using_imgserver_index` 切过去，并同步导航上的「图源 N」，不用等最慢的那台。
- 单台超过 8 秒算「超时」（换成一个空图让浏览器放弃这次请求），加载报错算「加载失败」。
- 结果条目可以点，手动切到任意一台；切换**不刷新页面**，方便对着结果反复比。

测速写的还是 `using_imgserver_index` 这一个设置项，本身不新增 `localStorage` 键。

---

## 主题

界面里的所有颜色都走 CSS 变量，不再有硬编码色值。变量集中定义在 [style/basic.css](style/basic.css) 顶部的 `.pink-theme, :root { … }`，每套主题 **49 个变量**。

- `:root` 与 `.pink-theme` 并列，所以**没有任何主题类时就是粉色**（默认主题，兜底）。
- 另外 5 套是同优先级的类选择器，写在 `:root` 之后：`.blue-theme`、`.green-theme`、`.purple-theme`、`.gray-theme`、`.dark-theme`。
- 切换时只改 `document.documentElement` 的类名：先摘掉旧主题类，再加 `{theme}-theme`。

**避免主题闪烁**：每个 HTML 的 `<body>` 第一个子元素都有一段同步脚本：

```html
<script>
    // 应用已保存的主题，避免页面先以默认主题渲染再变色
    (function () {
        const theme = localStorage.getItem("app_theme");
        if (theme) document.documentElement.classList.add(theme + "-theme");
    })();
</script>
```

它是普通（非 module）脚本，会同步阻塞执行，位置又在 body 最前面，因此在内容解析/绘制之前就已经把主题类打好了；而 head 里阻塞渲染的 CSS 已经就绪，所以不会出现「先粉一下再变色」。module 脚本是 defer 的，做不到这一点 —— 这也是它单独写成一段而不是放进入口脚本的原因。

这段脚本**刻意不做白名单校验**：写入端 `setting.setOption` 已经校验过了；就算本地存了个非法值，也只是拼出一个匹配不到任何规则的无害类名，`:root` 的粉色依然兜底。好处是新增主题时不用动 8 份 HTML。

**调整配色**：想改配色，改 [style/basic.css](style/basic.css) 里对应主题块的变量即可，不用碰其它 CSS。

---

## 下载功能

### 入口

章节页作者名下面有一个「下载」按钮（[DownloadBtnManager.js](src/components/chapter/DownloadBtnManager.js)），点开选「长图」或「压缩包」，会带着当前作品的 id 跳到：

```
download.html?id=<作品id>&mode=<longimg | zipper>
```

这个按钮只依赖地址栏里的 `id`，**不等待接口返回**，所以作品信息还没加载出来（甚至加载失败）时也能用。

### 两种模式

下载页会列出这部作品的所有章节，默认全选，也可以逐章勾选。

| 模式 | 产物 | 说明 |
| --- | --- | --- |
| `longimg` | `作品名_章节N.jpg` | 每章拼成一张竖长图。超过浏览器 canvas 上限时自动切成 `作品名_章节N_1.jpg`、`_2` … |
| `zipper` | `作品名.zip` | 所选章节打进一个压缩包，条目为 `章节N/001.jpg` |

两种模式输出都是 **JPEG**（长图走 canvas 重编码）。处理过程中会显示进度、逐条日志，可以中途取消；单章失败只记日志跳过，连续 3 章失败才认定是全局问题并中止（比如线路挂了或被跨域拦了）。

### 为什么不能直接存原图

图片服务器上的图有一部分是**打乱过的**：站点把原图横向切片重排，同时用 CSS 把 `img` 涂黑（`.comic-img img { filter: brightness(0) }`）当防抓手段，只有站点自己用 canvas 还原出来的画面才看得见。所以下载时：

- 满足「章节 id ≥ 220980 且扩展名不是 `.gif`」的图片，必须用 canvas 按同样的规则重排切片再导出；
- 其余图片（老章节、gif）原本就是对的，**直接存原始字节**（顺带保住 gif 动图）。

解扰逻辑在 [ImageCutter.js](src/components/general/ImageCutter.js)，下载侧复用它。

### 关于 CORS

这是整个下载功能**最大的不确定因素**：图片必须先 `fetch` 成 blob、再喂给 `<img>`/canvas，否则 canvas 会被污染（tainted），导出时直接抛 `SecurityError`。这要求图片 CDN 返回允许跨域的响应头。

如果哪条图源线路没回 CORS 头，该线路下长图与压缩包两种模式都会失败（日志里能看到明确的报错，而不是静默出错）。遇到这种情况，换一条图源试试。

### JSZip

zip 由 [JSZip 3.10.1](src/utils/jszip.min.js)（UMD 版）生成，[download.html](download.html) 用普通 `<script>` 引入后读 `window.JSZip`。

图片本身已经是压缩格式，再 deflate 一遍几乎压不了多少、只白烧 CPU 和内存，所以 **图片条目一律用 STORE 存储**；压缩包的默认算法仍是 DEFLATE，留给非图片文件。

如果这个文件丢了或需要升级，重新下载一份放回原位即可：

```bash
curl -L -o src/utils/jszip.min.js https://unpkg.com/jszip@3.10.1/dist/jszip.min.js
# 3.10.1 的完整大小应为 97630 字节
```

[download.html](download.html) 里还留了一条同步的 CDN 兜底（本地文件加载失败时用 `document.write` 补一个 unpkg 的 `<script>`），正常运行不会走到。

---

## 技术实现要点

- **无框架、无打包**：所有脚本都是原生 ES Module，用相对路径直接 `import`。改完代码刷新页面即可，没有编译步骤。
- **组件按页面分目录**：`src/components/<page>/`，通用组件放 `src/components/general/`，每个 HTML 只引一个 `src/pages/*.js` 入口。
- **接口层单一出口**：业务代码只用 `jmApi`（[JmcomicApi.js](src/api/JmcomicApi.js)）的方法，它统一处理鉴权参数、地址解密、失败重试。`jmApi.init()` 会先取一个时间戳作为密钥、算出 access token，再拉取服务器列表。失败重试有两种模式：默认按服务器顺序逐个重试，也可以在设置里打开[并发请求](#并发请求)，改成同时请求所有服务器、取最快的一个。
- **懒加载 + 提前量**：封面图由 [LazyLoader.js](src/dom/LazyLoader.js)（`IntersectionObserver`）加载；章节图片由 `ComicImageLoader` 加载，并用 `Queue` 限制并发，队列长度会根据时间段动态调整。
- **无限滚动**：列表页都复用 [InfinityScrollContainer.js](src/components/general/InfinityScrollContainer.js) —— 触底自动加载下一页，带 1 秒冷却与页码上限（搜索每页 80 条）。
- **本地数据**：收藏、历史、设置、推广位缓存都存在 `localStorage`，没有服务端。

---

## 已知问题

1. **[src/pages/main.js](src/pages/main.js) 是废弃文件**。它 import 的是 `../components/main/*`，但这个目录并不存在（实际目录是 `components/index/`），而且没有任何 HTML 引用它。直接访问会 404，建议删除。
2. **`.dsh_probe_raw.txt`** 是开发过程留下的空文件，可以删。
3. **标语动画没有生效**。[style/setting.css](style/setting.css) 里 `.slogan` 声明了 `animation: slogan-glow 2.4s ease-in-out infinite`，但文件里已经没有 `@keyframes slogan-glow` 了，所以动画规则被浏览器忽略，只剩静态的 `text-shadow` 光晕。补回 keyframes 即可恢复呼吸效果。
4. **图床 CORS 未经验证**（见[关于 CORS](#关于-cors)），会直接影响下载功能。
5. 章节页头部（`.head`）在小屏下用 `min-height` 而不是固定高度，这是为了让作者名下的下载按钮不会被顶出容器 —— 如果你的改动让头部塞进更多元素，注意这个约束。

---

## 免责声明

- 本项目只是一个**界面**，不含任何内容；所有漫画数据、图片都来自第三方接口，与项目作者无关。
- 请遵守你所在地区的法律法规，以及内容来源方的服务条款。
- 下载功能仅供个人备份离线阅读使用，请勿二次传播或用于任何商业用途。
- 如有侵权，请联系删除。
