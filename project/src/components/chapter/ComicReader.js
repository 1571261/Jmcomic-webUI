import { setting } from "../general/Setting.js";

export class ComicReader {
    imagesContainer
    exitBtn
    bottomBar
    progressFill
    progressText
    settingsBtn
    settingsPanel
    isReaderMode = false
    isHorizontal = false
    imageWidth = 100
    totalImages = 0
    currentIndex = 0
    onEscCallback = null

    constructor(imagesContainer) {
        this.imagesContainer = imagesContainer;
        this.isHorizontal = setting.reader_is_horizontal === "on";
        this.imageWidth = +setting.reader_image_width;
        this.onEscCallback = (e) => {
            if (e.key === "Escape" && this.isReaderMode) {
                if (this.settingsPanel && this.settingsPanel.style.display === "flex") {
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
        console.log("enter");
        
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
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2581 9.77251 19.9887C9.5799 19.7192 9.31074 19.514 8.99855 19.3992C8.68637 19.2844 8.34596 19.2653 8.02399 19.3443C7.70202 19.4233 7.41358 19.5969 7.2 19.84L7.14 19.9C6.95435 20.086 6.73372 20.2335 6.49091 20.3341C6.2481 20.4348 5.98782 20.4866 5.725 20.4866C5.46218 20.4866 5.2019 20.4348 4.95909 20.3341C4.71628 20.2335 4.49565 20.086 4.31 19.9C4.12405 19.7143 3.97657 19.4937 3.87598 19.2509C3.77539 19.0081 3.72363 18.7478 3.72363 18.485C3.72363 18.2222 3.77539 17.9619 3.87598 17.7191C3.97657 17.4763 4.12405 17.2557 4.31 17.07L4.37 17.01C4.60053 16.7743 4.75519 16.475 4.814 16.1506C4.87282 15.8262 4.83315 15.4916 4.7 15.19C4.57319 14.8942 4.36284 14.642 4.09451 14.4643C3.82619 14.2866 3.51184 14.1913 3.19 14.19H3C2.46957 14.19 1.96086 13.9793 1.58579 13.6042C1.21071 13.2291 1 12.7204 1 12.19C1 11.6596 1.21071 11.1509 1.58579 10.7758C1.96086 10.4007 2.46957 10.19 3 10.19H3.09C3.42099 10.1823 3.74186 10.0751 4.01131 9.88251C4.28077 9.6899 4.48597 9.42074 4.60078 9.10855C4.71559 8.79637 4.73472 8.45596 4.65569 8.13399C4.57666 7.81202 4.40312 7.52358 4.16 7.31L4.1 7.25C3.91405 7.06435 3.76657 6.84372 3.66598 6.60091C3.56539 6.3581 3.51363 6.09782 3.51363 5.835C3.51363 5.57218 3.56539 5.3119 3.66598 5.06909C3.76657 4.82628 3.91405 4.60565 4.1 4.42C4.28565 4.23405 4.50628 4.08657 4.74909 3.98598C4.9919 3.88539 5.25218 3.83363 5.515 3.83363C5.77782 3.83363 6.0381 3.88539 6.28091 3.98598C6.52372 4.08657 6.74435 4.23405 6.93 4.42L6.99 4.48C7.22569 4.71053 7.525 4.86519 7.84939 4.924C8.17377 4.98282 8.50839 4.94315 8.81 4.81H8.91C9.20581 4.68319 9.45803 4.47284 9.63571 4.20451C9.8134 3.93619 9.90873 3.62184 9.91 3.3V3C9.91 2.46957 10.1207 1.96086 10.4958 1.58579C10.8709 1.21071 11.3796 1 11.91 1C12.4404 1 12.9491 1.21071 13.3242 1.58579C13.6993 1.96086 13.91 2.46957 13.91 3V3.09C13.9113 3.41184 14.0066 3.72619 14.1843 3.99451C14.362 4.26284 14.5724 4.47319 14.84 4.65C15.1416 4.78315 15.4762 4.82282 15.8006 4.764C16.125 4.70519 16.4243 4.55053 16.66 4.32L16.72 4.26C16.9057 4.07405 17.1263 3.92657 17.3691 3.82598C17.6119 3.72539 17.8722 3.67363 18.135 3.67363C18.3978 3.67363 18.6581 3.72539 18.9009 3.82598C19.1437 3.92657 19.3643 4.07405 19.55 4.26C19.736 4.44565 19.8834 4.66628 19.984 4.90909C20.0846 5.1519 20.1364 5.41218 20.1364 5.675C20.1364 5.93782 20.0846 6.1981 19.984 6.44091C19.8834 6.68372 19.736 6.90435 19.55 7.09L19.49 7.15C19.2595 7.38569 19.1048 7.685 19.046 8.00939C18.9872 8.33377 19.0269 8.66839 19.16 8.97V9.07C19.2868 9.36581 19.4972 9.61803 19.7655 9.79571C20.0338 9.9734 20.3482 10.0687 20.67 10.07H21C21.5304 10.07 22.0391 10.2807 22.4142 10.6558C22.7893 11.0309 23 11.5396 23 12.07C23 12.6004 22.7893 13.1091 22.4142 13.4842C22.0391 13.8593 21.5304 14.07 21 14.07H20.91C20.5882 14.0713 20.2738 14.1666 20.0055 14.3443C19.7372 14.522 19.5268 14.7324 19.35 15C19.2169 15.3016 19.1772 15.6362 19.236 15.9606C19.2948 16.285 19.4495 16.5843 19.68 16.82L19.74 16.88C19.926 17.0657 20.0735 17.2863 20.1741 17.5291C20.2748 17.7719 20.3266 18.0322 20.3266 18.295C20.3266 18.5578 20.2748 18.8181 20.1741 19.0609C20.0735 19.3037 19.926 19.5243 19.74 19.71C19.5543 19.896 19.3337 20.0435 19.0909 20.1441C18.8481 20.2448 18.5878 20.2966 18.325 20.2966C18.0622 20.2966 17.8019 20.2448 17.5591 20.1441C17.3163 20.0435 17.0957 19.896 16.91 19.71L16.85 19.65C16.6143 19.4195 16.315 19.2648 15.9906 19.206C15.6662 19.1472 15.3316 19.1869 15.03 19.32C14.7342 19.4468 14.482 19.6572 14.3043 19.9255C14.1266 20.1938 14.0313 20.5082 14.03 20.83V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0223 20.579 9.91512 20.2581 9.72251 19.9887C9.5299 19.7192 9.26074 19.514 8.94855 19.3992C8.63637 19.2844 8.29596 19.2653 7.97399 19.3443C7.65202 19.4233 7.36358 19.5969 7.15 19.84L7.09 19.9C6.90435 20.086 6.68372 20.2335 6.44091 20.3341C6.1981 20.4348 5.93782 20.4866 5.675 20.4866C5.41218 20.4866 5.1519 20.4348 4.90909 20.3341C4.66628 20.2335 4.44565 20.086 4.26 19.9C4.07405 19.7143 3.92657 19.4937 3.82598 19.2509C3.72539 19.0081 3.67363 18.7478 3.67363 18.485C3.67363 18.2222 3.72539 17.9619 3.82598 17.7191C3.92657 17.4763 4.07405 17.2557 4.26 17.07L4.32 17.01C4.55053 16.7743 4.70519 16.475 4.764 16.1506C4.82282 15.8262 4.78315 15.4916 4.65 15.19C4.52319 14.8942 4.31284 14.642 4.04451 14.4643C3.77619 14.2866 3.46184 14.1913 3.14 14.19H3C2.46957 14.19 1.96086 13.9793 1.58579 13.6042C1.21071 13.2291 1 12.7204 1 12.19C1 11.6596 1.21071 11.1509 1.58579 10.7758C1.96086 10.4007 2.46957 10.19 3 10.19H3.09C3.42099 10.1823 3.74186 10.0751 4.01131 9.88251C4.28077 9.6899 4.48597 9.42074 4.60078 9.10855C4.71559 8.79637 4.73472 8.45596 4.65569 8.13399C4.57666 7.81202 4.40312 7.52358 4.16 7.31L4.1 7.25C3.91405 7.06435 3.76657 6.84372 3.66598 6.60091C3.56539 6.3581 3.51363 6.09782 3.51363 5.835C3.51363 5.57218 3.56539 5.3119 3.66598 5.06909C3.76657 4.82628 3.91405 4.60565 4.1 4.42C4.28565 4.23405 4.50628 4.08657 4.74909 3.98598C4.9919 3.88539 5.25218 3.83363 5.515 3.83363C5.77782 3.83363 6.0381 3.88539 6.28091 3.98598C6.52372 4.08657 6.74435 4.23405 6.93 4.42L6.99 4.48C7.22569 4.71053 7.525 4.86519 7.84939 4.924C8.17377 4.98282 8.50839 4.94315 8.81 4.81H8.91C9.20581 4.68319 9.45803 4.47284 9.63571 4.20451C9.8134 3.93619 9.90873 3.62184 9.91 3.3V3C9.91 2.46957 10.1207 1.96086 10.4958 1.58579C10.8709 1.21071 11.3796 1 11.91 1C12.4404 1 12.9491 1.21071 13.3242 1.58579C13.6993 1.96086 13.91 2.46957 13.91 3V3.09C13.9113 3.41184 14.0066 3.72619 14.1843 3.99451C14.362 4.26284 14.5724 4.47319 14.84 4.65C15.1416 4.78315 15.4762 4.82282 15.8006 4.764C16.125 4.70519 16.4243 4.55053 16.66 4.32L16.72 4.26C16.9057 4.07405 17.1263 3.92657 17.3691 3.82598C17.6119 3.72539 17.8722 3.67363 18.135 3.67363C18.3978 3.67363 18.6581 3.72539 18.9009 3.82598C19.1437 3.92657 19.3643 4.07405 19.55 4.26C19.736 4.44565 19.8834 4.66628 19.984 4.90909C20.0846 5.1519 20.1364 5.41218 20.1364 5.675C20.1364 5.93782 20.0846 6.1981 19.984 6.44091C19.8834 6.68372 19.736 6.90435 19.55 7.09L19.49 7.15C19.2595 7.38569 19.1048 7.685 19.046 8.00939C18.9872 8.33377 19.0269 8.66839 19.16 8.97V9.07C19.2868 9.36581 19.4972 9.61803 19.7655 9.79571C20.0338 9.9734 20.3482 10.0687 20.67 10.07H21C21.5304 10.07 22.0391 10.2807 22.4142 10.6558C22.7893 11.0309 23 11.5396 23 12.07C23 12.6004 22.7893 13.1091 22.4142 13.4842C22.0391 13.8593 21.5304 14.07 21 14.07H20.91C20.5882 14.0713 20.2738 14.1666 20.0055 14.3443C19.7372 14.522 19.5268 14.7324 19.35 15C19.2169 15.3016 19.1772 15.6362 19.236 15.9606C19.2948 16.285 19.4495 16.5843 19.68 16.82L19.74 16.88C19.926 17.0657 20.0735 17.2863 20.1741 17.5291C20.2748 17.7719 20.3266 18.0322 20.3266 18.295C20.3266 18.5578 20.2748 18.8181 20.1741 19.0609C20.0735 19.3037 19.926 19.5243 19.74 19.71C19.5543 19.896 19.3337 20.0435 19.0909 20.1441C18.8481 20.2448 18.5878 20.2966 18.325 20.2966C18.0622 20.2966 17.8019 20.2448 17.5591 20.1441C17.3163 20.0435 17.0957 19.896 16.91 19.71L16.85 19.65C16.6143 19.4195 16.315 19.2648 15.9906 19.206C15.6662 19.1472 15.3316 19.1869 15.03 19.32C14.7342 19.4468 14.482 19.6572 14.3043 19.9255C14.1266 20.1938 14.0313 20.5082 14.03 20.83V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0223 20.579 9.91512 20.2581 9.72251 19.9887C9.5299 19.7192 9.26074 19.514 8.94855 19.3992C8.63637 19.2844 8.29596 19.2653 7.97399 19.3443C7.65202 19.4233 7.36358 19.5969 7.15 19.84L7.09 19.9C6.90435 20.086 6.68372 20.2335 6.44091 20.3341C6.1981 20.4348 5.93782 20.4866 5.675 20.4866C5.41218 20.4866 5.1519 20.4348 4.90909 20.3341C4.66628 20.2335 4.44565 20.086 4.26 19.9C4.07405 19.7143 3.92657 19.4937 3.82598 19.2509C3.72539 19.0081 3.67363 18.7478 3.67363 18.485C3.67363 18.2222 3.72539 17.9619 3.82598 17.7191C3.92657 17.4763 4.07405 17.2557 4.26 17.07L4.32 17.01C4.55053 16.7743 4.70519 16.475 4.764 16.1506C4.82282 15.8262 4.78315 15.4916 4.65 15.19C4.52319 14.8942 4.31284 14.642 4.04451 14.4643C3.77619 14.2866 3.46184 14.1913 3.14 14.19H3C2.46957 14.19 1.96086 13.9793 1.58579 13.6042C1.21071 13.2291 1 12.7204 1 12.19C1 11.6596 1.21071 11.1509 1.58579 10.7758C1.96086 10.4007 2.46957 10.19 3 10.19H3.09C3.42099 10.1823 3.74186 10.0751 4.01131 9.88251C4.28077 9.6899 4.48597 9.42074 4.60078 9.10855C4.71559 8.79637 4.73472 8.45596 4.65569 8.13399C4.57666 7.81202 4.40312 7.52358 4.16 7.31L4.1 7.25C3.91405 7.06435 3.76657 6.84372 3.66598 6.60091C3.56539 6.3581 3.51363 6.09782 3.51363 5.835C3.51363 5.57218 3.56539 5.3119 3.66598 5.06909C3.76657 4.82628 3.91405 4.60565 4.1 4.42C4.28565 4.23405 4.50628 4.08657 4.74909 3.98598C4.9919 3.88539 5.25218 3.83363 5.515 3.83363C5.77782 3.83363 6.0381 3.88539 6.28091 3.98598C6.52372 4.08657 6.74435 4.23405 6.93 4.42L6.99 4.48C7.22569 4.71053 7.525 4.86519 7.84939 4.924C8.17377 4.98282 8.50839 4.94315 8.81 4.81H8.91C9.20581 4.68319 9.45803 4.47284 9.63571 4.20451C9.8134 3.93619 9.90873 3.62184 9.91 3.3V3C9.91 2.46957 10.1207 1.96086 10.4958 1.58579C10.8709 1.21071 11.3796 1 11.91 1C12.4404 1 12.9491 1.21071 13.3242 1.58579C13.6993 1.96086 13.91 2.46957 13.91 3V3.09C13.9113 3.41184 14.0066 3.72619 14.1843 3.99451C14.362 4.26284 14.5724 4.47319 14.84 4.65C15.1416 4.78315 15.4762 4.82282 15.8006 4.764C16.125 4.70519 16.4243 4.55053 16.66 4.32L16.72 4.26C16.9057 4.07405 17.1263 3.92657 17.3691 3.82598C17.6119 3.72539 17.8722 3.67363 18.135 3.67363C18.3978 3.67363 18.6581 3.72539 18.9009 3.82598C19.1437 3.92657 19.3643 4.07405 19.55 4.26C19.736 4.44565 19.8834 4.66628 19.984 4.90909C20.0846 5.1519 20.1364 5.41218 20.1364 5.675C20.1364 5.93782 20.0846 6.1981 19.984 6.44091C19.8834 6.68372 19.736 6.90435 19.55 7.09L19.49 7.15C19.2595 7.38569 19.1048 7.685 19.046 8.00939C18.9872 8.33377 19.0269 8.66839 19.16 8.97V9.07C19.2868 9.36581 19.4972 9.61803 19.7655 9.79571C20.0338 9.9734 20.3482 10.0687 20.67 10.07H21C21.5304 10.07 22.0391 10.2807 22.4142 10.6558C22.7893 11.0309 23 11.5396 23 12.07C23 12.6004 22.7893 13.1091 22.4142 13.4842C22.0391 13.8593 21.5304 14.07 21 14.07H20.91C20.5882 14.0713 20.2738 14.1666 20.0055 14.3443C19.7372 14.522 19.5268 14.7324 19.35 15C19.2169 15.3016 19.1772 15.6362 19.236 15.9606C19.2948 16.285 19.4495 16.5843 19.68 16.82L19.74 16.88C19.926 17.0657 20.0735 17.2863 20.1741 17.5291C20.2748 17.7719 20.3266 18.0322 20.3266 18.295C20.3266 18.5578 20.2748 18.8181 20.1741 19.0609C20.0735 19.3037 19.926 19.5243 19.74 19.71C19.5543 19.896 19.3337 20.0435 19.0909 20.2448C18.8481 20.4448 18.5878 20.4966 18.325 20.4966" fill="#ffffff"/>
                </svg>
            </div>
        `;
        this.imagesContainer.appendChild(this.bottomBar);

        this.progressFill = this.bottomBar.querySelector(".reader-progress-fill");
        this.progressText = this.bottomBar.querySelector(".reader-progress-text");
        this.settingsBtn = this.bottomBar.querySelector(".reader-settings-btn");
        this.settingsBtn.addEventListener("click", () => this.#toggleSettings());
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
        const pct = (this.currentIndex / Math.max(this.totalImages - 1, 1)) * 100;
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

        const check = this.settingsPanel.querySelector(".reader-horizontal-check");
        check.addEventListener("change", () => {
            this.isHorizontal = check.checked;
            setting.setOption("reader_is_horizontal", check.checked ? "on" : "off");
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
        this.imagesContainer.style.setProperty("--reader-img-width", this.imageWidth + "%");
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
            if (idx >= 0 && idx < this.totalImages && idx !== this.currentIndex) {
                this.currentIndex = idx;
                this.#updateProgressUI();
            }
        };
        this.imagesContainer.addEventListener("scroll", this._scrollHandler, { passive: true });
    }

    #removeHorizontalScrollTracking() {
        if (this._scrollHandler) {
            this.imagesContainer.removeEventListener("scroll", this._scrollHandler);
            this._scrollHandler = null;
        }
    }

    #setupHorizontalClickNav() {
        if (this._clickNavHandler) return;
        this._clickNavHandler = (e) => {
            if (e.target.closest(".reader-bottom-bar") || e.target.closest(".reader-exit-btn") || e.target.closest(".reader-settings-panel")) return;
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
            this.imagesContainer.removeEventListener("click", this._clickNavHandler);
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