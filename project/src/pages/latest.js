import { jmApi } from "../api/JmcomicApi.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";
import { LatestContainerManager } from "../components/latest/LatestContainerManager.js";
import { errorDom } from "../dom/ErrorDom.js";

class LatestPage {
    navManager;
    latestContainerManager;
    switchServerBtnManager;
    constructor() {}
    async init() {
        setting.init();
        this.navManager = new NavManager();
        this.navManager.init();

        await jmApi.init();

        this.switchServerBtnManager = new SwitchServerBtnManager();
        this.switchServerBtnManager.init();

        this.latestContainerManager = new LatestContainerManager();
        this.latestContainerManager.init();
    }
}
const app = new LatestPage();
app.init().catch((err)=>{
    console.error("初始化失败", err);
    document.querySelector(".root").insertAdjacentHTML("beforeend",errorDom.createErrorDom(err.message));
});
