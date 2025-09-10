document.addEventListener('DOMContentLoaded', () => {
  getCart();

  const avatar = document.getElementById('avatar');
  const fileInput = document.getElementById('fileInput');
  const logoutBtn = document.getElementById('logoutBtn');
  const tabBtns = document.querySelectorAll('[data-tab]');
  const tabContent = document.getElementById('tabContent');

  // ========== Load User ==========
  auth.onAuthStateChanged(async user => {
    if(!user){
      location.href = "login.html";
      return;
    }

    // Avatar
    avatar.src = user.photoURL || "assets/avatar-placeholder.png";

    // Tab default
    loadTab('info', user);
  });

  // ========== Avatar Upload ==========
  fileInput?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if(!file) return;
    try {
      const res = await uploadToCloudinary(file, PRESET_PROFILE);
      await auth.currentUser.updateProfile({ photoURL: res.secure_url });
      avatar.src = res.secure_url;
      alert('Profile picture updated!');
    } catch(err){
      console.error(err);
      alert('Upload failed.');
    }
  });

  // ========== Logout ==========
  logoutBtn?.addEventListener('click', ()=> auth.signOut());

  // ========== Tab Buttons ==========
  tabBtns.forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const tab = btn.getAttribute('data-tab');
      const user = auth.currentUser;
      if(user) loadTab(tab, user);
    });
  });

  // ========== Tab Content Loader ==========
  async function loadTab(tab, user){
    if(tab === 'info'){
      tabContent.innerHTML = `
        <div class="p-4">
          <h3 class="font-semibold mb-2">Personal Info</h3>
          <p><b>Email:</b> ${user.email}</p>
          <p><b>Name:</b> ${user.displayName || 'Not set'}</p>
        </div>`;
    }
    if(tab === 'orders'){
      const snap = await db.ref('orders').orderByChild('user').equalTo(user.uid).once('value');
      const orders=[]; snap.forEach(ch=> orders.push({id:ch.key, ...ch.val()}));
      tabContent.innerHTML = orders.length
        ? orders.map(o=> `<div class="glass p-3 rounded-xl mb-2"><b>${o.id}</b> - ${o.status||'Pending'}</div>`).join('')
        : `<div class="p-4 opacity-70">No orders found.</div>`;
    }
    if(tab === 'wishlist'){
      const snap = await db.ref('wishlists/'+user.uid).once('value');
      const list=[]; snap.forEach(ch=> list.push(ch.val()));
      tabContent.innerHTML = list.length
        ? list.map(p=> productCard(p)).join('')
        : `<div class="p-4 opacity-70">No items in wishlist.</div>`;
    }
    if(tab === 'settings'){
      tabContent.innerHTML = `
        <div class="p-4">
          <h3 class="font-semibold mb-2">Settings</h3>
          <button onclick="auth.currentUser.delete().then(()=>location.href='index.html')" class="btn-glow px-4 py-2 rounded-xl">Delete Account</button>
        </div>`;
    }
  }
});
