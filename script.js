document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==========================================================================
    // 1. STATE & DOM CACHING (Strict Null Checks Applied)
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
        scenes: document.querySelectorAll('.cinematic-scene'),
        glassLetter: document.querySelector('.glass-letter')
    };

    const STATE = {
        isAppInitialized: false,
        isCanvasInitialized: false,
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
    // 2. PRELOADER & INITIALIZATION (Fixed Double Execution)
    // ==========================================================================
    const initApp = () => {
        if (STATE.isAppInitialized) return; // Prevent duplicate triggers
        STATE.isAppInitialized = true;
        
        setTimeout(() => {
            if (DOM.preloader) {
                DOM.preloader.classList.remove('active');
                setTimeout(() => {
                    DOM.preloader.remove(); 
                    if (DOM.smoothWrapper) DOM.smoothWrapper.classList.remove('hidden');
                    if (DOM.body) DOM.body.classList.remove('loading');
                }, 1500);
            }
        }, 3000);
    };

    window.addEventListener('load', initApp);
    setTimeout(initApp, 5000); // Fallback execution

    // ==========================================================================
    // 3. AUDIO ENGINE (Strict Error Handling for iOS)
    // ==========================================================================
    const initAudio = async () => {
        if (!DOM.audio) return;
        
        try {
            if (!STATE.audioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    STATE.audioContext = new AudioContext();
                }
            }
            
            if (STATE.audioContext && STATE.audioContext.state === 'suspended') {
                await STATE.audioContext.resume();
            }
            
            DOM.audio.volume = 0.5;
            const playPromise = DOM.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    STATE.isPlaying = true;
                    if (DOM.soundToggle) DOM.soundToggle.classList.add('playing');
                }).catch(err => console.warn("Audio initiation blocked:", err));
            }
        } catch (error) {
            console.warn("Audio playback prevented:", error);
        }
    };

    const toggleAudio = () => {
        if (!DOM.audio) return;
        if (STATE.isPlaying) {
            DOM.audio.pause();
            STATE.isPlaying = false;
            if (DOM.soundToggle) DOM.soundToggle.classList.remove('playing');
        } else {
            const playPromise = DOM.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    STATE.isPlaying = true;
                    if (DOM.soundToggle) DOM.soundToggle.classList.add('playing');
                }).catch(err => console.warn("Audio play blocked by browser policy:", err));
            }
        }
    };

    if (DOM.soundToggle) {
        DOM.soundToggle.addEventListener('click', toggleAudio);
    }

    // ==========================================================================
    // 4. ENTER JOURNEY (Button Logic & Scroll Unlocking)
    // ==========================================================================
    if (DOM.beginBtn && DOM.introScene) {
        DOM.beginBtn.addEventListener('click', () => {
            initAudio();
            
            DOM.introScene.style.opacity = '0';
            DOM.introScene.style.pointerEvents = 'none';
            
            setTimeout(() => {
                DOM.introScene.classList.remove('lock-scroll');
                DOM.introScene.style.display = 'none'; // Completely removes from layout flow
                if (DOM.globalUi) DOM.globalUi.classList.remove('hidden');
                
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
            
            if (DOM.cursorDot) {
                DOM.cursorDot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
            }
        }, { passive: true });

        const interactiveElements = document.querySelectorAll('button, a, .sound-toggle, .glass-panel, .polaroid-frame');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => DOM.cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => DOM.cursor.classList.remove('hovering'));
        });

        if (DOM.beginBtn) {
            DOM.beginBtn.addEventListener('mousemove', (e) => {
                const rect = DOM.beginBtn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                DOM.beginBtn.style.transform = `translate3d(${x * 0.2}px, ${y * 0.2}px, 0)`;
            }, { passive: true });
            
            DOM.beginBtn.addEventListener('mouseleave', () => {
                DOM.beginBtn.style.transform = `translate3d(0px, 0px, 0)`;
            });
        }
    }

    // ==========================================================================
    // 6. INTERSECTION OBSERVERS
    // ==========================================================================
    if (DOM.scenes.length > 0) {
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
    }

    if (DOM.glassLetter) {
        const letterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    DOM.glassLetter.classList.add('in-view');
                    if (!STATE.isTyping) {
                        STATE.isTyping = true;
                        startTypewriter();
                    }
                }
            });
        }, { threshold: 0.4 });
        letterObserver.observe(DOM.glassLetter);
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
                
                const speed = Math.random() * 50 + 30;
                setTimeout(type, speed);
            } else {
                const cursor = document.querySelector('.typing-cursor');
                if (cursor) cursor.style.animation = 'blink 2s step-end infinite';
            }
        }
        setTimeout(type, 1000); 
    }

    // ==========================================================================
    // 8. SCROLL & PARALLAX ENGINE
    // ==========================================================================
    window.addEventListener('scroll', () => {
        STATE.targetScrollY = window.scrollY;
    }, { passive: true });

    function updateParallax() {
        STATE.scrollDelta = STATE.targetScrollY - STATE.scrollY;
        STATE.scrollY += STATE.scrollDelta * 0.1;
        
        if (DOM.progressBar) {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const progress = (STATE.scrollY / maxScroll) * 100;
            DOM.progressBar.style.height = `${Math.min(100, Math.max(0, progress))}%`;
        }

        if (DOM.parallaxLayers && DOM.parallaxLayers.length > 0) {
            DOM.parallaxLayers.forEach(layer => {
                const parentScene = layer.closest('.cinematic-scene');
                if (parentScene && parentScene.getAttribute('data-visible') === 'true') {
                    const speed = parseFloat(layer.getAttribute('data-speed')) || 1;
                    const rect = layer.getBoundingClientRect();
                    const centerOffset = (rect.top + rect.height / 2) - (STATE.viewportHeight / 2);
                    const yOffset = centerOffset * (1 - speed);
                    
                    layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
                }
            });
        }
    }

    // ==========================================================================
    // 9. HIGH-PERFORMANCE CANVAS ENGINE (Strict Duplication Prevention)
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

        const count = STATE.isMobile ? 60 : 150;
        particles = []; // Ensure clear on re-init
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function resizeCanvas() {
        if (!DOM.canvas) return;
        w = DOM.canvas.width = window.innerWidth;
        h = DOM.canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * (w || window.innerWidth);
            this.y = Math.random() * (h || window.innerHeight);
            this.z = Math.random() * 2 + 0.1; 
            this.size = (Math.random() * 1.5 + 0.5) / this.z;
            this.alpha = Math.random();
            this.targetAlpha = Math.random();
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.y -= (STATE.scrollDelta * 0.05) / this.z;

            if (!STATE.isTouch) {
                const dx = STATE.mouse.x - this.x;
                const dy = STATE.mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    this.x -= (dx / dist) * 0.5;
                    this.y -= (dy / dist) * 0.5;
                }
            }

            this.alpha += (this.targetAlpha - this.alpha) * 0.02;
            if (Math.abs(this.alpha - this.targetAlpha) < 0.1) {
                this.targetAlpha = Math.random();
            }

            if (this.x < 0) this.x = w;
            if (this.x > w) this.x = 0;
            if (this.y < 0) this.y = h;
            if (this.y > h) this.y = 0;
        }

        draw() {
            if (!ctx) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(253, 245, 201, ${this.alpha * 0.8})`;
            ctx.fill();
        }
    }

    function renderCanvas() {
        if (!ctx) return;
        
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
    // 10. MASTER RENDER LOOP & TAB VISIBILITY MANAGEMENT (No Memory Leaks)
    // ==========================================================================
    function startRenderLoop() {
        if (!STATE.isCanvasInitialized) {
            initCanvas();
            STATE.isCanvasInitialized = true;
        }
        
        if (STATE.rafId) {
            cancelAnimationFrame(STATE.rafId);
        }
        
        function tick() {
            if (!STATE.isTouch && DOM.cursorRing) {
                STATE.cursorLerp.x += (STATE.mouse.x - STATE.cursorLerp.x) * 0.15;
                STATE.cursorLerp.y += (STATE.mouse.y - STATE.cursorLerp.y) * 0.15;
                DOM.cursorRing.style.transform = `translate3d(${STATE.cursorLerp.x}px, ${STATE.cursorLerp.y}px, 0) translate(-50%, -50%)`;
            }

            updateParallax();
            renderCanvas();
            
            STATE.rafId = requestAnimationFrame(tick);
        }
        tick();
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (STATE.rafId) cancelAnimationFrame(STATE.rafId);
            if (STATE.isPlaying && DOM.audio) DOM.audio.pause();
        } else {
            // Only restart logic if we have progressed past intro scene
            if (DOM.introScene && DOM.introScene.style.display === 'none') {
                startRenderLoop();
            }
            if (STATE.isPlaying && DOM.audio) {
                const playPromise = DOM.audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => console.warn("Auto-resume blocked:", err));
                }
            }
        }
    });
});
            
