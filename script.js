document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==========================================================================
    // 1. STATE & DOM CACHING
    // ==========================================================================
    const DOM = {
        body: document.body,
        preloader: document.getElementById('preloader'),
        smoothWrapper: document.getElementById('smooth-wrapper'),
        introScene: document.getElementById('scene-intro'),
        beginBtn: document.getElementById('begin-journey-btn'),
        audio: document.getElementById('cinematic-score'),
        soundToggle: document.getElementById('sound-toggle'),
        progressBar: document.getElementById('scroll-progress'),
        globalUi: document.querySelector('.global-ui'),
        cursor: document.getElementById('custom-cursor'),
        cursorRing: document.querySelector('.cursor-ring'),
        cursorDot: document.querySelector('.cursor-dot'),
        canvas: document.getElementById('webgl-canvas'),
        typewriter: document.getElementById('main-letter-text'),
        parallaxLayers: document.querySelectorAll('.parallax-layer'),
        scenes: document.querySelectorAll('.cinematic-scene')
    };

    const STATE = {
        isMobile: window.innerWidth <= 768,
        isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
        audioContext: null,
        isPlaying: false,
        scrollY: 0,
        targetScrollY: 0,
        scrollDelta: 0,
        mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        cursorLerp: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        isTyping: false,
        rafId: null,
        viewportHeight: window.innerHeight
    };

    // ==========================================================================
    // 2. PRELOADER & INITIALIZATION
    // ==========================================================================
    const initApp = () => {
        // Wait a minimum time for the cinematic loader effect
        setTimeout(() => {
            if (DOM.preloader) {
                DOM.preloader.classList.remove('active');
                setTimeout(() => {
                    DOM.preloader.remove(); // Remove completely from DOM
                    DOM.smoothWrapper.classList.remove('hidden');
                    DOM.body.classList.remove('loading');
                }, 1500);
            }
        }, 3000);
    };

    // Trigger init on load
    window.addEventListener('load', initApp);
    // Fallback if load fails
    setTimeout(initApp, 5000);

    // ==========================================================================
    // 3. AUDIO ENGINE (Web Audio API for iOS compliance)
    // ==========================================================================
    const initAudio = async () => {
        if (!DOM.audio) return;
        
        try {
            if (!STATE.audioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                STATE.audioContext = new AudioContext();
            }
            
            if (STATE.audioContext.state === 'suspended') {
                await STATE.audioContext.resume();
            }
            
            DOM.audio.volume = 0.5;
            await DOM.audio.play();
            STATE.isPlaying = true;
            DOM.soundToggle.classList.add('playing');
        } catch (error) {
            console.warn("Audio playback prevented:", error);
        }
    };

    const toggleAudio = () => {
        if (!DOM.audio) return;
        if (STATE.isPlaying) {
            DOM.audio.pause();
            STATE.isPlaying = false;
            DOM.soundToggle.classList.remove('playing');
        } else {
            DOM.audio.play();
            STATE.isPlaying = true;
            DOM.soundToggle.classList.add('playing');
        }
    };

    if (DOM.soundToggle) {
        DOM.soundToggle.addEventListener('click', toggleAudio);
    }

    // ==========================================================================
    // 4. ENTER JOURNEY (Button Logic)
    // ==========================================================================
    if (DOM.beginBtn) {
        DOM.beginBtn.addEventListener('click', () => {
            initAudio();
            
            // Fade out intro, unlock scroll
            DOM.introScene.style.opacity = '0';
            DOM.introScene.style.pointerEvents = 'none';
            
            setTimeout(() => {
                DOM.introScene.classList.remove('lock-scroll');
                DOM.introScene.style.display = 'none';
                DOM.globalUi.classList.remove('hidden');
                
                // Start Render Loop once in the experience
                startRenderLoop();
            }, 1200);
        });
    }

    // ==========================================================================
    // 5. CUSTOM MAGNETIC CURSOR
    // ==========================================================================
    if (!STATE.isTouch && DOM.cursor) {
        window.addEventListener('mousemove', (e) => {
            STATE.mouse.x = e.clientX;
            STATE.mouse.y = e.clientY;
            
            // Instant snap for dot
            if (DOM.cursorDot) {
                DOM.cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
            }
        });

        // Hover states for interactive elements
        const interactiveElements = document.querySelectorAll('button, a, .sound-toggle, .glass-panel, .polaroid-frame');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => DOM.cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => DOM.cursor.classList.remove('hovering'));
        });

        // Magnetic Button Effect
        if (DOM.beginBtn) {
            DOM.beginBtn.addEventListener('mousemove', (e) => {
                const rect = DOM.beginBtn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                DOM.beginBtn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            
            DOM.beginBtn.addEventListener('mouseleave', () => {
                DOM.beginBtn.style.transform = `translate(0px, 0px)`;
            });
        }
    }

    // ==========================================================================
    // 6. INTERSECTION OBSERVERS (Scene triggers, 3D letter, Typing)
    // ==========================================================================
    const sceneObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scene-active');
                entry.target.setAttribute('data-visible', 'true');
            } else {
                entry.target.setAttribute('data-visible', 'false');
            }
        });
    }, { threshold: 0.15 });

    DOM.scenes.forEach(scene => sceneObserver.observe(scene));

    // Specific observer for the 3D Glass Letter
    const letterEl = document.querySelector('.glass-letter');
    if (letterEl) {
        const letterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    letterEl.classList.add('in-view');
                    if (!STATE.isTyping) {
                        STATE.isTyping = true;
                        startTypewriter();
                    }
                }
            });
        }, { threshold: 0.4 });
        letterObserver.observe(letterEl);
    }

    // ==========================================================================
    // 7. CINEMATIC TYPEWRITER EFFECT
    // ==========================================================================
    const letterText = "My Dearest Pyari Bauni,\n\nBefore you scroll any further, I want you to know something.\n\nYou are the most beautiful chapter of my life. This little universe... I built it just for you.\n\nTake your time, listen to the music, and let me show you how I see you.\n\nHappy Birthday, my love. ❤️";
    
    function startTypewriter() {
        if (!DOM.typewriter) return;
        let charIndex = 0;
        
        function type() {
            if (charIndex < letterText.length) {
                const char = letterText.charAt(charIndex);
                DOM.typewriter.innerHTML += char === '\n' ? '<br>' : char;
                charIndex++;
                
                // Randomize typing speed for human feel (30ms to 80ms)
                const speed = Math.random() * 50 + 30;
                setTimeout(type, speed);
            } else {
                const cursor = document.querySelector('.typing-cursor');
                if (cursor) cursor.style.animation = 'blink 2s step-end infinite';
            }
        }
        setTimeout(type, 1000); // 1 second delay after rotating in
    }

    // ==========================================================================
    // 8. SCROLL & PARALLAX ENGINE (Vanilla requestAnimationFrame)
    // ==========================================================================
    window.addEventListener('scroll', () => {
        STATE.targetScrollY = window.scrollY;
    }, { passive: true });

    function updateParallax() {
        // Linear Interpolation (Lerp) for smooth scroll feel
        STATE.scrollDelta = STATE.targetScrollY - STATE.scrollY;
        STATE.scrollY += STATE.scrollDelta * 0.1; // 0.1 is the easing factor
        
        // Update Scroll Progress Bar
        if (DOM.progressBar) {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (STATE.scrollY / maxScroll) * 100;
            DOM.progressBar.style.height = `${Math.min(100, Math.max(0, progress))}%`;
        }

        // Apply Parallax to active scenes only for performance
        DOM.parallaxLayers.forEach(layer => {
            // Find parent scene
            const parentScene = layer.closest('.cinematic-scene');
            if (parentScene && parentScene.getAttribute('data-visible') === 'true') {
                const speed = parseFloat(layer.getAttribute('data-speed')) || 1;
                
                // Calculate distance from center of viewport
                const rect = layer.getBoundingClientRect();
                const centerOffset = (rect.top + rect.height / 2) - (STATE.viewportHeight / 2);
                
                // Core parallax formula
                const yOffset = centerOffset * (1 - speed);
                
                layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
            }
        });
    }

    // ==========================================================================
    // 9. HIGH-PERFORMANCE CANVAS ENGINE (Stars, Floating Dust)
    // ==========================================================================
    let ctx, w, h;
    let particles = [];

    function initCanvas() {
        if (!DOM.canvas) return;
        ctx = DOM.canvas.getContext('2d', { alpha: false });
        resizeCanvas();
        
        window.addEventListener('resize', () => {
            STATE.viewportHeight = window.innerHeight;
            resizeCanvas();
        }, { passive: true });

        // Generate particles based on device capability
        const count = STATE.isMobile ? 80 : 200;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function resizeCanvas() {
        w = DOM.canvas.width = window.innerWidth;
        h = DOM.canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * (w || window.innerWidth);
            this.y = Math.random() * (h || window.innerHeight);
            this.z = Math.random() * 2 + 0.1; // Depth (Parallax factor)
            this.size = (Math.random() * 1.5 + 0.5) / this.z;
            this.alpha = Math.random();
            this.targetAlpha = Math.random();
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
        }

        update() {
            // Natural drift
            this.x += this.vx;
            this.y += this.vy;

            // React to Scroll (Parallax depth effect)
            // Faster particles are "closer"
            this.y -= (STATE.scrollDelta * 0.05) / this.z;

            // React to Mouse subtly
            if (!STATE.isTouch) {
                const dx = STATE.mouse.x - this.x;
                const dy = STATE.mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    this.x -= (dx / dist) * 0.5;
                    this.y -= (dy / dist) * 0.5;
                }
            }

            // Twinkle effect
            this.alpha += (this.targetAlpha - this.alpha) * 0.02;
            if (Math.abs(this.alpha - this.targetAlpha) < 0.1) {
                this.targetAlpha = Math.random();
            }

            // Screen Wrap
            if (this.x < 0) this.x = w;
            if (this.x > w) this.x = 0;
            if (this.y < 0) this.y = h;
            if (this.y > h) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(253, 245, 201, ${this.alpha * 0.8})`;
            ctx.fill();
        }
    }

    function renderCanvas() {
        if (!ctx) return;
        
        // Deep cinematic background redraw
        ctx.fillStyle = '#020104'; 
        ctx.fillRect(0, 0, w, h);
        
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h));
        grad.addColorStop(0, '#080a14');
        grad.addColorStop(1, '#020104');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'screen';
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        
        ctx.globalCompositeOperation = 'source-over';
    }

    // ==========================================================================
    // 10. MASTER RENDER LOOP (RAF)
    // ==========================================================================
    function startRenderLoop() {
        initCanvas();
        
        function tick() {
            // Update Cursor Lerp
            if (!STATE.isTouch && DOM.cursorRing) {
                STATE.cursorLerp.x += (STATE.mouse.x - STATE.cursorLerp.x) * 0.15;
                STATE.cursorLerp.y += (STATE.mouse.y - STATE.cursorLerp.y) * 0.15;
                DOM.cursorRing.style.transform = `translate(${STATE.cursorLerp.x}px, ${STATE.cursorLerp.y}px) translate(-50%, -50%)`;
            }

            updateParallax();
            renderCanvas();
            
            STATE.rafId = requestAnimationFrame(tick);
        }
        tick();
    }

    // Pause heavy calculations when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(STATE.rafId);
            if (STATE.isPlaying && DOM.audio) DOM.audio.pause();
        } else {
            if (DOM.introScene.style.display === 'none') {
                startRenderLoop();
            }
            if (STATE.isPlaying && DOM.audio) DOM.audio.play();
        }
    });
});
