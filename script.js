/**
 * Cinematic Birthday Experience Script (Awwwards Edition)
 * Enhancements: Web Audio API (Sound Reactive), Advanced Physics (Friction, Gravity, 3D Petals), Shooting Stars.
 */

document.addEventListener("DOMContentLoaded", () => {
    
    /* =========================================================================
       1. Globals & Setup
       ========================================================================= */
    const UI = {
        preloader: document.getElementById('preloader'),
        openBtn: document.getElementById('open-btn'),
        openingScreen: document.getElementById('opening-screen'),
        mainContent: document.getElementById('main-content'),
        musicToggle: document.getElementById('music-toggle'),
        musicControls: document.getElementById('music-controls'),
        bgMusic: document.getElementById('bg-music'),
        scrollBtn: document.getElementById('scroll-to-letter'),
        heroSection: document.getElementById('hero'),
        cursorGlow: document.getElementById('cursor-glow'),
        typewriterContainer: document.getElementById('typewriter-container'),
        lightbox: document.getElementById('lightbox'),
        lightboxImg: document.getElementById('lightbox-img'),
        lightboxCaption: document.getElementById('lightbox-caption'),
        galleryItems: document.querySelectorAll('.gallery-item'),
        lbClose: document.querySelector('.lightbox-close'),
        lbPrev: document.querySelector('.lightbox-prev'),
        lbNext: document.querySelector('.lightbox-next'),
        heartBtn: document.getElementById('glowing-heart-btn'),
        surpriseScreen: document.getElementById('surprise-screen'),
        bgCanvas: document.getElementById('bg-canvas'),
        fxCanvas: document.getElementById('fx-canvas'),
        moon: document.getElementById('interactive-moon')
    };

    let isOpened = false;
    let isFinale = false;
    let currentPhotoIndex = 0;
    const totalPhotos = UI.galleryItems.length;

    // Preloader Sequence
    setTimeout(() => {
        UI.preloader.style.opacity = '0';
        setTimeout(() => {
            UI.preloader.classList.add('hidden');
            UI.openingScreen.classList.remove('hidden');
        }, 2000);
    }, 4500);

    // Custom Cursor Smoothing
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    
    if (window.matchMedia("(hover: hover)").matches) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth follow
        function renderCursor() {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            UI.cursorGlow.style.transform = `translate(calc(-50% + ${cursorX}px), calc(-50% + ${cursorY}px))`;
            requestAnimationFrame(renderCursor);
        }
        renderCursor();
        
        const clickables = document.querySelectorAll('button, .gallery-item, .pulse-heart, .lightbox-close, .lightbox-prev, .lightbox-next');
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                UI.cursorGlow.style.width = '80px';
                UI.cursorGlow.style.height = '80px';
                UI.cursorGlow.style.background = 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)';
            });
            el.addEventListener('mouseleave', () => {
                UI.cursorGlow.style.width = '300px';
                UI.cursorGlow.style.height = '300px';
                UI.cursorGlow.style.background = 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, rgba(255,255,255,0) 60%)';
            });
        });
    }

    /* =========================================================================
       2. Web Audio API (Sound Reactive Visuals)
       ========================================================================= */
    let audioCtx, analyser, dataArray, audioDataAvg = 0;

    function initAudio() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                const source = audioCtx.createMediaElementSource(UI.bgMusic);
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                analyser.fftSize = 128;
                dataArray = new Uint8Array(analyser.frequencyBinCount);
            } catch(e) {
                console.log("Audio API not supported or blocked by CORS", e);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function updateAudioData() {
        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            // Focus on bass frequencies (lower indices)
            for (let i = 0; i < 15; i++) { sum += dataArray[i]; }
            audioDataAvg = sum / 15;
            
            // Reactivity: scale moon glow slightly with bass
            if(!isOpened && audioDataAvg > 0) {
                const extraGlow = (audioDataAvg / 255) * 60;
                UI.moon.style.boxShadow = `inset -10px -10px 20px rgba(0,0,0,0.5), 0 0 ${40 + extraGlow}px rgba(244, 208, 63, 0.6), 0 0 ${100 + extraGlow*2}px rgba(255, 255, 255, 0.4)`;
            }
            
            // Reactivity: pulse heart at the end
            if(isOpened && !isFinale) {
                const scale = 1 + (audioDataAvg / 255) * 0.3;
                UI.heartBtn.style.transform = `scale(${scale})`;
            }
        }
    }

    /* =========================================================================
       3. Canvas Engine (Advanced Background & Physics)
       ========================================================================= */
    const bgCtx = UI.bgCanvas.getContext('2d');
    const fxCtx = UI.fxCanvas.getContext('2d');
    let width, height;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        UI.bgCanvas.width = width;
        UI.bgCanvas.height = height;
        UI.fxCanvas.width = width;
        UI.fxCanvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Entities Arrays
    const stars = [];
    const shootingStars = [];
    const fireworks = [];
    const particles = [];
    const petals = [];

    // Background Stars
    class Star {
        constructor() {
            this.x = Math.random() * width; this.y = Math.random() * height;
            this.size = Math.random() * 1.5; this.alpha = Math.random();
            this.speed = Math.random() * 0.02 + 0.005; this.dir = Math.random() > 0.5 ? 1 : -1;
        }
        update() {
            this.alpha += this.speed * this.dir;
            if (this.alpha >= 1 || this.alpha <= 0.1) this.dir *= -1;
        }
        draw(ctx) {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`; ctx.fill();
        }
    }

    // Shooting Stars
    class ShootingStar {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width * 1.5;
            this.y = -20;
            this.len = Math.random() * 80 + 20;
            this.speedX = -(Math.random() * 10 + 5);
            this.speedY = Math.random() * 10 + 5;
            this.active = false;
        }
        spawn() { this.active = true; }
        update() {
            if (!this.active) return;
            this.x += this.speedX; this.y += this.speedY;
            if (this.x < -100 || this.y > height + 100) this.reset();
        }
        draw(ctx) {
            if (!this.active) return;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.speedX * 2, this.y - this.speedY * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Glow head
            ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI*2);
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 15; ctx.shadowColor = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
        }
    }

    // Cinematic Fireworks with Trails & Friction
    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.alpha = 1;
            this.friction = 0.95; // realistic slowdown
            this.gravity = 0.05;
            this.decay = Math.random() * 0.015 + 0.01;
            this.history = []; // trails
        }
        update() {
            this.history.push({x: this.x, y: this.y});
            if(this.history.length > 5) this.history.shift();
            
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        draw(ctx) {
            if(this.history.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.history[0].x, this.history[0].y);
                for(let i=1; i<this.history.length; i++) ctx.lineTo(this.history[i].x, this.history[i].y);
                ctx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
                ctx.lineWidth = 2; ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.alpha})`; ctx.shadowBlur=10; ctx.shadowColor=`rgb(${this.color})`; ctx.fill(); ctx.shadowBlur=0;
        }
    }

    class Firework {
        constructor() {
            this.x = Math.random() * width; this.y = height + 10;
            this.targetY = Math.random() * (height*0.4) + height*0.1;
            this.vy = -(Math.random() * 4 + 7);
            this.color = `${Math.floor(Math.random()*100+155)}, ${Math.floor(Math.random()*50+50)}, ${Math.floor(Math.random()*150+105)}`; // Warm Pinks/Golds/Purples
            this.exploded = false;
            this.history = [];
        }
        update() {
            if (!this.exploded) {
                this.history.push({x: this.x, y: this.y});
                if(this.history.length > 8) this.history.shift();
                
                this.vy += 0.08; // gravity on shell
                this.y += this.vy;
                if (this.vy >= 0 || this.y <= this.targetY) {
                    this.exploded = true;
                    this.explode();
                }
            }
        }
        draw(ctx) {
            if (!this.exploded && this.history.length > 1) {
                ctx.beginPath(); ctx.moveTo(this.history[0].x, this.history[0].y);
                for(let i=1; i<this.history.length; i++) ctx.lineTo(this.history[i].x, this.history[i].y);
                ctx.strokeStyle = `rgba(255,200,200,0.6)`; ctx.lineWidth = 2; ctx.stroke();
            }
        }
        explode() {
            // Flash effect
            fxCtx.fillStyle = 'rgba(255,255,255,0.2)';
            fxCtx.fillRect(0,0,width,height);
            for(let i=0; i<80; i++) particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    // 3D Floating Petals
    class Petal {
        constructor() {
            this.x = Math.random() * width; this.y = -20;
            this.size = Math.random() * 10 + 8;
            this.vy = Math.random() * 2 + 1;
            this.vx = Math.random() * 2 - 1;
            this.angle3D = Math.random() * Math.PI * 2;
            this.spinSpeed = (Math.random() - 0.5) * 0.1;
            this.swaySpeed = Math.random() * 0.02 + 0.01;
            this.swayOffset = Math.random() * Math.PI * 2;
        }
        update() {
            this.y += this.vy;
            this.x += this.vx + Math.sin(Date.now() * this.swaySpeed + this.swayOffset);
            this.angle3D += this.spinSpeed;
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Simulate 3D flip
            ctx.scale(Math.cos(this.angle3D), 1);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = 'rgba(255, 77, 133, 0.8)';
            ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(255, 77, 133, 0.5)';
            // Draw petal shape
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(this.size, 0, this.size, this.size);
            ctx.quadraticCurveTo(0, this.size, 0, 0);
            ctx.fill();
            ctx.restore();
        }
    }

    // Init Engine
    for(let i=0; i<200; i++) stars.push(new Star());
    for(let i=0; i<3; i++) shootingStars.push(new ShootingStar());

    function animate() {
        bgCtx.clearRect(0, 0, width, height);
        fxCtx.clearRect(0, 0, width, height);

        updateAudioData();

        // Background
        stars.forEach(star => { star.update(); star.draw(bgCtx); });
        
        if(Math.random() < 0.005) shootingStars[Math.floor(Math.random()*shootingStars.length)].spawn();
        shootingStars.forEach(ss => { ss.update(); ss.draw(bgCtx); });

        // Foreground Effects (Finale)
        if (isFinale) {
            if (Math.random() < 0.06) fireworks.push(new Firework());
            if (Math.random() < 0.2) petals.push(new Petal());

            for (let i = fireworks.length - 1; i >= 0; i--) {
                fireworks[i].update(); fireworks[i].draw(fxCtx);
                if (fireworks[i].exploded) fireworks.splice(i, 1);
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update(); particles[i].draw(fxCtx);
                if (particles[i].alpha <= 0) particles.splice(i, 1);
            }

            for (let i = petals.length - 1; i >= 0; i--) {
                petals[i].update(); petals[i].draw(fxCtx);
                if (petals[i].y > height + 50) petals.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }
    animate();

    /* =========================================================================
       4. Application Logic & Observers
       ========================================================================= */

    UI.openBtn.addEventListener('click', () => {
        isOpened = true;
        initAudio();
        UI.bgMusic.play().catch(e => console.log("Audio autoplay prevented", e));
        UI.musicControls.classList.remove('hidden');
        document.querySelector('.icon-pause').classList.remove('hidden');
        document.querySelector('.icon-play').classList.add('hidden');

        UI.openingScreen.style.opacity = '0';
        UI.openingScreen.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            UI.openingScreen.classList.add('hidden');
            UI.mainContent.classList.remove('hidden');
            setTimeout(() => UI.heroSection.classList.add('hero-visible'), 100);
            
            document.body.style.overflowY = 'auto';
            document.documentElement.style.overflowY = 'auto';
        }, 2500); 
    });

    let isPlaying = true;
    UI.musicToggle.addEventListener('click', () => {
        if (isPlaying) {
            UI.bgMusic.pause();
            document.querySelector('.icon-pause').classList.add('hidden');
            document.querySelector('.icon-play').classList.remove('hidden');
        } else {
            if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            UI.bgMusic.play();
            document.querySelector('.icon-play').classList.add('hidden');
            document.querySelector('.icon-pause').classList.remove('hidden');
        }
        isPlaying = !isPlaying;
    });

    UI.scrollBtn.addEventListener('click', () => document.getElementById('letter').scrollIntoView({ behavior: 'smooth' }));

    // Typewriter
    let hasTyped = false;
    const letterTextHtml = `
        <span class="letter-salutation">Dear Pyari Bauni,</span>
        <div class="letter-body">
            Today is a day to celebrate the wonderful person you are.<br><br>
            Some people have a magic about them—they make the world brighter, warmer, and more beautiful just by being in it. You are quietly one of those rare people.<br><br>
            I wanted to create something special, something uniquely yours, to remind you of how much you are cared for and appreciated. I hope this little digital corner brings a genuine smile to your face today.<br><br>
            May your year ahead be filled with peace, exciting adventures, and endless joy. Never lose that beautiful spark.
        </div>
        <div class="letter-closing">
            Happy Birthday,<br>
            With warmest wishes.
        </div>
    `;

    async function typeWriterEffect(element, htmlContent, speed = 25) {
        element.innerHTML = '';
        let i = 0, isTag = false, tag = '';
        return new Promise((resolve) => {
            function type() {
                if (i < htmlContent.length) {
                    let char = htmlContent.charAt(i);
                    if (char === '<') isTag = true;
                    if (isTag) {
                        tag += char;
                        if (char === '>') { isTag = false; element.innerHTML += tag; tag = ''; }
                    } else { element.innerHTML += char; }
                    i++; setTimeout(type, isTag ? 0 : speed + (Math.random()*15)); // Randomize type speed slightly for realism
                } else {
                    element.innerHTML += '<span class="typewriter-cursor"></span>';
                    resolve();
                }
            }
            type();
        });
    }

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('glass-card')) {
                    entry.target.classList.add('visible');
                    if (entry.target.classList.contains('letter-card') && !hasTyped) {
                        hasTyped = true;
                        setTimeout(() => typeWriterEffect(UI.typewriterContainer, letterTextHtml, 30), 800);
                    }
                }
                if (entry.target.classList.contains('section-title') || entry.target.classList.contains('gallery-item')) {
                    if (entry.target.classList.contains('gallery-item')) {
                        const index = entry.target.getAttribute('data-index');
                        setTimeout(() => entry.target.classList.add('visible'), index * 200); // Stagger
                    } else {
                        entry.target.classList.add('visible');
                    }
                }
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.glass-card, .section-title, .gallery-item').forEach(el => scrollObserver.observe(el));

    /* =========================================================================
       5. Gallery Lightbox Logic (With Captions)
       ========================================================================= */
    const galleryData = Array.from(UI.galleryItems).map(item => ({
        src: item.querySelector('img').src,
        caption: item.querySelector('.photo-caption-hover').innerText
    }));

    function openLightbox(index) {
        currentPhotoIndex = index;
        UI.lightboxImg.src = galleryData[currentPhotoIndex].src;
        UI.lightboxCaption.innerText = galleryData[currentPhotoIndex].caption;
        UI.lightbox.classList.remove('hidden');
        setTimeout(() => UI.lightbox.classList.add('active'), 
