import { setting } from "../components/general/Setting.js"; // 导入设置模块
import { crypto } from "./Crypto.js"; // 导入加密解密模块

/** 单次 #request 的总尝试次数（含第一次） */
const REQUEST_ATTEMPTS = 3;
/** 重试前的等待基数（毫秒），实际等待时间按第几次重试递增 */
const RETRY_DELAY = 400;
/** 重试时最多还试几条线路 */
const RETRY_SERVER_COUNT = 2;

/**
 * 禁漫天堂API类
 * 提供对禁漫天堂API的各种操作接口
 */
class JmcomicApi {
    accessToken; // 访问令牌对象，包含token和tokenParam
    currentKey; // 当前时间戳作为密钥
    servers; // API服务器列表
    // 图片服务器列表，用于获取漫画图片
    imgServers = [
        "cdn-msp.jmapiproxy1.cc",
        "cdn-msp.jmapiproxy2.cc",
        "cdn-msp2.jmapiproxy2.cc",
        "cdn-msp3.jmapiproxy2.cc",
        "cdn-msp.jmapinodeudzn.net",
        "cdn-msp3.jmapinodeudzn.net",
    ];
    imgCounts = 0; // 计数器，方便调用选择的图片服务器

    /**
     * 初始化方法，获取当前密钥、访问令牌和服务器列表
     */
    async init() {
        this.currentKey = this.#getCurrentKey(); // 获取当前时间戳作为密钥
        this.accessToken = this.#getAccessToken(this.currentKey); // 根据密钥生成访问令牌
        this.servers = await this.#getCurrentApi(); // 获取当前可用的API服务器列表
    }

    /**
     * 获取当前时间戳作为密钥
     * @returns {number} 当前时间戳（秒级）
     */
    #getCurrentKey() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * 根据密钥生成访问令牌
     * @param {number} key - 时间戳密钥
     * @returns {Object} 包含token和tokenParam的对象
     */
    #getAccessToken(key) {
        return {
            token: crypto.calculateMD5(key + "185Hcomic3PAPP7R"), // 计算MD5哈希值作为token
            tokenParam: `${key},3.2.0`, // 包含时间戳和版本号的参数
        };
    }

    /**
     * 获取当前可用的API服务器列表
     * @returns {Promise<Array>} 服务器列表
     */
    async #getCurrentApi() {
        const resp = await this.retryFetch(
            "https://rup4a04-c02.tos-cn-hongkong.bytepluses.com/newsvr-2025.txt",
            1,
        );
        const text = await resp.text();
        return crypto.decryptCurrentApi(text).Server;
    }

    /**
     * 带重试机制的请求方法
     * @param {string|Function} getUrl - 请求URL或返回URL的函数
     * @param {Object} init - 请求配置对象
     * @param {number} count - 重试次数
     * @returns {Promise<Response>} 请求响应对象
     */
    async retryFetch(getUrl, init, count) {
        // 并发分支只对「按序号拼出不同服务器地址」的调用生效：
        // 传固定 URL 的调用（例如图片下载）每次重试都是同一个地址，并发没有意义
        const isMultiServer = typeof getUrl === "function";
        // 如果getUrl是字符串，则将其转换为返回该字符串的函数
        if (!isMultiServer) {
            const url = getUrl;
            getUrl = () => url;
        }
        // 如果init是数字，则表示重试次数，将init设为空对象
        if (typeof init === "number") {
            count = init;
            init = {};
        }
        // 并发模式：同时请求所有服务器，谁先回来用谁，其余的立刻取消
        if (isMultiServer && count > 1 && setting.concurrent_request === "on") {
            return this.#concurrentFetch(getUrl, init, count);
        }
        try {
            const resp = await fetch(getUrl(count), init);
            return resp;
        } catch (error) {
            // 如果重试次数已用完，抛出错误
            if (count <= 1) throw new Error(error);
            // 否则递归调用retryFetch，减少重试次数
            return this.retryFetch(getUrl, init, count - 1);
        }
    }

    /**
     * 并发请求：把所有候选服务器一次全发出去，取第一个成功返回的，其余立即取消
     * 尝试的序号与顺序重试分支完全一致（count-1 一路递减到 -1），
     * 区别只是从「一个失败再试下一个」变成「同时发出、取最快的那个」
     * @param {Function} getUrl - 接收序号返回URL的函数
     * @param {Object} init - 请求配置对象
     * @param {number} count - 尝试次数
     * @returns {Promise<Response>} 最先成功返回的响应对象
     */
    async #concurrentFetch(getUrl, init, count) {
        const controllers = [];
        const attempts = [];
        // 每个请求单独配一个 AbortController，只取消没赢的那些，赢家的响应体还要读
        for (let i = count - 1; i >= -1; i--) {
            const index = controllers.length;
            const controller = new AbortController();
            controllers.push(controller);
            attempts.push(
                fetch(getUrl(i), { ...init, signal: controller.signal }).then(
                    (response) => ({ index, response }),
                ),
            );
        }
        try {
            // Promise.any 只在全部失败时才会 reject，任何一个成功都会立刻返回
            const winner = await Promise.any(attempts);
            controllers.forEach((controller, i) => {
                if (i !== winner.index) controller.abort();
            });
            return winner.response;
        } catch (error) {
            // 全部失败：抛出第一条失败原因，报错信息和顺序分支保持一致
            throw new Error(error?.errors?.[0] ?? error);
        }
    }

    /**
     * 带重试的请求。网络错误、HTTP 状态异常、JSON 解析失败、解密失败都会触发重试，
     * 每次重试前重新生成 token（token 由秒级时间戳算出，页面开久了会过期），
     * 并等待一小段时间再发，避免对着已经出问题的线路连打。
     * @param {Function} buildUrl - 接收序号返回URL的函数
     * @param {Function} extractor - 从解密后的数据里取出需要的那部分
     * @param {number} count - 单次尝试里 retryFetch 的服务器轮询次数
     * @returns {Promise<*>} extractor 的返回值
     */
    async #request(buildUrl, extractor, count = 5) {
        let lastError;
        for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt++) {
            try {
                return await this.#requestOnce(buildUrl, extractor, count);
            } catch (error) {
                lastError = error;
                if (attempt >= REQUEST_ATTEMPTS || !this.#isRetryable(error)) {
                    break;
                }
                await this.#sleep(RETRY_DELAY * attempt);
                this.#refreshToken();
                // 第一次已经把每条线路都走过了，重试时只留少量线路确认是不是一时抽风
                count = Math.min(count, RETRY_SERVER_COUNT);
            }
        }
        throw lastError;
    }

    /**
     * 发一次请求并解析，不做重试
     * @param {Function} buildUrl - 接收序号返回URL的函数
     * @param {Function} extractor - 从解密后的数据里取出需要的那部分
     * @param {number} count - retryFetch 的服务器轮询次数
     * @returns {Promise<*>} extractor 的返回值
     */
    async #requestOnce(buildUrl, extractor, count) {
        const resp = await this.retryFetch(
            buildUrl,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            count,
        );
        if (!resp.ok) {
            const error = new Error(`请求失败：HTTP ${resp.status} ${resp.statusText}`);
            error.status = resp.status;
            throw error;
        }
        const data = await resp.json();
        return extractor(crypto.decryptData(this.currentKey, data.data));
    }

    /**
     * 判断这次失败值不值得重试
     * @param {Error & {status?: number}} error - 上一次失败的原因
     * @returns {boolean} 没有 status 的是网络错误、解析失败、解密失败，都可能只是一时运气不好
     */
    #isRetryable(error) {
        if (error?.status === undefined) return true;
        // 5xx 是服务端一时抽风；4xx 里只有鉴权过期和限流可能是暂时的，404/400 重试也没用
        return error.status >= 500 || [401, 403, 429].includes(error.status);
    }

    /**
     * 用当前时间戳重新生成 token，重试前调用
     */
    #refreshToken() {
        this.currentKey = this.#getCurrentKey();
        this.accessToken = this.#getAccessToken(this.currentKey);
    }

    /**
     * 等待指定毫秒数
     * @param {number} ms - 毫秒
     * @returns {Promise<void>}
     */
    #sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async getSearchResults(searchQuery, page, mode) {
        return this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/search?search_query=${searchQuery}&o=${mode}&page=${page}`,
            (data) => data,
            5,
        );
    }

    /**
     * 获取最新内容
     * @param {number} page - 页码
     * @returns {Promise<Object>} 最新内容数据
     */
    async getLatestContent(page) {
        return this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/latest?page=${page}`,
            (data) => data,
            5,
        );
    }

    /**
     * 获取推广内容（带缓存机制）
     * @returns {Promise<Object>} 推广内容数据
     */
    async getPromotionContent() {
        // 尝试从本地存储中获取缓存的推广数据
        let cache = localStorage.getItem("promoteCache");
        if (cache) {
            try {
                cache = JSON.parse(cache);
            } catch (error) {
                cache = null;
            }
            // 如果缓存日期是今天，则直接返回缓存数据
            if (cache.date === new Date().toDateString()) {
                return cache.data;
            }
        }
        const data = await this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/promote?page=1`,
            (data) => data,
            5,
        );
        // 将数据保存到本地存储中，以日期为标识进行缓存
        localStorage.setItem(
            "promoteCache",
            JSON.stringify({
                date: new Date().toDateString(),
                data,
            }),
        );

        return data;
    }

    /**
     * 获取漫画专辑信息
     * @param {string|number} comicId - 漫画ID
     * @returns {Promise<Object>} 漫画专辑数据
     */
    async getComicAlbum(comicId) {
        return this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/album?id=${comicId}`,
            (data) => data,
            5,
        );
    }

    /**
     * 获取漫画章节信息
     * @param {string|number} comicId - 漫画ID
     * @returns {Promise<Object>} 漫画章节数据
     */
    async getComicChapter(comicId) {
        return this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/chapter?id=${comicId}`,
            (data) => data,
            5,
        );
    }

    /**
     * 获取漫画评论
     * @param {string|number} comicId - 漫画ID
     * @param {number} index - 评论页码
     * @returns {Promise<Array>} 漫画评论列表
     */
    async getComicComments(comicId, index) {
        return this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/forum?page=${index}&mode=manhua&aid=${comicId}`,
            (data) => data.list,
            5,
        );
    }

    /**
     * 获取分类列表
     * @returns {Promise<Object>} 分类数据
     */
    async getCategories() {
        return this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/categories`,
            (data) => data,
            5,
        );
    }

    /**
     * 获取分类筛选结果
     * @param {string} category - 分类ID
     * @param {number} page - 页码
     * @param {string} order - 排序方式
     * @returns {Promise<Object>} 分类筛选结果
     */
    async getCategoriesFilter(category, page, order) {
        return this.#request(
            (i) =>
                `https://${this.servers[i % this.servers.length]}/categories/filter?page=${page}&c=${category}&o=${order}`,
            (data) => data,
            5,
        );
    }

    /**
     * 获取用户头像URL
     * @param {string} path - 用户头像路径
     * @returns {string} 完整的用户头像URL
     */
    getUserPhotoURL(path) {
        return `https://${this.imgServers[setting.using_imgserver_index[0]]}/media/users/${path}`;
    }

    /**
     * 获取漫画封面图片URL
     * @param {string|number} id - 漫画ID
     * @returns {string} 完整的封面图片URL
     */
    getCoverImageURL(id, retryCount = 0) {
        if (setting.cover_img_mode === "dynamic") {
            return `https://${this.imgServers[(Number(id) + retryCount) % this.imgServers.length]}/media/albums/${id}_3x4.jpg`;
        }

        return `https://${this.imgServers[(5 + retryCount) % this.imgServers.length]}/media/albums/${id}_3x4.jpg`;
    }

    /**
     * 获取漫画章节图片URL（指定图片服务器）
     * 章节图片的地址模板只在这里出现一次，测速时换服务器也用这个方法拼地址
     * @param {number|string} serverIndex - 图片服务器索引
     * @param {string|number} id - 章节ID
     * @param {string} pathName - 图片路径名
     * @returns {string} 完整的章节图片URL
     */
    getChapterImageURLByServer(serverIndex, id, pathName) {
        return `https://${this.imgServers[serverIndex]}/media/photos/${id}/${pathName}`;
    }

    /**
     * 获取漫画章节图片URL
     * @param {string|number} id - 章节ID
     * @param {string} pathName - 图片路径名
     * @returns {string} 完整的章节图片URL
     */
    getChapterImageURL(id, pathName) {
        this.imgCounts++;
        return this.getChapterImageURLByServer(
            setting.using_imgserver_index[
                this.imgCounts % setting.using_imgserver_index.length
            ],
            id,
            pathName,
        );
    }
}

// 创建并导出jmApi实例
export const jmApi = new JmcomicApi();