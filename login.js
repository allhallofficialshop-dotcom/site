document.addEventListener('DOMContentLoaded', ()=>{
  getCart();
  document.getElementById('loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    try{
      await auth.signInWithEmailAndPassword(email, pass);
      location.href = 'profile.html';
    }catch(err){ alert(err.message); }
  });
  document.getElementById('googleBtn').addEventListener('click', async ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    try{
      await auth.signInWithPopup(provider);
      location.href = 'profile.html';
    }catch(err){ alert(err.message); }
  });
});
