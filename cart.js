function renderCart(){
  const holder = document.getElementById('cartItems');
  const items = getCart();
  if(items.length===0){ holder.innerHTML = '<div class="glass p-4 rounded-2xl">Your cart is empty.</div>'; return; }
  let subtotal = 0;
  holder.innerHTML = items.map((it,i)=>{
    const rowTotal = (it.price||0) * (it.qty||1);
    subtotal += rowTotal;
    return `<div class="glass p-3 rounded-2xl flex items-center gap-3">
      <img src="${it.image||'assets/product-placeholder.png'}" class="h-16 w-16 rounded-xl object-cover">
      <div class="flex-1">
        <div class="font-semibold">${it.name}</div>
        <div class="text-sm opacity-80">Price: ${fmt(it.price)} </div>
        <div class="mt-2 flex items-center gap-2">
          <input type="number" min="1" value="${it.qty||1}" class="input w-24" onchange="updateQty(${i}, this.value)">
          <span class="ml-auto text-yellow-300">{fmt}</span>
        </div>
      </div>
      <button class="glass px-3 py-2 rounded-xl" onclick="removeItem(${i})">Remove</button>
    </div>`.replace('{fmt}', fmt(rowTotal));
  }).join('');
  document.getElementById('cartSubtotal').textContent = fmt(subtotal);
}
function updateQty(idx, val){
  const items = getCart();
  items[idx].qty = Math.max(1, parseInt(val||'1',10));
  setCart(items); renderCart();
}
function removeItem(idx){
  const items = getCart();
  items.splice(idx,1);
  setCart(items); renderCart();
}
document.addEventListener('DOMContentLoaded', ()=>{ getCart(); renderCart(); });
