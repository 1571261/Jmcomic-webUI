export class InfinityScrollContainer {
    isLoading = false;
    pageIndex = 1;
    maxPageIndex = 10000;
    container;
    threshold;
    loadContent;
    coolingTime;
    prevLoadedTime = 0;
    isGlobalContainer;
    constructor({
        container = null,
        threshold = 100,
        loadContent = () => {},
        coolingTime = 1000,
        isGlobalContainer = true,
    }) {
        this.container = container;
        this.threshold = threshold;
        this.loadContent = loadContent;
        this.coolingTime = coolingTime;
        this.isGlobalContainer = isGlobalContainer;
    }
    init() {
        this.#addEvent();
        this.reset()
    }
    reset() {
        this.pageIndex = 1;
        this.container.innerHTML = "";
        this.isLoading = true;
        this.#loadFirstPage();
    }
    #addEvent() {
        let ele;
        if (this.isGlobalContainer) {
            ele = window;
        } else {
            ele = this.container.parentNode;
        }
        ele.addEventListener("scroll", () => this.#onScroll());
    }
    getBottom() {
        if (this.isGlobalContainer) {
            return Math.floor(
                document.documentElement.offsetHeight -
                    document.documentElement.scrollTop -
                    innerHeight,
            );
        }

        return Math.floor(
            this.container.offsetHeight -
                this.container.parentNode.scrollTop -
                this.container.parentNode.offsetHeight,
        );
    }
    #loadFirstPage(){
        this.loadContent(this.pageIndex)
            .then(()=>{
                if (this.pageIndex >= this.maxPageIndex) {
                    this.container.insertAdjacentHTML(
                        "beforeend",
                        "<div class='no-more'>没有更多了</div>",
                    );
                }
            })
            .finally(() => {
                this.isLoading = false;
            })
            .catch((err)=>{
                if(err.name === "AbortError")return
                throw err
            })
    }
    #onScroll() {
        if (
            this.isLoading ||
            this.pageIndex >= this.maxPageIndex ||
            Date.now() - this.prevLoadedTime < this.coolingTime
        )
            return;

        let bottom = this.getBottom();
        // console.log(bottom);

        if (bottom < this.threshold) {
            this.isLoading = true;
            this.pageIndex++;
            this.prevLoadedTime = Date.now();
            this.loadContent(this.pageIndex)
                .catch((err) => {
                    this.pageIndex--;
                })
                .finally(() => {
                    this.isLoading = false;

                    if (this.pageIndex >= this.maxPageIndex) {
                        this.container.insertAdjacentHTML(
                            "beforeend",
                            "<div class='no-more'>没有更多了</div>",
                        );
                    }
                });
        }
    }
}
