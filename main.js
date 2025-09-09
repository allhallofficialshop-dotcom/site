<script>
// ================== Shared constants ==================
const CLOUDINARY_CLOUD = "dzgsde4su";
const PRESET_RECEIPT   = "allhall_receipts";
const PRESET_PRODUCT   = "allhall_product";
const PRESET_PROFILE   = "shop_unsigned";

function fmt(n){ return new Intl.NumberFormat('en-LK').format(n) + " LKR"; }

// ================== Cart helpers ==================
function getCart(){
  const c = JSON.parse(localStorage.getItem('cart')||'[]');
  document.querySelectorAll('#navCartCount').forEach(el=> el.textContent = c.length ? '('+c.length+')' : '');
  return c;
}
function setCart(items){ localStorage.setItem('cart', JSON.stringify(items)); getCart(); }
function addToCart(item){
  const c=getCart();
  if(c.length>=50){ alert('Cart max 50 items'); return; }
  c.push(item); setCart(c);
}

// ================== Pricing helpers ==================
function crossed(price, discount){
  if(!discount) return '';
  if(typeof discount === 'object'){
    return discount.type==='percent'
      ? Math.max(0, price*(1-discount.value/100))
      : Math.max(0, price - discount.value);
  }
  return Math.max(0, price*(1-discount/100));
}

// ================== UI templates ==================
function productCard(p){
  const finalPrice = crossed(p.price||0, p.discount) || p.price||0;
  const hasDiscount = !!p.discount;
  const badgeVal = (typeof p.discount==='object')
    ? (p.discount.type==='fixed' ? (p.discount.value+' LKR') : (p.discount.value+'%'))
    : (p.discount? (p.discount+'%') : '');
  const badge = hasDiscount ? `<span class='badge absolute left-2 top-2'>-${badgeVal}</span>` : '';
  const priceHtml = hasDiscount
    ? `<div><span class="opacity-70 line-through mr-2">${fmt(p.price||0)}</span><span class="text-yellow-300">${fmt(finalPrice)}</span></div>`
    : `<div class="text-yellow-300">${fmt(finalPrice)}</div>`;

  return `<div class="glass card rounded-2xl overflow-hidden">
    <a href="product.html?id=${p.id}"><img src="${p.images?.[0]||'assets/product-placeholder.png'}" class="w-full h-48 object-cover" alt=""></a>
    <div class="p-3 space-y-1 relative">
      ${badge}
      <a href="product.html?id=${p.id}" class="font-semibold line-clamp-2">${p.name||'Unnamed'}</a>
      ${priceHtml}
      <button class="btn-glow px-3 py-1 rounded-xl"
        onclick='addToCart({id:"${p.id}", name:${JSON.stringify(p.name||"")}, price:${finalPrice}, image:${JSON.stringify(p.images?.[0]||"")}, qty:1, variant:null})'>
        Add
      </button>
    </div>
  </div>`;
}

// ================== Firebase handles (from firebase.js) ==================
// expects global `auth` and `db`
auth.onAuthStateChanged(u=>{ window.currentUser = u || null; });

// admin email encoder helper (roles under /roles/adminEmails/ENC_EMAIL: true)
function encEmail(e){ return (e||'').replaceAll('.', ','); }

// ================== Core fetch utilities ==================
async function fetchAllProducts(limit=200){
  const snap = await db.ref('products').limitToFirst(limit).once('value');
  const list = [];
  snap.forEach(ch => list.push({ id: ch.key, ...ch.val() }));
  return list;
}

async function fetchProductsByCategory(cat, limit=200){
  const all = await fetchAllProducts(limit);
  if(!cat) return all;
  const term = String(cat).toLowerCase();
  return all.filter(p => (p.category||'').toLowerCase() === term);
}

// Search: title + brand + category
async function searchFilter(term){
  term = (term||'').toLowerCase();
  const list = await fetchAllProducts(500);
  if(!term) return list;
  return list.filter(p =>
    (p.name||'').toLowerCase().includes(term) ||
    (p.brand||'').toLowerCase().includes(term) ||
    (p.category||'').toLowerCase().includes(term)
  );
}

// ================== Page bootstraps ==================
async function loadHomeProducts(){
  const grid = document.getElementById('featuredGrid');
  if(!grid) return; // not on index.html
  grid.innerHTML = `<div class="p-4 opacity-70">Loading…</div>`;

  try{
    const items = await fetchAllProducts(200);
    // optional: newest first if you store createdAt
    items.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));

    if(items.length===0){
      grid.innerHTML = `<div class="p-4 opacity-70">No products yet.</div>`;
      return;
    }
    grid.innerHTML = items.map(productCard).join('');
  }catch(err){
    console.error('loadHomeProducts', err);
    grid.innerHTML = `<div class="p-4 text-red-400">Failed to load products.</div>`;
  }
}

async function loadCategoryPage(){
  const grid = document.getElementById('categoryGrid');
  if(!grid) return; // not on categories.html
  const cat = new URLSearchParams(location.search).get('cat')||'';
  grid.innerHTML = `<div class="p-4 opacity-70">Loading…</div>`;

  try{
    const items = await fetchProductsByCategory(cat);
    if(items.length===0){
      grid.innerHTML = `<div class="p-4 opacity-70">No items in this category.</div>`;
      return;
    }
    grid.innerHTML = items.map(productCard).join('');
  }catch(err){
    console.error('loadCategoryPage', err);
    grid.innerHTML = `<div class="p-4 text-red-400">Failed to load category.</div>`;
  }
}

// simple infinite scroll for index & categories (adds 20 per step)
function enableInfiniteScroll(containerId){
  const el = document.getElementById(containerId);
  if(!el) return;
  let rendered = 0;
  let cache = [];

  async function ensure(){
    if(cache.length===0){
      cache = await fetchAllProducts(500);
      cache.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    }
  }
  async function renderMore(){
    await ensure();
    const chunk = cache.slice(rendered, rendered+20);
    rendered += chunk.length;
    if(rendered===chunk.length) el.innerHTML = ''; // first render clears "Loading…"
    el.insertAdjacentHTML('beforeend', chunk.map(productCard).join(''));
  }
  // initial
  renderMore();

  window.addEventListener('scroll', ()=>{
    if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 400){
      renderMore();
    }
  });
}

// ================== Product details utilities ==================
function qs(name){ const p=new URLSearchParams(location.search); return p.get(name); }

// Order ID format AHS-YYYYMMDD-XXXXXX
function makeOrderId(){
  const d = new Date(); const ymd = d.toISOString().slice(0,10).replace(/-/g,''); 
  const rand = Math.random().toString(36).slice(2,8).toUpperCase();
  return `AHS-${ymd}-${rand}`;
}

// Cloudinary unsigned upload
async function uploadToCloudinary(file, preset){
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  const r = await fetch(url, { method:'POST', body: fd });
  if(!r.ok) throw new Error('Upload failed');
  return r.json();
}

// ================== Boot ==================
document.addEventListener('DOMContentLoaded', ()=>{
  getCart(); // update header count

  // Home
  if(document.getElementById('featuredGrid')){
    // if you want paging: enableInfiniteScroll('featuredGrid'); else:
    loadHomeProducts();
  }

  // Categories
  if(document.getElementById('categoryGrid')){
    loadCategoryPage();
  }
});
</script>
