const text =
"Dear Pyari Bauni 💜,\n\nWishing you a day filled with smiles, happiness, peace and beautiful memories. May every dream you have find its way to reality.\n\n✨ Happy Birthday! ✨";

let i = 0;

const typing = document.getElementById("typing");

typing.innerHTML = "";

function typeWriter() {
    if (i < text.length) {
        typing.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, 35);
    }
}

window.onload = () => {
    setTimeout(typeWriter, 1500);
};

document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("message").scrollIntoView({
        behavior: "smooth"
    });
});

document.getElementById("cakeBtn").addEventListener("click", () => {
    alert("🎉 Happy Birthday Pyari Bauni! Make a beautiful wish! 💜");
});button{
  margin-top:30px;
  padding:14px 35px;
  border:none;
  border-radius:50px;
  background:#ff4dd2;
  color:#fff;
  font-size:18px;
  cursor:pointer;
  transition:.3s;
}

button:hover{
  transform:scale(1.08);
  box-shadow:0 0 25px #ff4dd2;
    }
