document.addEventListener('DOMContentLoaded', async ()=>{
  getCart();
  const content = document.getElementById('adminContent');

  function ensureAdmin(u){
    if(!u) { location.href = 'login.html'; return; }
    db.ref('roles/adminEmails/'+encEmail(u.email)).once('value').then(s=>{
      if(!s.val()) location.href = 'index.html';
    });
  }
  auth.onAuthStateChanged(ensureAdmin);

  document.querySelectorAll('.tab-btn').forEach(btn=> btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if(tab==='dash') dash();
    if(tab==='products') products();
    if(tab==='orders') orders();
    if(tab==='users') users();
    if(tab==='categories') categories();
    if(tab==='banners') banners();
  }));
  document.querySelector('.tab-btn[data-tab="dash"]').click();

  async function dash(){
    const os = await db.ref('orders').once('value');
    let pending=0, accepted=0, delivered=0, canceled=0;
    os.forEach(ch=>{
      const st = (ch.val().status||'pending'); 
      if(st==='pending') pending++; if(st==='accepted') accepted++; if(st==='delivered') delivered++; if(st==='canceled') canceled++;
    });
    content.innerHTML = `<div class="grid md:grid-cols-4 gap-3">
      ${cardNum('Pending', pending)}${cardNum('Accepted', accepted)}${cardNum('Delivered', delivered)}${cardNum('Canceled', canceled)}
    </div>`;
  }
  function cardNum(label, val){ return `<div class="glass rounded-2xl p-4 text-center"><div class="text-2xl font-bold text-yellow-300">${val}</div><div class="opacity-80">${label}</div></div>`; }

  async function products(){
    const snap = await db.ref('products').once('value');
    const list=[]; snap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
    content.innerHTML = `<div class="flex justify-between items-center mb-3">
      <h3 class="section-title">Products</h3>
      <button class="btn-glow px-3 py-2 rounded-xl" id="addP">Add Product</button>
    </div>
    <div class="grid md:grid-cols-3 gap-3" id="plist">${list.map(p=>prodCard(p)).join('')}</div>`;
    document.getElementById('addP').onclick = ()=> editProd();
  }
  function prodCard(p){ return `<div class="glass rounded-2xl p-3 space-y-2">
    <img src="${p.images?.[0]||'assets/product-placeholder.png'}" class="w-full h-40 object-cover rounded-xl">
    <div class="font-semibold">${p.name||''}</div>
    <div class="text-yellow-300">${fmt(p.price||0)}</div>
    <div class="flex gap-2">
      <button class="glass px-3 py-1 rounded-xl" onclick='editProd("${p.id}")'>Edit</button>
      <button class="glass px-3 py-1 rounded-xl" onclick='delProd("${p.id}")'>Delete</button>
    </div>
  </div>`; }

  window.editProd = async function(id=null){
    const data = id ? (await db.ref('products/'+id).once('value')).val() : { name:'', price:0, category:'', images:[], colors:[], sizes:[], brand:'', discount:null };
    content.innerHTML = `<div class="glass p-4 rounded-2xl space-y-3">
      <input id="pname" class="input" placeholder="Name" value="${data.name||''}">
      <input id="pbrand" class="input" placeholder="Brand" value="${data.brand||''}">
      <input id="pprice" class="input" type="number" placeholder="Price" value="${data.price||0}">
      <input id="pcategory" class="input" placeholder="Category" value="${data.category||''}">
      <textarea id="pshort" class="input" placeholder="Short description">${data.short||''}</textarea>
      <textarea id="pdesc" class="input" placeholder="Full description">${data.description||''}</textarea>
      <div class="grid md:grid-cols-2 gap-3">
        <div>
          <label class="opacity-80">Colors (comma separated)</label>
          <input id="pcolors" class="input" placeholder="Red,Black,Blue" value="${(data.colors||[]).join(',')}">
        </div>
        <div>
          <label class="opacity-80">Sizes (comma separated)</label>
          <input id="psizes" class="input" placeholder="XS,S,M,L,XL or 28,30,32" value="${(data.sizes||[]).join(',')}">
        </div>
      </div>
      <div class="grid md:grid-cols-3 gap-3">
        <div class="glass p-2 rounded-xl">
          <label class="opacity-80">Discount Type</label>
          <select id="dtype" class="input"><option value="">None</option><option value="percent">Percent</option><option value="fixed">Fixed (LKR)</option></select>
          <input id="dval" type="number" class="input mt-2" placeholder="Value">
        </div>
        <div class="md:col-span-2">
          <input id="pimg" type="file" multiple>
          <div id="imgs" class="flex gap-2 mt-2">${(data.images||[]).map(u=>`<img src="${u}" class="h-16 w-16 rounded object-cover">`).join('')}</div>
        </div>
      </div>
      <div class="flex gap-3">
        <button class="btn-glow px-4 py-2 rounded-xl" id="save">Save</button>
        <button class="glass px-4 py-2 rounded-xl" onclick="history.back()">Back</button>
      </div>
    </div>`;
    document.getElementById('pimg').addEventListener('change', async (e)=>{
      const files=[...e.target.files];
      for(const f of files){
        const up = await uploadToCloudinary(f, 'allhall_product');
        const img = document.createElement('img'); img.src=up.secure_url; img.className='h-16 w-16 rounded object-cover';
        document.getElementById('imgs').appendChild(img);
      }
    });
    document.getElementById('save').onclick = async ()=>{
      const imgs = Array.from(document.querySelectorAll('#imgs img')).map(i=>i.src);
      const dtype = document.getElementById('dtype').value;
      const dval = parseFloat(document.getElementById('dval').value||'0');
      const discount = dtype ? {type:dtype, value:dval} : null;
      const colors = document.getElementById('pcolors').value.split(',').map(s=>s.trim()).filter(Boolean);
      const sizes = document.getElementById('psizes').value.split(',').map(s=>s.trim()).filter(Boolean);
      if(colors.length===0 || sizes.length===0){ alert('Colors and Sizes are required'); return; }
      const payload = {
        name: document.getElementById('pname').value.trim(),
        brand: document.getElementById('pbrand').value.trim(),
        price: parseFloat(document.getElementById('pprice').value||'0'),
        category: document.getElementById('pcategory').value.trim(),
        short: document.getElementById('pshort').value.trim(),
        description: document.getElementById('pdesc').value.trim(),
        images: imgs, colors, sizes, discount
      };
      const ref = id ? db.ref('products/'+id) : db.ref('products').push();
      await ref.set(payload);
      alert('Saved'); location.href='admin.html';
    };
  };

  window.delProd = async function(id){
    if(!confirm('Delete product?')) return;
    await db.ref('products/'+id).remove();
    location.reload();
  };

  async function orders(){
    const snap = await db.ref('orders').once('value');
    const list=[]; snap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
    content.innerHTML = list.map(o=>`<div class="glass p-3 rounded-2xl space-y-1">
      <div class="flex items-center justify-between">
        <div><span class="badge">#{o.id}</span> • ${o.email}</div>
        <select onchange='updateStatus("{id}", this.value)' class="input w-40">
          ${['pending','accepted','delivered','canceled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="text-sm opacity-80">Items: ${o.items.length} • Total: ${fmt(o.total)} • Pay: ${o.payment}</div>
      ${o.receiptUrl?`<a class="underline text-yellow-300 text-sm" href="${o.receiptUrl}" target="_blank">View receipt</a>`:''}
    </div>`.replace('{id}', o.id)).join('');
    window.updateStatus = async (id, st)=>{ await db.ref('orders/'+id+'/status').set(st); };
  }

  async function users(){
    const snap = await db.ref('users').once('value');
    const list=[]; snap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
    content.innerHTML = list.map(u=>`<div class="glass p-3 rounded-2xl flex items-center gap-3">
      <img src="${u.avatar||'assets/profile-placeholder.png'}" class="h-10 w-10 rounded-full object-cover">
      <div class="flex-1">
        <div class="font-semibold">${u.first||''} ${u.last||''}</div>
        <div class="text-sm opacity-80">${u.email||''}</div>
      </div>
    </div>`).join('') || '<div class="glass p-3 rounded-2xl">No users.</div>';
  }

  async function categories(){
    const snap = await db.ref('categories').once('value');
    const list=[]; snap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
    content.innerHTML = `<div class="flex items-center gap-2 mb-3">
      <input id="newCat" class="input flex-1" placeholder="Category name (e.g., Bags, Cloths, Watches)"><button id="addCat" class="btn-glow px-3 py-2 rounded-xl">Add</button>
    </div>
    <div id="clist" class="space-y-2">${list.map(c=>`<div class="glass p-2 rounded-xl flex items-center gap-2">
      <input class="input flex-1" value="${c.name||''}" data-id="${c.id}">
      <button class="glass px-2 py-1 rounded-xl" onclick='saveCat("{id}")'>Save</button>
      <button class="glass px-2 py-1 rounded-xl" onclick='delCat("{id}")'>Delete</button>
    </div>`.replaceAll('{id}', c.id)).join('')}</div>`;
    document.getElementById('addCat').onclick = async ()=>{
      const name = document.getElementById('newCat').value.trim(); if(!name) return;
      await db.ref('categories').push({ name });
      location.reload();
    };
    window.saveCat = async (id)=>{
      const inp = Array.from(document.querySelectorAll('#clist input')).find(i=>i.dataset.id===id);
      await db.ref('categories/'+id+'/name').set(inp.value.trim());
      alert('Saved');
    };
    window.delCat = async (id)=>{ if(confirm('Delete?')){ await db.ref('categories/'+id).remove(); location.reload(); } };
  }

  async function banners(){
    const snap = await db.ref('banners').once('value');
    const list=[]; snap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
    content.innerHTML = `<div class="space-y-3">
      <div><input id="bfile" type="file"><button id="badd" class="btn-glow px-3 py-2 rounded-xl ml-2">Upload</button></div>
      <div id="bgrid" class="grid md:grid-cols-3 gap-3">${list.map(b=>`<div class="glass p-2 rounded-2xl"><img src="${b.url}" class="w-full h-32 object-cover rounded-xl"><button class="glass px-2 py-1 rounded-xl mt-2" onclick='delBanner("{id}")'>Delete</button></div>`.replace('{id}', b.id)).join('')}</div>
    </div>`;
    document.getElementById('badd').onclick = async ()=>{
      const f = document.getElementById('bfile').files?.[0]; if(!f) return;
      const up = await uploadToCloudinary(f, 'allhall_product');
      await db.ref('banners').push({ url: up.secure_url });
      location.reload();
    };
    window.delBanner = async (id)=>{ await db.ref('banners/'+id).remove(); location.reload(); };
  }
});
