// ==========================
// Moonlit Wishes
// script.js
// ==========================

// Loader
const loader = document.getElementById("loader");
const startBtn = document.getElementById("startBtn");

// Background Music
const music = new Audio("music/birthday.mp3");
music.loop = true;

// Loader click
loader.addEventListener("click", () => {
    loader.style.opacity = "0";

    setTimeout(() => {
        loader.style.display = "none";
    }, 700);

    music.play().catch(() => {});
});

// Button click
if (startBtn) {
    startBtn.addEventListener("click", () => {
        document.querySelector(".letter").scrollIntoView({
            behavior: "smooth"
        });
    });
}

// ==========================
// Typewriter Effect
// ==========================

const text = document.getElementById("typewriter");

if (text) {

    const content = text.innerHTML;

    text.innerHTML = "";

    let i = 0;

    function typing() {

        if (i <  font-size:18px;
  cursor:pointer;
  transition:.3s;
}

button:hover{
  transform:scale(1.08);
  box-shadow:0 0 25px #ff4dd2;
    }
// ==========================
// Fireworks
// ==========================

const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Particle{

    constructor(x,y,color){

        this.x=x;
        this.y=y;

        this.color=color;

        this.radius=2+Math.random()*2;

        this.speedX=(Math.random()-0.5)*8;
        this.speedY=(Math.random()-0.5)*8;

        this.life=100;
    }

    update(){

        this.x+=this.speedX;
        this.y+=this.speedY;

        this.speedY+=0.03;

        this.life--;
    }

    draw(){

        ctx.beginPath();

        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);

        ctx.fillStyle=this.color;

        ctx.fill();

    }

}

const particles=[];

function explode(x,y){

    const colors=[
        "#ff4d6d",
        "#ffd369",
        "#00e5ff",
        "#7dff72",
        "#ffffff"
    ];

    for(let i=0;i<80;i++){

        particles.push(
            new Particle(
                x,
                y,
                colors[Math.floor(Math.random()*colors.length)]
            )
        );

    }

}

function animateFireworks(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let i=particles.length-1;i>=0;i--){

        particles[i].update();
        particles[i].draw();

        if(particles[i].life<=0){

            particles.splice(i,1);

        }

    }

    requestAnimationFrame(animateFireworks);

}

animateFireworks();

// Automatic Fireworks

setInterval(()=>{

    explode(
        Math.random()*canvas.width,
        Math.random()*canvas.height/2
    );

},1800);

// Click Fireworks

window.addEventListener("click",(e)=>{

    explode(e.clientX,e.clientY);

});
