import { setting } from "../general/Setting.js";

export class ComicReader {
    imagesContainer;
    exitBtn;
    bottomBar;
    progressFill;
    progressText;
    settingsBtn;
    settingsPanel;
    isReaderMode = false;
    isHorizontal = false;
    imageWidth = 100;
    totalImages = 0;
    currentIndex = 0;
    onEscCallback = null;

    constructor(imagesContainer) {
        this.imagesContainer = imagesContainer;
        this.isHorizontal = setting.reader_is_horizontal === "on";
        this.imageWidth = +setting.reader_image_width;
        this.onEscCallback = (e) => {
            if (e.key === "Escape" && this.isReaderMode) {
                if (
                    this.settingsPanel &&
                    this.settingsPanel.style.display === "flex"
                ) {
                    this.#hideSettings();
                    return;
                }
                this.exitReaderMode();
            }
        };
    }

    setTotalImages(count) {
        this.totalImages = count;
        this.#updateProgressUI();
    }

    setProgress(index) {
        if (this.isHorizontal) return;
        this.currentIndex = index;
        this.#updateProgressUI();
    }

    enterReaderMode() {
        this.isReaderMode = true;
        this.imagesContainer.classList.add("fullscreen-reader");
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", this.onEscCallback);
        this.#createExitBtn();
        this.#createBottomBar();
        if (this.isHorizontal) {
            this.#applyHorizontalMode();
        }
        this.#applyImageWidth();
        this.#updateProgressUI();
    }

    exitReaderMode() {
        this.isReaderMode = false;
        this.imagesContainer.classList.remove("fullscreen-reader");
        this.imagesContainer.classList.remove("reader-horizontal");
        document.body.style.overflow = "";
        document.removeEventListener("keydown", this.onEscCallback);
        this.#removeExitBtn();
        this.#removeBottomBar();
        this.#removeSettings();
    }

    toggleReaderMode() {
        if (this.isReaderMode) {
            this.exitReaderMode();
        } else {
            this.enterReaderMode();
        }
    }

    #createExitBtn() {
        if (this.exitBtn) return;
        this.exitBtn = document.createElement("div");
        this.exitBtn.className = "reader-exit-btn";
        this.exitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
                <path d="M6.99486 7.00636C6.60433 7.39689 6.60433 8.03005 6.99486 8.42058L10.58 12.0057L6.99486 15.5909C6.60433 15.9814 6.60433 16.6146 6.99486 17.0051C7.38538 17.3956 8.01855 17.3956 8.40907 17.0051L11.9942 13.4199L15.5794 17.0051C15.9699 17.3956 16.6031 17.3956 16.9936 17.0051C17.3841 16.6146 17.3841 15.9814 16.9936 15.5909L13.4084 12.0057L16.9936 8.42059C17.3841 8.03007 17.3841 7.3969 16.9936 7.00638C16.603 6.61585 15.9699 6.61585 15.5794 7.00638L11.9942 10.5915L8.40907 7.00636C8.01855 6.61584 7.38538 6.61584 6.99486 7.00636Z" fill="#ffffff"/>
            </svg>
        `;
        this.exitBtn.addEventListener("click", () => this.exitReaderMode());
        this.imagesContainer.appendChild(this.exitBtn);
    }

    #removeExitBtn() {
        if (this.exitBtn) {
            this.exitBtn.remove();
            this.exitBtn = null;
        }
    }

    #createBottomBar() {
        if (this.bottomBar) return;
        this.bottomBar = document.createElement("div");
        this.bottomBar.className = "reader-bottom-bar";
        this.bottomBar.innerHTML = `
            <div class="reader-progress-cr">
                <div class="reader-progress-track">
                    <div class="reader-progress-fill"></div>
                </div>
                <div class="reader-progress-text">0 / 0</div>
            </div>
            <div class="reader-settings-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
            </div>
        `;
        this.imagesContainer.appendChild(this.bottomBar);

        this.progressFill = this.bottomBar.querySelector(
            ".reader-progress-fill",
        );
        this.progressText = this.bottomBar.querySelector(
            ".reader-progress-text",
        );
        this.settingsBtn = this.bottomBar.querySelector(".reader-settings-btn");
        this.settingsBtn.addEventListener("click", () =>
            this.#toggleSettings(),
        );
    }

    #removeBottomBar() {
        if (this.bottomBar) {
            this.bottomBar.remove();
            this.bottomBar = null;
            this.progressFill = null;
            this.progressText = null;
            this.settingsBtn = null;
        }
    }

    #updateProgressUI() {
        if (!this.progressFill || !this.totalImages) return;
        const pct =
            (this.currentIndex / Math.max(this.totalImages - 1, 1)) * 100;
        this.progressFill.style.width = pct + "%";
        this.progressText.textContent = `${this.currentIndex + 1} / ${this.totalImages}`;
    }

    #toggleSettings() {
        if (this.settingsPanel && this.settingsPanel.style.display === "flex") {
            this.#hideSettings();
        } else {
            this.#showSettings();
        }
    }

    #showSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.style.display = "flex";
            return;
        }
        this.settingsPanel = document.createElement("div");
        this.settingsPanel.className = "reader-settings-panel";
        this.settingsPanel.innerHTML = `
            <div class="reader-setting-item">
                <span>图片宽度</span>
                <div class="reader-setting-control">
                    <input type="range" class="reader-width-slider" min="50" max="100" value="${this.imageWidth}" step="5" />
                    <span class="reader-width-label">${this.imageWidth}%</span>
                </div>
            </div>
            <div class="reader-setting-item">
                <span>横向显示</span>
                <label class="reader-toggle">
                    <input type="checkbox" class="reader-horizontal-check" ${this.isHorizontal ? "checked" : ""} />
                    <span class="reader-toggle-slider"></span>
                </label>
            </div>
            `;
        this.imagesContainer.appendChild(this.settingsPanel);
        this.settingsPanel.style.display = "flex";

        const slider = this.settingsPanel.querySelector(".reader-width-slider");
        const label = this.settingsPanel.querySelector(".reader-width-label");
        slider.addEventListener("input", () => {
            this.imageWidth = +slider.value;
            label.textContent = slider.value + "%";
            this.#applyImageWidth();
            setting.setOption("reader_image_width", slider.value);
        });

        const check = this.settingsPanel.querySelector(
            ".reader-horizontal-check",
        );
        check.addEventListener("change", () => {
            this.isHorizontal = check.checked;
            setting.setOption(
                "reader_is_horizontal",
                check.checked ? "on" : "off",
            );
            if (this.isHorizontal) {
                this.#applyHorizontalMode();
            } else {
                this.#removeHorizontalMode();
            }
        });
    }

    #hideSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.style.display = "none";
        }
    }

    #removeSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.remove();
            this.settingsPanel = null;
        }
    }

    #applyImageWidth() {
        if (!this.isReaderMode || this.isHorizontal) return;
        this.imagesContainer.style.setProperty(
            "--reader-img-width",
            this.imageWidth + "%",
        );
    }

    #applyHorizontalMode() {
        this.imagesContainer.classList.add("reader-horizontal");
        this.imagesContainer.scrollLeft = this.currentIndex * window.innerWidth;
        this.#setupHorizontalScrollTracking();
        this.#setupHorizontalClickNav();
    }

    #removeHorizontalMode() {
        this.imagesContainer.classList.remove("reader-horizontal");
        this.#removeHorizontalScrollTracking();
        this.#removeHorizontalClickNav();
        this.#applyImageWidth();
    }

    #setupHorizontalScrollTracking() {
        if (this._scrollHandler) return;
        this._scrollHandler = () => {
            const w = this.imagesContainer.clientWidth || window.innerWidth;
            const idx = Math.round(this.imagesContainer.scrollLeft / w);
            if (
                idx >= 0 &&
                idx < this.totalImages &&
                idx !== this.currentIndex
            ) {
                this.currentIndex = idx;
                this.#updateProgressUI();
            }
        };
        this.imagesContainer.addEventListener("scroll", this._scrollHandler, {
            passive: true,
        });
    }

    #removeHorizontalScrollTracking() {
        if (this._scrollHandler) {
            this.imagesContainer.removeEventListener(
                "scroll",
                this._scrollHandler,
            );
            this._scrollHandler = null;
        }
    }

    #setupHorizontalClickNav() {
        if (this._clickNavHandler) return;
        this._clickNavHandler = (e) => {
            if (
                e.target.closest(".reader-bottom-bar") ||
                e.target.closest(".reader-exit-btn") ||
                e.target.closest(".reader-settings-panel")
            )
                return;
            const w = this.imagesContainer.clientWidth;
            if (e.clientX < w / 2) {
                this.#scrollToPage(-1);
            } else {
                this.#scrollToPage(1);
            }
        };
        this.imagesContainer.addEventListener("click", this._clickNavHandler);
    }

    #removeHorizontalClickNav() {
        if (this._clickNavHandler) {
            this.imagesContainer.removeEventListener(
                "click",
                this._clickNavHandler,
            );
            this._clickNavHandler = null;
        }
    }

    #scrollToPage(delta) {
        const idx = this.currentIndex + delta;
        if (idx < 0 || idx >= this.totalImages) return;
        const w = this.imagesContainer.clientWidth;
        this.imagesContainer.scrollTo({ left: idx * w, behavior: "smooth" });
    }
}
