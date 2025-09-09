document.addEventListener('DOMContentLoaded', async ()=>{
  getCart();
  const content = document.getElementById('tabContent');
  const userEmail = document.getElementById('userEmail');
  const avatar = document.getElementById('avatar');
  const avatarInput = document.getElementById('avatarInput');

  if(!currentUser){
    content.innerHTML = '<div class="glass p-4 rounded-2xl">Please <a class="underline text-yellow-300" href="login.html">login</a>.</div>';
  }else{
    userEmail.textContent = currentUser.email;
  }

  document.getElementById('logoutBtn').onclick = ()=> auth.signOut().then(()=> location.href='index.html');

  document.querySelectorAll('.tab-btn').forEach(btn=> btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if(tab==='info'){
      content.innerHTML = '<div class="p-3">Update coming soon.</div>';
    }else if(tab==='orders'){
      loadOrders();
    }else if(tab==='wishlist'){
      content.innerHTML = '<div class="p-3">Wishlist coming soon.</div>';
    }else{
      content.innerHTML = '<div class="p-3">Settings coming soon.</div>';
    }
  }));
  document.querySelector('.tab-btn[data-tab="info"]').click();

  avatarInput.addEventListener('change', async (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const res = await uploadToCloudinary(file, 'shop_unsigned');
    avatar.src = res.secure_url;
    if(currentUser){
      await db.ref('users/'+currentUser.uid+'/avatar').set(res.secure_url);
    }
  });

  async function loadOrders(){
    if(!currentUser){ content.innerHTML = '<div class="glass p-4 rounded-2xl">Login to view orders.</div>'; return; }
    const snap = await db.ref('orders').orderByChild('email').equalTo(currentUser.email).once('value');
    const list = []; snap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
    if(list.length===0){ content.innerHTML = '<div class="glass p-3 rounded-2xl">No orders yet.</div>'; return; }
    content.innerHTML = list.map(o=>`<div class="glass p-3 rounded-2xl space-y-1">
      <div class="flex items-center justify-between">
        <div>Order <span class="badge">#{o.id}</span></div>
        <div class="badge">{status}</div>
      </div>
      <div class="text-sm opacity-80">Items: ${o.items.length} • Total: ${fmt(o.total)}</div>
    </div>`.replace('{status}', o.status)).join('');
  }
});
