(function() {
    'use strict';

    const { renderExtensionTemplateAsync } = SillyTavern.getContext();

    // 1. 从本地存储读取历史开关状态，默认开启
    let isEnabled = localStorage.getItem('st_keyboard_fix_enabled') !== 'false';

    // 2. 劫持原生方法：仅在开启状态下拦截滚动
    const originalFocus = window.HTMLElement.prototype.focus;
    window.HTMLElement.prototype.focus = function(options) {
        if (isEnabled) {
            if (options === undefined) {
                options = { preventScroll: true };
            } else {
                options.preventScroll = true;
            }
        }
        originalFocus.call(this, options);
    };

    const originalScrollIntoView = window.Element.prototype.scrollIntoView;
    window.Element.prototype.scrollIntoView = function(options) {
        if (isEnabled && (this.tagName === 'TEXTAREA' || this.tagName === 'INPUT' || this.closest('#send_form'))) {
            return; 
        }
        return originalScrollIntoView.apply(this, arguments);
    };

    const originalScrollIntoViewIfNeeded = window.Element.prototype.scrollIntoViewIfNeeded;
    if (originalScrollIntoViewIfNeeded) {
        window.Element.prototype.scrollIntoViewIfNeeded = function(options) {
            if (isEnabled && (this.tagName === 'TEXTAREA' || this.tagName === 'INPUT' || this.closest('#send_form'))) {
                return;
            }
            return originalScrollIntoViewIfNeeded.apply(this, arguments);
        };
    }

    // 3. 页面状态同步机制
    function updateState() {
        const htmlElement = document.documentElement;
        if (isEnabled) {
            htmlElement.classList.add('st-keyboard-fix-active');
            
            // 启用 overlays-content
            if (navigator.virtualKeyboard) {
                navigator.virtualKeyboard.overlaysContent = true;
            }

            // 强制 Meta
            const viewportContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content';
            let viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta) {
                viewportMeta.setAttribute('content', viewportContent);
            }
            snapToZero();
        } else {
            // 关闭时，彻底移除 class 和 overlays-content，还原原生表现
            htmlElement.classList.remove('st-keyboard-fix-active');
            if (navigator.virtualKeyboard) {
                navigator.virtualKeyboard.overlaysContent = false;
            }
        }
    }

    const snapToZero = () => {
        if (isEnabled && (window.scrollY !== 0 || window.scrollX !== 0)) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    };

    // 4. 事件监听
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', snapToZero);
        window.visualViewport.addEventListener('scroll', snapToZero);
    }

    document.addEventListener('focusin', (e) => {
        if (isEnabled && ['TEXTAREA', 'INPUT'].includes(e.target.tagName)) {
            snapToZero();
            setTimeout(snapToZero, 10);
            setTimeout(snapToZero, 50);
            setTimeout(snapToZero, 150);
        }
    }, true);

    // 周期守护
    setInterval(() => {
        if (isEnabled) {
            updateState();
            snapToZero();
        }
    }, 2000);

    // 5. 初始化与设置面板注入
    jQuery(async () => {
        // 渲染并挂载设置 HTML 到扩展面板
        const settingsHtml = await renderExtensionTemplateAsync(
            'third-party/st-mobile-keyboard-fix', 
            'settings'
        );
        $('#extensions_settings').append(settingsHtml);

        // 绑定复选框交互
        const checkbox = $('#st_keyboard_fix_enable');
        checkbox.prop('checked', isEnabled);
        
        checkbox.on('change', function() {
            isEnabled = $(this).is(':checked');
            localStorage.setItem('st_keyboard_fix_enabled', isEnabled);
            updateState();
        });

        // 启动一次
        updateState();
    });

    console.log("SillyTavern Mobile Keyboard Fix Extension Loaded.");
})();
