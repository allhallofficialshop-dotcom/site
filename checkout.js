// delivery: 1-2 = 350, 3-4 = 450, 5 = 550, then every +2 items add +100
function deliveryFee(count){
  if(count<=2) return 350;
  if(count<=4) return 450;
  if(count===5) return 550;
  const extra = count-5;
  return 550 + Math.ceil(extra/2)*100;
}
async function notifyAdmin(email, orderId, data){
  try{
    await fetch('https://formspree.io/f/mgvldedw',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, message: 'New order ID: '+orderId+' | '+JSON.stringify(data) })
    });
  }catch(e){ console.warn('Formspree failed', e); }
}
document.addEventListener('DOMContentLoaded', ()=>{
  const items = getCart();
  const count = items.reduce((a,b)=> a + (b.qty||1), 0);
  const subtotal = items.reduce((a,b)=> a + (b.price||0)*(b.qty||1), 0);
  const ship = deliveryFee(count);
  const total = subtotal + ship;
  document.getElementById('summaryCount').textContent = String(count);
  document.getElementById('summarySubtotal').textContent = fmt(subtotal);
  document.getElementById('summaryDelivery').textContent = fmt(ship);
  document.getElementById('summaryTotal').textContent = fmt(total);

  document.getElementById('checkoutForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payment = (document.querySelector('input[name=pay]:checked')||{}).value;
    const data = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      phone2: document.getElementById('phone2').value.trim(),
      age: document.getElementById('age').value,
      gender: document.getElementById('gender').value,
      address: document.getElementById('address').value.trim(),
      payment, items, subtotal, ship, total, status:'pending',
      createdAt: Date.now()
    };
    const orderId = makeOrderId();
    await db.ref('orders/'+orderId).set(data);
    await notifyAdmin(data.email, orderId, { total, payment });
    localStorage.setItem('lastOrderId', orderId);
    if(payment==='BANK'){ location.href='banktransfer.html'; }
    else { alert('Order placed! ID: '+orderId); localStorage.removeItem('cart'); location.href = 'profile.html'; }
  });
});
