document.addEventListener('DOMContentLoaded', async () => {
  getCart();

  // ========== BANNERS ==========
  const bannerWrap = document.getElementById('bannerSlider');
  const bannersSnap = await db.ref('banners').limitToFirst(5).once('value');
  const banners=[]; bannersSnap.forEach(ch=> banners.push(ch.val()));
  bannerWrap.innerHTML = banners.length
    ? banners.map(b=>`<img class="rounded-2xl glass w-full h-48 md:h-64 object-cover" src="${b.url}">`).join('')
    : '<div class="glass rounded-2xl h-48 md:h-64 flex items-center justify-center col-span-3">Add banners in Admin</div>';

  // ========== CATEGORIES ==========
  const catContainer = document.getElementById('homeCategories');
  const catsSnap = await db.ref('categories').once('value');
  const cats=[]; catsSnap.forEach(ch=> cats.push({id:ch.key, ...ch.val()}));
  const baseCats = cats.length?cats:[{name:'Bags'},{name:'Cloths'},{name:'Watches'}];
  catContainer.innerHTML = baseCats.slice(0,8).map(c=>`
    <a href="categories.html?cat=${encodeURIComponent(c.name)}" class="glass rounded-full aspect-square flex items-center justify-center text-center text-sm hover:scale-105 transition">
      ${c.icon ? `<img src="${c.icon}" class="h-10 w-10 object-contain"/>` : `<span>${c.name}</span>`}
    </a>`).join('');

  // ========== PRODUCTS ==========
  const grid = document.getElementById('productGrid'); 
  const loader = document.getElementById('loader');
  let busy=false;

  async function loadMore(){
    if(busy) return; busy=true; loader.classList.remove('hidden');
    const snap = await db.ref('products').once('value');
    const items=[]; snap.forEach(ch=> items.push({id:ch.key, ...ch.val()}));

    const already = grid.children.length;
    const nextBatch = items.slice(already, already+20);
    nextBatch.forEach(p => grid.innerHTML += productCard(p));

    loader.classList.add('hidden'); busy=false;
  }
  await loadMore();

  window.addEventListener('scroll', ()=>{ 
    if((window.innerHeight + window.scrollY) >= document.body.offsetHeight-200) loadMore(); 
  });

  // ========== SEARCH ==========
  async function doSearch(val){
    const list = await searchFilter(val);
    grid.innerHTML = list.slice(0,60).map(productCard).join('');
  }
  document.getElementById('search')?.addEventListener('input', e=> doSearch(e.target.value));
  document.getElementById('search-m')?.addEventListener('input', e=> doSearch(e.target.value));
});
