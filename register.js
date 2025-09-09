document.addEventListener('DOMContentLoaded', ()=>{
  getCart();
  document.getElementById('registerForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const first = document.getElementById('regFirst').value.trim();
    const last = document.getElementById('regLast').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const age = document.getElementById('regAge').value.trim();
    const gender = document.getElementById('regGender').value;
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    try{
      const {user} = await auth.createUserWithEmailAndPassword(email, pass);
      await db.ref('users/'+user.uid).set({ first, last, phone, age, gender, email });
      location.href = 'profile.html';
    }catch(err){ alert(err.message); }
  });
});
