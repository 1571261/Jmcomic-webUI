import { jmApi } from "../api/JmcomicApi.js";
import { ComicImageManager } from "../components/chapter/ComicImageManager.js";
import { CommentManager } from "../components/chapter/CommentManager.js";
import { DownloadBtnManager } from "../components/chapter/DownloadBtnManager.js";
import { HeadManager } from "../components/chapter/HeadManager.js";
import { RecommendationsComicManager } from "../components/chapter/RecommendedComicsManager.js";
import { SeriesManager } from "../components/chapter/SeriesManager.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";
import { errorDom } from "../dom/ErrorDom.js";

class ChapterPage {
    id;
    comicImageManager;
    commentManager;
    downloadBtnManager;
    headManager;
    recommendedComicsManager;
    navManager;
    switchServerBtnManager;
    seriesManager;
    constructor() {}
    async init() {
        const id = new URLSearchParams(location.search).get("id");
        if (!/^\d+$/.test(id ?? "")) {
            document
                .querySelector(".root")
                .innerHTML =
                    errorDom.createErrorDom("缺少或非法的 id 参数");
            return;
        }
        this.id = id;
        setting.init();

        this.navManager = new NavManager();
        this.navManager.init();
        await jmApi.init();

        let history = [];
        try {
            history = JSON.parse(localStorage.getItem("history") ?? "[]");
        } catch {
            localStorage.removeItem("history");
        }
        if (!Array.isArray(history)) history = [];

        this.switchServerBtnManager = new SwitchServerBtnManager();
        this.downloadBtnManager = new DownloadBtnManager();
        this.switchServerBtnManager.init();
        this.downloadBtnManager.init(this.id);

        // 两个请求互不依赖，一起发出去；谁先回来谁先渲染，但两个都等完 init 才结束
        const albumTask = jmApi.getComicAlbum(this.id).then(
            (album) => this.#initAlbum(album, history),
            (err) => {
                document.querySelector(".loading-sakura")?.remove();
                this.#showAlbumError(err);
            },
        );
        const chapterTask = jmApi.getComicChapter(this.id).then(
            (chapter) => {
                this.comicImageManager = new ComicImageManager();
                this.comicImageManager.init(chapter);
            },
            (err) => this.#showError(".comic-img-cr", "章节图片加载失败", err),
        );
        await Promise.all([albumTask, chapterTask]);
    }

    #initAlbum(album, history) {
        this.headManager = new HeadManager();
        this.headManager.init(album);

        this.commentManager = new CommentManager();
        this.commentManager.init(album);

        this.recommendedComicsManager = new RecommendationsComicManager();
        this.recommendedComicsManager.init(album);

        this.seriesManager = new SeriesManager();
        this.seriesManager.init(album);

        const fi = history.findIndex((h) => +h.id === +this.id);
        if (fi > -1) {
            history.splice(fi, 1);
        }
        history.unshift({
            id: this.id,
            addTime: new Date().toLocaleDateString(),
            name: album.name,
            author: album.author,
        });
        if (history.length > 200) {
            history = history.slice(0, 200);
        }
        localStorage.setItem("history", JSON.stringify(history));

        document.querySelector(".loading-sakura")?.remove();
        document
            .querySelector("#wx-title")
            ?.setAttribute("content", album.name);
        document
            .querySelector("#wx-description")
            ?.setAttribute("content", "Yuan " + [].concat(album.author).join(" "));
        document
            .querySelector("#wx-image")
            ?.setAttribute("content", jmApi.getCoverImageURL(album.id));
        document.title = album.name;
    }
    #showAlbumError(err) {
        const titleDom = document.querySelector(".head .title");
        if (titleDom) titleDom.textContent = "加载失败:" + (err?.message ?? String(err));
    }
    #showError(selector, title, err) {
        const container = document.querySelector(selector);
        if (!container) return;
        container.insertAdjacentHTML(
            "beforeend",
            errorDom.createErrorDom(
                `${title}：${err?.message ?? String(err)}`,
            ),
        );
    }
}
const app = new ChapterPage();
app.init().catch((err) => {
    console.error("初始化失败", err);
    document
        .querySelector(".root")
        .insertAdjacentHTML("beforeend", errorDom.createErrorDom(err.message));
});