class ErrorDom {
    createErrorDom(text) {
        return `<div class="error-dom">
            <h2>错误:</h2>
            <img src="./image/error.png" alt="errorimg">
            <p>${text}</p>
            <button id='reload-btn' onclick='location.reload()'>重新加载</button>
            <button id="return-home-btn" onclick="location.replace('./index.html')">返回首页</button>
            <button id='clear-local-btn' onclick='confirm("是否确认清除所有存储？你的收藏历史设置等将会消失")?localStorage.clear():null'>清除所有本地存储（谨慎选择）</button>
        </div>`;
    }
}

export const errorDom = new ErrorDom();
