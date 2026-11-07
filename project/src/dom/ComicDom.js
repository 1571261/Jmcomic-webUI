import { jmApi } from "../api/JmcomicApi.js";

class ComicDom {
    createComicItemHTML(comic) {
        let comicInfo = JSON.stringify({
            id: comic.id,
            name: comic.name,
            author: comic.author,
        })
        return `
            <div class="comic-item">
                <a class="cover" data-src="${jmApi.getCoverImageURL(comic.id)}" href="./chapter.html?id=${comic.id}" target="_blank" data-comic='${comicInfo}'>
                    <img alt="封面"/>
                </a>
                <h1 class="c-title">${comic.name}</h1>
                <h2 class="c-sr-title">${comic.author}</h2>
            </div>
        `;
    }
}
export const comicDom = new ComicDom();
