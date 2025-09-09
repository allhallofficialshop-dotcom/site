document.addEventListener('DOMContentLoaded', async () => {
  getCart();
  const grid = document.getElementById('catProductGrid');
  const loader = document.getElementById('catLoader');
  const sortSel = document.getElementById('sortSelect');
  const cat = new URLSearchParams(location.search).get('cat');

  let all=[]; let lastKey=null; let busy=false;
  async function fetchAll(){
    const snap = await db.ref('products').orderByChild('category').equalTo(cat || '').once('value');
    const list = []; snap.forEach(ch=> list.push({id:ch.key, ...ch.val()}));
    all = list;
  }

  function applySort(){
    const v = sortSel.value;
    const items = [...all];
    if(v==='priceAsc') items.sort((a,b)=>(a.price||0)-(b.price||0));
    if(v==='priceDesc') items.sort((a,b)=>(b.price||0)-(a.price||0));
    if(v==='rating') items.sort((a,b)=>(b.rating||0)-(a.rating||0));
    if(v==='brand') items.sort((a,b)=> (a.brand||'').localeCompare(b.brand||''));
    grid.innerHTML = items.map(productCard).join('');
  }

  await fetchAll(); applySort();
  sortSel.addEventListener('change', applySort);
});
