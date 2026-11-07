import { jmApi } from "../../api/JmcomicApi.js";
import { comicDom } from "../../dom/ComicDom.js";
// import { domManager } from "../../dom/DomManager.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { SectionCarousel } from "./SectionCarousel.js";
export class RecommendationsManager {
    recommendationsDom;
    secComics;
    constructor() {}
    async init() {
        const promotionData = await jmApi.getPromotionContent()
        console.log(promotionData);
        //忽略小说板块
        if(promotionData.length == 0){
            throw new Error("暂无数据");
        }
        this.recommendationsDom = this.#getRecommendationsDom(
            promotionData.slice(0, promotionData.length - 1),
        );
        document.querySelector(".root").appendChild(this.recommendationsDom);
        this.secComics =
            this.recommendationsDom.querySelectorAll(".sec-comics");
        this.secComics.forEach((container) => {
            new SectionCarousel().init(container);
            let covers = container.querySelectorAll(".cover");
            for (let i = 0; i < covers.length; i++) {
                lazyLoader.addCover(covers[i]);
            }
        });
        this.#addEvent();
    }
    #getRecommendationsDom(data) {
        let recommendationsDom = document.createElement("div");
        recommendationsDom.className = "recommendations";
        let innerHTML = "";
        for (let sectionData of data) {
            let section = `
                <div class="section">
                    <div class="s-title">
                        <span>
                            <p>${sectionData.title.length > 10 ? sectionData.title.substring(0, 4) : sectionData.title}</p>
                        </span>
                    </div>
                    <div class="sec-comics">
                        <div class="sc-inner">
                            ${this.#getSecComicsHTML(sectionData.content)}
                        </div>
                    </div>
                    <div class="controls">
                        <div class="l-btn">&lAarr;</div>
                        <div class="r-btn">&rAarr;</div>
                    </div>
                    <div class="show-list-btn" title="以列表的形式显示">Show List...</div>
                </div>
            `;
            innerHTML += section;
        }
        recommendationsDom.innerHTML = innerHTML;
        return recommendationsDom;
    }
    #getSecComicsHTML(list) {
        return list.map((c)=>comicDom.createComicItemHTML(c)).join("")
    }
    #addEvent(){
        this.recommendationsDom?.addEventListener("click", (e) => {
            let aDom = e.target.parentNode || e.target;
            if (aDom.tagName === "A") {
                e.preventDefault();
                localStorage.setItem("lastClickComic", aDom.dataset.comic);
                location.href = aDom.href;
            }
        });
    }
}
