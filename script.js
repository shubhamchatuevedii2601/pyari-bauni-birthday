document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==========================================================================
    // 1. DOM ELEMENTS & STATE MANAGEMENT
    // ==========================================================================
    const DOM = {
        preloader: document.getElementById('preloader'),
        appContainer: document.getElementById('app-container'),
        openingScreen: document.getElementById('opening-screen'),
        heroScreen: document.getElementById('hero-screen'),
        openBtn: document.getElementById('open-surprise-btn'),
        bgMusic: document.getElementById('bg-music'),
        mouseGlow: document.getElementById('mouse-glow'),
        typewriterText: document.getElementById('typewriter-text'),
        galleryItems: document.querySelectorAll('.gallery-item img'),
        modal: document.getElementById('image-modal'),
        modalImage: document.getElementById('modal-image'),
        closeModal: document.querySelector('.close-modal'),
        modalLoader: document.querySelector('.modal-loader'),
        canvas: document.getElementById('effects-canvas'),
        cssParticles: document.getElementById('css-particles'),
        screens: document.querySelectorAll('.screen')
    };

    const STATE = {
        isMobile: window.innerWidth <= 768,
        typewriterStarted: false,
        fireworksActive: false,
        audioInitialized: false,
        sourceConnected: false,
        isTouchDevice: false,
        isTabActive: true,
        musicData: 0,
        particleInterval: null,
        animFrameId: null
    };

    // ==========================================================================
    // 2. IMAGE PRELOADING & ERROR HANDLING
    // ==========================================================================
    if (DOM.galleryItems.length > 0) {
        DOM.galleryItems.forEach(img => {
            if (img.complete && img.naturalWidth !== 0) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
                img.addEventListener('error', () => {
                    img.style.display = 'none'; 
                    if (img.parentElement) {
                        img.parentElement.style.background = 'linear-gradient(45deg, #140826, #220e42)';
                        img.parentElement.insertAdjacentHTML('beforeend', 
                            '<span style="color:var(--gold); position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; font-size:0.85rem; padding:10px;">Memory ❤️</span>'
                        );
                    }
                }, { once: true });
            }
        });
    }

    // ==========================================================================
    // 3. PRELOADER LOGIC (Strictly 3 Seconds)
    // ==========================================================================
    setTimeout(() => {
        if (DOM.preloader) {
            DOM.preloader.classList.remove('active');
            setTimeout(() => {
                DOM.preloader.classList.add('hidden');
                if (DOM.appContainer) {
                    DOM.appContainer.classList.remove('hidden');
                }
            }, 1500);
        }
    }, 3000);

    // ==========================================================================
    // 4. AUDIO & INTERACTION LOGIC (iOS Safari Compatible)
    // ==========================================================================
    let audioCtx, analyser, dataArray;

    function initWebAudioAPI() {
        if (STATE.sourceConnected || !DOM.bgMusic) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
            
            // Critical for Mobile Safari
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaElementSource(DOM.bgMusic);
            
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            
            analyser.fftSize = 128;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            STATE.audioInitialized = true;
            STATE.sourceConnected = true;
            
            analyzeAudio();
        } catch (e) {
            // Graceful fallback if Web Audio API is restricted
            STATE.audioInitialized = false;
        }
    }

    function analyzeAudio() {
        if (!STATE.audioInitialized || !STATE.isTabActive) return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        STATE.musicData = sum / dataArray.length;
        
        requestAnimationFrame(analyzeAudio);
    }

    if (DOM.openBtn) {
        DOM.openBtn.addEventListener('click', () => {
            // Prevent double taps
            DOM.openBtn.disabled = true;
            DOM.openBtn.style.pointerEvents = 'none';

            if (DOM.bgMusic) {
                DOM.bgMusic.volume = 0.6;
                const playPromise = DOM.bgMusic.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        initWebAudioAPI();
                    }).catch(() => {
                        // Audio blocked fallback
                    });
                }
            }

            // Smooth transition
            DOM.openingScreen.style.opacity = '0';
            setTimeout(() => {
                DOM.openingScreen.classList.add('hidden');
                DOM.openingScreen.classList.remove('active');
                if (DOM.heroScreen) {
                    DOM.heroScreen.classList.add('active');
                    DOM.heroScreen.scrollIntoView({ behavior: 'smooth' });
                }
                
                initCanvasEffects();
                startCSSParticles();
            }, 1000);
        });
    }

    // ==========================================================================
    // 5. TOUCH & MOUSE GLOW LOGIC
    // ==========================================================================
    window.addEventListener('touchstart', () => {
        STATE.isTouchDevice = true;
        if (DOM.mouseGlow) DOM.mouseGlow.style.display = 'none';
    }, { once: true, passive: true });

    if (DOM.mouseGlow) {
        document.addEventListener('mousemove', (e) => {
            if (STATE.isTouchDevice || !STATE.isTabActive) return;
            DOM.mouseGlow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
        }, { passive: true });
    }

    // ==========================================================================
    // 6. SCROLL OBSERVATION & ANIMATIONS
    // ==========================================================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const screenObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                if (entry.target.id === 'letter-screen' && !STATE.typewriterStarted) {
                    STATE.typewriterStarted = true;
                    typeLetter();
                }
            }

            // Toggle fireworks strictly when final scene is in view to save resources
            if (entry.target.id === 'final-screen') {
                STATE.fireworksActive = entry.isIntersecting;
            }
        });
    }, observerOptions);

    if (DOM.screens) {
        DOM.screens.forEach(screen => {
            if (screen.id !== 'opening-screen') screenObserver.observe(screen);
        });
    }

    // ==========================================================================
    // 7. TYPEWRITER EFFECT
    // ==========================================================================
    const letterContent = "My Dearest Pyari Bauni,\n\nOn this magical night, under the gentle glow of the moon, I want to take a moment to celebrate you. You bring so much light, warmth, and beauty into my world. Every memory we share is a treasure, and your smile is my favorite sight.\n\nMay this year bring you all the love and happiness you deserve.\n\nHappy Birthday, my love! ❤️";
    let charIndex = 0;

    function typeLetter() {
        if (!DOM.typewriterText) return;
        if (charIndex < letterContent.length) {
            DOM.typewriterText.innerHTML += letterContent.charAt(charIndex) === '\n' ? '<br>' : letterContent.charAt(charIndex);
            charIndex++;
            setTimeout(typeLetter, 40);
        } else {
            const cursor = document.getElementById('typewriter-cursor');
            if (cursor) cursor.style.display = 'none';
        }
    }

    // ==========================================================================
    // 8. GALLERY MODAL
    // ==========================================================================
    if (DOM.modal && DOM.galleryItems.length > 0) {
        const hideModal = () => {
            DOM.modal.classList.add('hidden');
            document.body.style.overflow = '';
            
            setTimeout(() => { 
                if (DOM.modalImage) {
                    DOM.modalImage.src = ''; 
                    DOM.modalImage.classList.remove('loaded');
                }
            }, 500);
        };

        DOM.galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                if (!item.classList.contains('loaded')) return;
                
                document.body.style.overflow = 'hidden';
                DOM.modal.classList.remove('hidden');
                if (DOM.modalLoader) DOM.modalLoader.classList.remove('hidden');
                
                DOM.modalImage.src = item.src;
                
                DOM.modalImage.onload = () => {
                    if (DOM.modalLoader) DOM.modalLoader.classList.add('hidden');
                    DOM.modalImage.classList.add('loaded');
                };

                DOM.modalImage.onerror = () => {
                    if (DOM.modalLoader) DOM.modalLoader.classList.add('hidden');
                    hideModal();
                };
            });
        });

        if (DOM.closeModal) DOM.closeModal.addEventListener('click', hideModal);
        
        DOM.modal.addEventListener('click', (e) => {
            if (e.target === DOM.modal || e.target.classList.contains('modal-content-wrapper')) {
                hideModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !DOM.modal.classList.contains('hidden')) hideModal();
        });
    }

    // ==========================================================================
    // 9. HARDWARE-ACCELERATED CSS PARTICLES
    // ==========================================================================
    function startCSSParticles() {
        if (!DOM.cssParticles || STATE.particleInterval) return;
        
        const spawnRate = STATE.isMobile ? 1200 : 600; 
        
        STATE.particleInterval = setInterval(() => {
            if (!STATE.isTabActive) return;

            const particle = document.createElement('div');
            particle.className = 'css-particle';
            particle.innerHTML = Math.random() > 0.5 ? '❤️' : '✨';
            
            const size = Math.random() * 15 + 10;
            const startPosX = Math.random() * window.innerWidth;
            const duration = Math.random() * 5000 + 5000;
            
            particle.style.cssText = `
                left: ${startPosX}px;
                top: -30px;
                font-size: ${size}px;
                transition: transform ${duration}ms linear, opacity ${duration}ms ease-in-out;
                filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.5));
            `;
            
            DOM.cssParticles.appendChild(particle);
            
            requestAnimationFrame(() => {
                particle.style.opacity = '0.6';
                particle.style.transform = `translate3d(${(Math.random() - 0.5) * 150}px, ${window.innerHeight + 50}px, 0) rotate(${Math.random() * 360}deg)`;
            });

            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, duration);

        }, spawnRate);
    }

    // ==========================================================================
    // 10. CANVAS HIGH-PERFORMANCE PHYSICS & VISIBILITY HANDLING
    // ==========================================================================
    let ctx, w, h;
    let stars = [], fireflies = [], fireworks = [];

    function initCanvasEffects() {
        if (!DOM.canvas) return;
        ctx = DOM.canvas.getContext('2d', { alpha: false });
        
        resizeCanvas();
        
        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 200);
        }, { passive: true });

        const numStars = STATE.isMobile ? 70 : 180;
        const numFireflies = STATE.isMobile ? 12 : 35;

        for (let i = 0; i < numStars; i++) stars.push(new Star());
        for (let i = 0; i < numFireflies; i++) fireflies.push(new Firefly());

        animateCanvas();
    }

    function handleResize() {
        resizeCanvas();
        STATE.isMobile = window.innerWidth <= 768;
    }

    function resizeCanvas() {
        w = DOM.canvas.width = window.innerWidth;
        h = DOM.canvas.height = window.innerHeight;
    }

    class Star {
        constructor() {
            this.x = Math.random() * (w || window.innerWidth);
            this.y = Math.random() * (h || window.innerHeight);
            this.r = Math.random() * 1.5;
            this.alpha = Math.random();
            this.speed = (Math.random() * 0.015) + 0.005;
        }
        update() {
            this.alpha += this.speed;
            if (this.alpha >= 1 || this.alpha <= 0) this.speed *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x % w, this.y % h, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(this.alpha)})`;
            ctx.fill();
        }
    }

    class Firefly {
        constructor() {
            this.x = Math.random() * (w || window.innerWidth);
            this.y = Math.random() * (h || window.innerHeight);
            this.r = Math.random() * 2 + 1;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.alpha = Math.random();
        }
        update() {
            const boost = (STATE.musicData > 100) ? 1.4 : 1;
            
            this.x += this.vx * boost;
            this.y += this.vy * boost;
            
            if (this.x < 0) this.x = w;
            if (this.x > w) this.x = 0;
            if (this.y < 0) this.y = h;
            if (this.y > h) this.y = 0;
            
            this.vx += (Math.random() - 0.5) * 0.05;
            this.vy += (Math.random() - 0.5) * 0.05;
            
            if (this.vx > 0.8) this.vx = 0.8;
            if (this.vx < -0.8) this.vx = -0.8;
            if (this.vy > 0.8) this.vy = 0.8;
            if (this.vy < -0.8) this.vy = -0.8;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            const glow = (STATE.musicData > 120) ? 12 : 6;
            ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
            ctx.shadowBlur = glow;
            ctx.shadowColor = '#d4af37';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    class FireworkParticle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.r = Math.random() * 2 + 1;
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * velocity;
            this.vy = Math.sin(angle) * velocity;
            this.alpha = 1;
            this.decay = Math.random() * 0.02 + 0.015;
            this.gravity = 0.05;
        }
        update() {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${Math.max(0, this.alpha)})`;
            ctx.fill();
        }
    }

    function createFirework() {
        const x = Math.random() * (w * 0.6) + (w * 0.2);
        const y = Math.random() * (h * 0.4) + (h * 0.1);
        const colors = ['212, 175, 55', '253, 245, 201', '255, 255, 255', '180, 130, 255'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const particleCount = STATE.isMobile ? 25 : 50;
        for (let i = 0; i < particleCount; i++) {
            fireworks.push(new FireworkParticle(x, y, color));
        }
    }

    function animateCanvas() {
        if (!STATE.isTabActive) {
            STATE.animFrameId = requestAnimationFrame(animateCanvas);
            return;
        }

        ctx.fillStyle = '#030108'; 
        ctx.fillRect(0, 0, w, h);
        
        const grad = ctx.createRadialGradient(w/2, h, 0, w/2, h, h);
        grad.addColorStop(0, '#140826');
        grad.addColorStop(1, '#030108');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'lighter';

        stars.forEach(s => { s.update(); s.draw(); });
        fireflies.forEach(f => { f.update(); f.draw(); });

        if (STATE.fireworksActive) {
            const chance = (STATE.musicData > 130) ? 0.07 : 0.02;
            if (Math.random() < chance) createFirework();
            
            for (let i = fireworks.length - 1; i >= 0; i--) {
                const p = fireworks[i];
                p.update();
                p.draw();
                if (p.alpha <= 0) fireworks.splice(i, 1);
            }
        }
        
        ctx.globalCompositeOperation = 'source-over';
        STATE.animFrameId = requestAnimationFrame(animateCanvas);
    }

    // ==========================================================================
    // 11. PAGE VISIBILITY MANAGEMENT
    // ==========================================================================
    document.addEventListener('visibilitychange', () => {
        STATE.isTabActive = !document.hidden;
        if (STATE.isTabActive) {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            if (STATE.audioInitialized) {
                analyzeAudio();
            }
        }
    });
});
