/**
 * RCU OFFLINE — Scroll-jacking Kill Switch
 * Option B: Normal scrolling on all devices.
 * This script must run BEFORE Elementor/ElementsKit JS.
 */
(function () {
    'use strict';

    /* ── 1. Kill CSS scroll-snap on html/body ── */
    var killSnapCSS = function () {
        var style = document.createElement('style');
        style.id = 'rcu-scroll-kill';
        style.textContent = [
            'html { scroll-snap-type: none !important; overflow-y: scroll !important; height: auto !important; }',
            'body { scroll-snap-type: none !important; overflow-y: auto !important; height: auto !important; position: static !important; }',
            '.elementor-section { scroll-snap-align: none !important; scroll-snap-stop: normal !important; }',
            '.ekit-onepage-scroll { scroll-snap-type: none !important; }',
            '#page, .site, #content, .ast-container { overflow: visible !important; height: auto !important; }'
        ].join('\n');
        document.head.appendChild(style);
    };

    /* ── 2. Intercept wheel / touch and allow default ── */
    var restoreNativeScroll = function () {
        // Remove any existing wheel listeners that call preventDefault
        var wheelOpts = { passive: true, capture: true };

        // Ensure wheel events are passive (allow browser default scroll)
        window.addEventListener('wheel', function (e) {}, wheelOpts);
        window.addEventListener('mousewheel', function (e) {}, wheelOpts);
        window.addEventListener('touchmove', function (e) {}, wheelOpts);
    };

    /* ── 3. Kill ElementsKit onepage scroll plugin ── */
    var killEkitScroll = function () {
        // Patch ElementsKit's onepage scroll init before it runs
        if (window.jQuery) {
            try {
                jQuery(document).off('mousewheel DOMMouseScroll');
                jQuery(window).off('mousewheel DOMMouseScroll wheel');
            } catch (e) {}
        }

        // Neutralise ekit config so it won't re-attach
        if (window.elementskit) {
            window.elementskit.onepagescroll = false;
        }
    };

    /* ── 4. Kill Elementor scroll-snap module ── */
    var killElementorSnap = function () {
        if (window.elementorFrontend && window.elementorFrontend.config) {
            try {
                window.elementorFrontend.config.experimentalFeatures['e_scroll_snap'] = false;
                window.elementorFrontend.config.experimentalFeatures['page-transitions'] = false;
            } catch (e) {}
        }
    };

    /* ── 5. Patch addEventListener to block passive:false wheel handlers ── */
    var origAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
        if (type === 'wheel' || type === 'mousewheel' || type === 'DOMMouseScroll') {
            // Force passive so preventDefault() inside fn is silently ignored
            if (typeof opts === 'object' && opts !== null) {
                opts.passive = true;
            } else {
                opts = { passive: true, capture: !!opts };
            }
        }
        return origAddEventListener.call(this, type, fn, opts);
    };

    /* ── 6. Run immediately + after DOM ready + after full load ── */
    killSnapCSS();
    restoreNativeScroll();

    document.addEventListener('DOMContentLoaded', function () {
        killSnapCSS();
        killEkitScroll();
        killElementorSnap();
        restoreNativeScroll();

        // Remove any inline style height:100vh on body/html
        document.documentElement.style.removeProperty('height');
        document.documentElement.style.removeProperty('overflow');
        document.body.style.removeProperty('height');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
    });

    window.addEventListener('load', function () {
        killEkitScroll();
        killElementorSnap();

        // Ensure html/body are scrollable after all scripts run
        document.documentElement.style.setProperty('overflow-y', 'scroll', 'important');
        document.documentElement.style.setProperty('height', 'auto', 'important');
        document.body.style.setProperty('overflow-y', 'auto', 'important');
        document.body.style.setProperty('height', 'auto', 'important');
        document.body.style.setProperty('position', 'static', 'important');

        // Remove any ekit one-page scroll wrappers that trap scroll
        var ekitWrap = document.querySelector('.ekit-onepage-scroll, .onepage-scroll');
        if (ekitWrap) {
            ekitWrap.style.cssText = 'overflow: visible !important; height: auto !important;';
        }
    });
}());
