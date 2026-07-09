/**
 * Latin Labs Traders — Hero Canvas
 * Red de nodos conectados (estilo trading network) + partículas flotantes
 */
(function () {
    'use strict';

    function initHeroCanvas() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height, dpr;
        let nodes = [];
        let particles = [];
        let mouse = { x: null, y: null };
        let rafId = null;

        const COLORS = ['34, 211, 238', '45, 212, 191', '221, 166, 39', '59, 130, 246'];

        function resize() {
            dpr = window.devicePixelRatio || 1;
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            buildNodes();
        }

        function buildNodes() {
            const count = Math.min(80, Math.floor((width * height) / 16000));
            nodes = [];
            for (let i = 0; i < count; i++) {
                nodes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.35,
                    vy: (Math.random() - 0.5) * 0.35,
                    r: Math.random() * 1.8 + 0.8,
                    c: COLORS[Math.floor(Math.random() * COLORS.length)]
                });
            }
            // Partículas brillantes
            particles = [];
            const pcount = Math.min(30, Math.floor(count / 3));
            for (let i = 0; i < pcount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vy: -(Math.random() * 0.4 + 0.1),
                    r: Math.random() * 1.5 + 0.5,
                    a: Math.random() * 0.5 + 0.3
                });
            }
        }

        function step() {
            ctx.clearRect(0, 0, width, height);

            const maxDist = 130;

            // Líneas entre nodos cercanos
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];

                // Movimiento
                n.x += n.vx;
                n.y += n.vy;

                if (n.x < 0 || n.x > width) n.vx *= -1;
                if (n.y < 0 || n.y > height) n.vy *= -1;

                // Repulsión suave del mouse
                if (mouse.x !== null) {
                    const dx = n.x - mouse.x;
                    const dy = n.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        n.x += (dx / dist) * 0.6;
                        n.y += (dy / dist) * 0.6;
                    }
                }

                for (let j = i + 1; j < nodes.length; j++) {
                    const m = nodes[j];
                    const dx = n.x - m.x;
                    const dy = n.y - m.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.35;
                        ctx.strokeStyle = `rgba(${n.c}, ${alpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(m.x, m.y);
                        ctx.stroke();
                    }
                }
            }

            // Nodos
            for (const n of nodes) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${n.c}, 0.9)`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(${n.c}, 0.8)`;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Partículas ascendentes
            for (const p of particles) {
                p.y += p.vy;
                if (p.y < -10) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(245, 211, 107, ${p.a})`;
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(245, 211, 107, 0.8)';
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            rafId = requestAnimationFrame(step);
        }

        function onMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        }
        function onMouseLeave() { mouse.x = null; mouse.y = null; }

        function start() {
            resize();
            step();
            window.addEventListener('resize', resize);
            canvas.addEventListener('mousemove', onMouseMove);
            canvas.addEventListener('mouseleave', onMouseLeave);
        }

        // Pausar si la pestaña no está visible (ahorro de recursos)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (rafId) cancelAnimationFrame(rafId);
            } else if (!rafId) {
                step();
            }
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    }

    // Tilt 3D en feature cards
    function initCardTilt() {
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mx', x + 'px');
                card.style.setProperty('--my', y + 'px');
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const rx = ((y - cy) / cy) * -3;
                const ry = ((x - cx) / cx) * 3;
                card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCardTilt);
    } else {
        initCardTilt();
    }

    initHeroCanvas();
})();
