export class SeriesManager {
    album;
    seriesnDom;
    constructor() {
        this.seriesnDom = document.querySelector(".series-inner");
    }
    init(album) {
        this.album = album;
        if(!album.series.length){
            this.seriesnDom.parentNode.style.display="none"
            return
        }
        this.seriesnDom.innerHTML = album.series
            .map((s, i) => {
                return `<a class="series-item" href="./chapter.html?id=${s.id}">章节${i + 1}</a>`;
            })
            .join("");

        let fi = album.series.findIndex((s) => s.id == album.id);
        if (fi > -1) {
            let c = this.seriesnDom.children[fi];
            c.href = "#";
            c.classList.add("active");
            this.seriesnDom.scrollTo({
                top: c.offsetTop - this.seriesnDom.offsetTop
            })
        }
        let lockBtn = this.seriesnDom.nextElementSibling;
        if(lockBtn.offsetHeight<200){
            lockBtn.style.display="none"
        }
        lockBtn.addEventListener("click",()=>{
            this.seriesnDom.classList.toggle("show-more")
        })
    }
}
