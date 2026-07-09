/**
 * Latin Labs Traders — HOME 2026 animations
 * - Reveal on scroll (IntersectionObserver)
 * - KPI count-up
 * - Navbar blur on scroll
 */
(function () {
    'use strict';

    function onReady(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    onReady(function () {
        // 1) Reveal on scroll
        var revealEls = document.querySelectorAll('.reveal, .section-title');
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

            revealEls.forEach(function (el) { io.observe(el); });
        } else {
            revealEls.forEach(function (el) { el.classList.add('is-visible'); });
        }

        // 2) KPI count-up
        var counters = document.querySelectorAll('[data-count]');
        function animateCount(el) {
            var target = parseFloat(el.getAttribute('data-count'));
            var suffix = el.textContent.replace(/[0-9.]/g, ''); // preserve "+" etc
            var dur = 1200;
            var start = null;
            function step(ts) {
                if (!start) start = ts;
                var p = Math.min((ts - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
                var val = Math.floor(eased * target);
                el.textContent = val + suffix;
                if (p < 1) requestAnimationFrame(step);
                else el.textContent = target + suffix;
            }
            requestAnimationFrame(step);
        }
        if ('IntersectionObserver' in window && counters.length) {
            var ioCount = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCount(entry.target);
                        ioCount.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            counters.forEach(function (c) { ioCount.observe(c); });
        }

        // 3) Navbar blur on scroll
        var navbar = document.querySelector('.navbar');
        if (navbar) {
            function onScroll() {
                if (window.scrollY > 30) navbar.classList.add('scrolled');
                else navbar.classList.remove('scrolled');
            }
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }
    });
})();
