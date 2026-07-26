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
