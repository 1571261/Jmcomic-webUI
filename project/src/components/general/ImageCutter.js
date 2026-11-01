import { crypto } from "../../api/Crypto.js";

export const COMIC_ID_R1 = 220980;
export const COMIC_ID_R2 = 268850;
export const COMIC_ID_R3 = 421925;

export class ImageCutter {
    constructor() {}
    cutImage(image, id, path) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context.imageSmoothingEnabled = false;
        const sliceCount = this.#getCuttingCount(id, path.substring(0, 5));
        const sliceHeight = Math.floor(canvas.height / sliceCount);
        const remainingHeight = canvas.height % sliceCount;

        context.drawImage(
            image,
            0,
            canvas.height - sliceHeight - remainingHeight,
            canvas.width,
            sliceHeight + remainingHeight,
            0,
            0,
            canvas.width,
            sliceHeight + remainingHeight,
        );
        for (let i = 0; i < sliceCount - 1; i++) {
            context.drawImage(
                image,
                0,
                sliceHeight * (sliceCount - i - 2),
                canvas.width,
                sliceHeight,
                0,
                (i + 1) * sliceHeight + remainingHeight,
                canvas.width,
                sliceHeight,
            );
        }
        return canvas;
    }
    #getCuttingCount(id, path) {
        if (id >= COMIC_ID_R1 && id < COMIC_ID_R2) {
            return 10;
        }
        const hashData = crypto.calculateMD5(id + path);
        let key = hashData.charCodeAt(hashData.length - 1);
        if (id >= COMIC_ID_R2 && id <= COMIC_ID_R3) {
            key = key % 10;
        } else {
            key = key % 8;
        }
        return key * 2 + 2;
    }
}
