(function() {
    'use strict';

    console.log("Keyboard Fix: 尝试初始化...");

    // 1. 强力劫持原生滚动（阻止上移的关键）
    const originalFocus = window.HTMLElement.prototype.focus;
    window.HTMLElement.prototype.focus = function(options) {
        const opt = options || {};
        opt.preventScroll = true;
        originalFocus.call(this, opt);
    };

    const originalScrollIntoView = window.Element.prototype.scrollIntoView;
    window.Element.prototype.scrollIntoView = function() {
        if (this.tagName === 'TEXTAREA' || this.tagName === 'INPUT' || this.closest('#send_form')) {
            return;
        }
        return originalScrollIntoView.apply(this, arguments);
    };

    // 2. 强制设置 Meta 视口
    function forceApplyMeta() {
        const content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content';
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        if (meta.getAttribute('content') !== content) {
            meta.setAttribute('content', content);
            console.log("Keyboard Fix: Viewport Meta 已强制重写");
        }

        if (navigator.virtualKeyboard && !navigator.virtualKeyboard.overlaysContent) {
            navigator.virtualKeyboard.overlaysContent = true;
            console.log("Keyboard Fix: OverlaysContent 已激活");
        }
    }

    // 3. 强力归位函数
    const snapToZero = () => {
        if (window.scrollY !== 0) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    };

    // 4. 周期性执行 (守护进程)
    // 插件加载晚，所以我们要不停地检查，直到成功为止
    const daemon = setInterval(() => {
        forceApplyMeta();
        snapToZero();
    }, 1000);

    // 监听视口和聚焦
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', snapToZero);
        window.visualViewport.addEventListener('scroll', snapToZero);
    }
    document.addEventListener('focusin', () => {
        setTimeout(snapToZero, 10);
        setTimeout(snapToZero, 100);
    }, true);

    // 初始化运行
    forceApplyMeta();
    snapToZero();

    console.log("Keyboard Fix: 插件已全速运行");
})();
