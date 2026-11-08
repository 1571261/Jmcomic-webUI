import { jmApi } from "../../api/JmcomicApi.js";
import { comicDom } from "../../dom/ComicDom.js";
import { errorDom } from "../../dom/ErrorDom.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js";

export class LatestContainerManager {
    containerDom;
    scrollContainer;
    loadingIconDom;
    constructor() {
        this.containerDom = document.querySelector(".latest-cr");
        this.loadingIconDom = document.querySelector(".loading-icon");
        this.scrollContainer = new InfinityScrollContainer({
            container: this.containerDom,
            threshold: 300,
            coolingTime: 500,
            loadContent: (page) => this.loadContent(page),
            onPageEnd: (page) => this.onPageEnd(page),
        });
    }
    init() {
        this.scrollContainer.init();
        this.#addEvent();
    }
    async loadContent(page) {
        let list = await jmApi.getLatestContent(page).catch((err) => {
            document
                .querySelector(".root")
                .insertAdjacentHTML(
                    "beforeend",
                    errorDom.createErrorDom("加载失败，"),
                );
            throw err;
        });
        let crDom = this.#getComicsCr(list);
        this.containerDom.appendChild(crDom);
        const covers = crDom.querySelectorAll(".cover");
        for (let cover of covers) {
            lazyLoader.addCover(cover);
        }
    }
    onPageEnd(page) {
        this.loadingIconDom.style.display = "none";
    }
    #getComicsCr(list) {
        const cr = document.createElement("div");
        cr.className = "comics-cr";
        cr.innerHTML = this.#getComicsHTML(list);
        return cr;
    }
    #getComicsHTML(list) {
        return list.map((c) => comicDom.createComicItemHTML(c)).join("");
    }
    #addEvent() {
        this.containerDom?.addEventListener("click", (e) => {
            let aDom = e.target.parentNode || e.target;
            if (aDom.tagName === "A") {
                e.preventDefault();
                localStorage.setItem("lastClickComic", aDom.dataset.comic);
                location.href = aDom.href;
            }
        });
    }
}
