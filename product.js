document.addEventListener('DOMContentLoaded', async () => {
  getCart();
  const id = qs('id');
  const wrap = document.getElementById('productDetail');
  const related = document.getElementById('relatedGrid');
  if(!id){ wrap.innerHTML = 'No product id'; return; }
  const snap = await db.ref('products/'+id).once('value');
  const p = {id, ...snap.val()};

  function finalPrice(){
    if(!p.discount) return p.price||0;
    if(typeof p.discount==='object'){
      return p.discount.type==='fixed' ? Math.max(0,(p.price||0)-(p.discount.value||0)) : Math.max(0,(p.price||0)*(1-(p.discount.value||0)/100));
    }
    return Math.max(0,(p.price||0)*(1-(+p.discount)/100));
  }

  wrap.innerHTML = `
    <div class="glass rounded-2xl p-3">
      <img src="${p.images?.[0]||'assets/product-placeholder.png'}" class="w-full rounded-xl object-cover">
      <div class="mt-3 flex gap-2">
        ${(p.images||[]).map(u=>`<img src="${u}" class="h-16 w-16 rounded-lg object-cover">`).join('')}
      </div>
    </div>
    <div class="space-y-3">
      <h1 class="text-xl font-bold">${p.name||''}</h1>
      <div>${p.discount?`<span class='opacity-70 line-through mr-2'>${fmt(p.price||0)}</span>`:''}<span class="text-yellow-300 text-lg">${fmt(finalPrice())}</span></div>
      <div class="opacity-80">${p.short||''}</div>
      <div class="space-y-2">
        <div>Colors: ${(p.colors||[]).map(c=>`<button class="badge mr-2 var-color" data-val="${c}">${c}</button>`).join('')}</div>
        <div>Sizes: ${(p.sizes||[]).map(s=>`<button class="badge mr-2 var-size" data-val="${s}">${s}</button>`).join('')}</div>
      </div>
      <div>
        <label class="opacity-80 text-sm">Qty</label>
        <input id="qty" type="number" min="1" value="1" class="input mt-1 w-24">
      </div>
      <div class="flex gap-3">
        <button class="btn-glow px-4 py-2 rounded-xl" id="addBtn">Add to Cart</button>
        <a class="glass px-4 py-2 rounded-xl" href="checkout.html">Buy Now</a>
        <button class="glass px-4 py-2 rounded-xl" id="shareBtn">Share</button>
      </div>
      <div class="mt-4">
        <button id="descToggle" class="underline text-yellow-300">View full description</button>
        <p id="fulldesc" class="mt-2 hide">${p.description||''}</p>
      </div>
    </div>`;

  let selColor = null, selSize = null;
  document.querySelectorAll('.var-color').forEach(b=> b.onclick=()=>{ selColor=b.dataset.val; document.querySelectorAll('.var-color').forEach(x=>x.classList.remove('active')); b.classList.add('active'); });
  document.querySelectorAll('.var-size').forEach(b=> b.onclick=()=>{ selSize=b.dataset.val; document.querySelectorAll('.var-size').forEach(x=>x.classList.remove('active')); b.classList.add('active'); });

  document.getElementById('descToggle').onclick = ()=> document.getElementById('fulldesc').classList.toggle('hide');
  document.getElementById('addBtn').onclick = ()=> {
    const qty = parseInt(document.getElementById('qty').value||'1',10);
    if(!selColor || !selSize){ alert('Please select color and size'); return; }
    addToCart({id:p.id, name:p.name, price:finalPrice(), image:p.images?.[0]||'', qty, variant:{color:selColor, size:selSize}});
    alert('Added to cart');
  };
  document.getElementById('shareBtn').onclick = async ()=>{
    if(navigator.share){ await navigator.share({ title:p.name, url: location.href }); }
    else { navigator.clipboard.writeText(location.href); alert('Link copied'); }
  };

  const allSnap = await db.ref('products').orderByChild('category').equalTo(p.category||'').limitToFirst(6).once('value');
  const list=[]; allSnap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
  related.innerHTML = list.filter(x=>x.id!==p.id).slice(0,3).map(productCard).join('');
});
