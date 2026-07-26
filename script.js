*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:Arial,sans-serif;
  background:linear-gradient(135deg,#050816,#14002c,#220044);
  color:#fff;
  overflow-x:hidden;
}

section{
  min-height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  flex-direction:column;
  text-align:center;
  padding:20px;
}

h1{
  font-size:3rem;
  color:#ff8be8;
  text-shadow:0 0 20px #ff4dd2;
}

p{
  max-width:700px;
  margin-top:20px;
  line-height:1.8;
  font-size:1.1rem;
}

button{
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
