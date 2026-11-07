import { jmApi } from "../../api/JmcomicApi.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js";
import { comicDom } from "../../dom/ComicDom.js";

export class SearchContainerManager {
    containerDom;
    scrollContainer;
    searchQuery;
    searchMode = "mv";
    SEARCHMODE = {
        mostViews: "mv",
        mostLikes: "tf",
        day: "mv_t",
        addTime: "",
    };
    /*
    categoryOrderList: [
        { title: '最新', value: '' },
        { title: '最多爱心', value: 'tf' },
        { title: '总排行', value: 'mv' },
        { title: '月排行', value: 'mv_m' },
        { title: '周排行', value: 'mv_w' },
        { title: '日排行', value: 'mv_t' },
      ]
     */
    searchModeDom;
    abortController;
    constructor(sq) {
        this.searchQuery = sq;
        this.containerDom = document.querySelector(".search-cr");
        this.searchModeDom = document.querySelector(".sort");
        this.loadingIconDom = document.querySelector(".loading-icon");
        this.scrollContainer = new InfinityScrollContainer({
            container: this.containerDom,
            threshold: 100,
            coolingTime: 500,
            loadContent: (page) => this.loadContent(page),
        });
    }
    debounce(func, wait, context) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    _research() {
        lazyLoader.clear();
        this.scrollContainer.reset();
    }
    research = this.debounce(this._research, 300, this);
    init() {
        this.scrollContainer.init();
        this.#addEvent();
    }
    async loadContent(page) {
        this.loadingIconDom.style.display = "block";

        this.abortController?.abort();
        this.abortController = new AbortController();

        let album = Promise.resolve();
        if (
            page === 1 &&
            Number.isInteger(+this.searchQuery) &&
            +this.searchQuery > 10
        ) {
            album = jmApi.getComicAlbum(
                this.searchQuery,
                this.abortController.signal,
            ).catch(()=>{console.log("没有搜索到这个id的本子");
            });
        }
        let list = jmApi.getSearchResults(
            this.searchQuery,
            page,
            this.searchMode,
            this.abortController.signal,
        );

        Promise.all([album, list]).then(([album, list]) => {
            this.loadingIconDom.style.display = "none";
            if (album?.name) {
                let crDom = this.#getComicsCr([album]);
                this.containerDom.appendChild(crDom);
                lazyLoader.addCover(crDom.querySelector(".cover"));
            }

            this.scrollContainer.maxPageIndex = Math.ceil(list.total / 80);
            let crDom = this.#getComicsCr(list.content);
            this.containerDom.appendChild(crDom);
            const covers = crDom.querySelectorAll(".cover");
            for (let cover of covers) {
                lazyLoader.addCover(cover);
            }
        }).catch((err)=>{
            if(err.name === "AbortError"){
                console.log("竞态拦截：",this.searchQuery,this.searchMode);
            }
            throw err
        });
    }
    #addEvent() {
        let items = this.searchModeDom.children;
        for (let i = 0; i < items.length; i++) {
            items[i].addEventListener("click", () => {
                items[i].style.display = null;
                let item = items[(i + 1) % items.length];
                this.searchMode = this.SEARCHMODE[item.dataset.mode];
                item.style.display = "block";
                this.research();
            });
        }
        this.containerDom?.addEventListener("click", (e) => {
            let aDom = e.target.parentNode || e.target;
            if (aDom.tagName === "A") {
                e.preventDefault();
                localStorage.setItem("lastClickComic", aDom.dataset.comic);
                location.href = aDom.href;
            }
        });
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
}
