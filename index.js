(function() {
    'use strict';

    // 1. 劫持 focus 和 scrollIntoView 阻止浏览器乱跳
    const originalFocus = window.HTMLElement.prototype.focus;
    window.HTMLElement.prototype.focus = function(options) {
        if (options === undefined) options = { preventScroll: true };
        else options.preventScroll = true;
        originalFocus.call(this, options);
    };

    const originalScrollIntoView = window.Element.prototype.scrollIntoView;
    window.Element.prototype.scrollIntoView = function() {
        if (this.tagName === 'TEXTAREA' || this.tagName === 'INPUT' || this.closest('#send_form')) return;
        return originalScrollIntoView.apply(this, arguments);
    };

    // 2. 核心补丁：修改 Meta 和 激活 API
    function applyFix() {
        const viewportContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content';
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) viewportMeta.setAttribute('content', viewportContent);

        if (navigator.virtualKeyboard) {
            navigator.virtualKeyboard.overlaysContent = true;
        }
    }

    // 3. 强力归位：防止任何像素的偏移
    const snapToZero = () => {
        if (window.scrollY !== 0 || window.scrollX !== 0) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    };

    // 4. 事件绑定
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', snapToZero);
        window.visualViewport.addEventListener('scroll', snapToZero);
    }
    document.addEventListener('focusin', () => {
        snapToZero();
        setTimeout(snapToZero, 50);
    }, true);

    // 5. 初始化执行并持续守护
    applyFix();
    snapToZero();
    setInterval(snapToZero, 2000);

    console.log("SillyTavern Mobile Keyboard Fix: Always-On Mode Active.");
})();
