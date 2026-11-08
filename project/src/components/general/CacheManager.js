class CacheManager {
    #options = {
        history: {
            name: "history",
            value: null,
        },
        favorite: {
            name: "favorite",
            value: null,
        },
        apiCache: {
            name: "apiCache",
            value: null,
        },
        promoteCache: {
            name: "promoteCache",
            value: null,
        },
        lastClickComic: {
            name: "lastClickComic",
            value: null,
        },
    };

    setCache(key, value) {
        const option = this.#options[key];
        if (!option) return;
        option.value = value;
        localStorage.setItem(option.name, JSON.stringify(value));
    }
    getCache(key) {
        try {
            const option = this.#options[key];
            if (!option) return null;
            if (!option.value) {
                let value = localStorage.getItem(option.name);
                if (!value) return null;
                this.setCache(key, JSON.parse(value));
                return option.value;
            } else {
                return option.value;
            }
        } catch (error) {
            this.setCache(key, null);
            return null;
        }
    }

    get history() {
        return this.getCache("history");
    }
    get favorite() {
        return this.getCache("favorite");
    }
    get apiCache() {
        return this.getCache("apiCache");
    }
    get promoteCache() {
        return this.getCache("promoteCache");
    }
    get lastClickComic() {
        return this.getCache("lastClickComic");
    }
}

export const cacheManager = new CacheManager();
