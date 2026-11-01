import { jmApi } from "../api/JmcomicApi.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";
import { SearchContainerManager } from "../components/search/SearchContainerManager.js";
import { errorDom } from "../dom/ErrorDom.js";

class SearchPage {
    navManager;
    searchContainerManager;
    searchQuery;
    switchServerBtnManager;
    constructor() {}
    async init() {
        const sq = new URLSearchParams(location.search).get("sq");
        if (typeof sq !== "string" || sq.trim() === "") {
            location.replace("./index.html");
            throw new Error("请输入搜索内容");
        }

        this.searchQuery = sq;
        setting.init();
        this.navManager = new NavManager();
        this.navManager.init();
        await jmApi.init();
        const searchContainerManager = new SearchContainerManager(
            this.searchQuery,
        );
        searchContainerManager.init();

        this.switchServerBtnManager = new SwitchServerBtnManager();
        this.switchServerBtnManager.init();
    }
}
const app = new SearchPage();
app.init().catch((err)=>{
    console.error("初始化失败", err);
    document.querySelector(".root").insertAdjacentHTML("beforeend",errorDom.createErrorDom(err.message));
});
