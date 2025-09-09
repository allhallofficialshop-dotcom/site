document.addEventListener('DOMContentLoaded', ()=>{
  const orderId = localStorage.getItem('lastOrderId');
  const btFile = document.getElementById('btFile');
  const btn = document.getElementById('btUpload');
  const msg = document.getElementById('btMsg');
  if(!orderId){ msg.textContent='No pending bank transfer order found.'; return; }
  btn.addEventListener('click', async ()=>{
    const f = btFile.files?.[0]; if(!f){ alert('Select receipt image'); return; }
    try{
      const up = await uploadToCloudinary(f, 'allhall_receipts');
      await db.ref('orders/'+orderId+'/receiptUrl').set(up.secure_url);
      await db.ref('orders/'+orderId+'/status').set('pending'); // will be reviewed by admin
      msg.textContent='Receipt uploaded ✓. We will verify and update your order.';
      // notify admin again
      const snap = await db.ref('orders/'+orderId).once('value');
      const o = snap.val();
      await fetch('https://formspree.io/f/mgvldedw',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:o.email, message:'Bank transfer receipt uploaded for '+orderId})});
      localStorage.removeItem('cart');
    }catch(e){ alert('Upload failed'); }
  });
});
