import { jmApi } from "../api/JmcomicApi.js";
import { FavoriteContainerManager } from "../components/favorite/FavoriteContainerManager.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";
import { errorDom } from "../dom/ErrorDom.js";

class FavoritePage {
    navManager
    switchServerBtnManager
    favoriteContainerManager
    constructor() {}
    async init() {
        setting.init()
        this.navManager = new NavManager();
        this.navManager.init();

        await jmApi.init();

        this.favoriteContainerManager=new FavoriteContainerManager()
        this.favoriteContainerManager.init()

        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }
}
const app = new FavoritePage();
app.init().catch((err)=>{
    console.error("初始化失败", err);
    document.querySelector(".root").insertAdjacentHTML("beforeend",errorDom.createErrorDom(err.message));
});
