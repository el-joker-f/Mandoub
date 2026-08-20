/* MANDOUB - unified cart / Talabat-style bottom sheet */
(function(){
  const KEY='mandoub_cart_v2';
  let cart=load();
  let customerCoords=loadCoords();

  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
  function save(){localStorage.setItem(KEY,JSON.stringify(cart));updateCount();window.dispatchEvent(new CustomEvent('mandoubCartChanged'))}
  function loadCoords(){try{return JSON.parse(localStorage.getItem('mandoub_location_coords')||'null')}catch{return null}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function count(){return cart.reduce((s,x)=>s+Number(x.quantity||0),0)}
  function subtotal(){return cart.reduce((s,x)=>s+(Number(x.price)||0)*Number(x.quantity||0),0)}
  function updateCount(){const e=document.getElementById('cartCount');if(e)e.textContent=count();const t=document.getElementById('cartSystemTotal');if(t)t.textContent=subtotal().toLocaleString('ar-EG')+' جنيه'}
  function fee(km){if(km==null)return null;if(km<=3)return 25;if(km<=5)return 30;if(km<=7)return 35;if(km<=9)return 45;if(km<=15)return 55;return -1}
  function distance(a,b){const R=6371,rad=Math.PI/180;const dLat=(b.lat-a.lat)*rad,dLon=(b.lng-a.lng)*rad;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
  function setCustomerCoords(lat,lng){customerCoords={lat:Number(lat),lng:Number(lng)};localStorage.setItem('mandoub_location_coords',JSON.stringify(customerCoords));window.dispatchEvent(new CustomEvent('mandoubLocationChanged'))}

  window.setMandoubLocation=function(){if(!navigator.geolocation){alert('جهازك لا يدعم تحديد الموقع');return}const msg=document.getElementById('locationMsg');if(msg)msg.textContent='📍 جاري تحديد موقعك...';navigator.geolocation.getCurrentPosition(async p=>{setCustomerCoords(p.coords.latitude,p.coords.longitude);const text=`${p.coords.latitude}, ${p.coords.longitude}`;localStorage.setItem('mandoub_location',text);const input=document.getElementById('locationInput');if(input)input.value='تم تحديد موقعك 📍';if(msg)msg.textContent='✅ تم تحديد موقعك بنجاح';try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}&accept-language=ar`);const d=await r.json();if(d.display_name){localStorage.setItem('mandoub_location',d.display_name);if(input)input.value=d.display_name}}catch{}},e=>{if(msg)msg.textContent=e.code===1?'❌ اسمح للموقع بالوصول إلى موقعك':'❌ تعذر تحديد موقعك'},{enableHighAccuracy:true,timeout:15000,maximumAge:0})};
  if(document.getElementById('locationInput'))window.setLocation=window.setMandoubLocation;
  window.getMandoubCart=()=>cart;
  window.getMandoubDelivery=restaurant=>{if(!customerCoords||!Number(restaurant?.latitude)||!Number(restaurant?.longitude))return{distance:null,fee:null};const km=distance(customerCoords,{lat:Number(restaurant.latitude),lng:Number(restaurant.longitude)});return{distance:km,fee:fee(km)}};

  window.addToCart=function(product,restaurant){
    if(!product||!restaurant)return;
    if(cart.length&&cart[0].restaurantId!==restaurant.id){alert(`⚠️ السلة تحتوي منتجات من «${cart[0].restaurantName}».\nلا يمكن خلط طلبين من مطعمين مختلفين.\nافتح السلة وافرغها أولاً ثم اختر من «${restaurant.name}».`);return}
    const old=cart.find(x=>x.productId===product.id);
    if(old)old.quantity++;else cart.push({productId:product.id,restaurantId:restaurant.id,restaurantName:restaurant.name,name:product.name,price:Number(product.price)||0,image:product.image||'',quantity:1});
    save();
  };
  window.clearMandoubCart=function(){cart=[];save();renderSheet()};
  window.changeMandoubQty=function(id,delta){const x=cart.find(i=>i.productId===id);if(!x)return;x.quantity+=delta;if(x.quantity<=0)cart=cart.filter(i=>i.productId!==id);save();renderSheet()};
  window.removeMandoubItem=function(id){cart=cart.filter(i=>i.productId!==id);save();renderSheet()};

  function ensureSheet(){
    if(document.getElementById('mandoubCartSheet'))return;
    const style=document.createElement('style');
    style.id='mandoubCartStyle';
    style.textContent=`#mandoubCartSheet{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.62);display:none;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px)}#mandoubCartSheet.show{display:flex}#mandoubCartPanel{width:min(620px,100%);max-height:88vh;overflow:auto;background:#061b2e;color:#fff;border-radius:26px 26px 0 0;border:1px solid #16415e;border-bottom:0;box-shadow:0 -18px 55px #000b;animation:mandoubSheetUp .22s ease-out;padding:18px 18px 22px}@keyframes mandoubSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}.mcs-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:1px solid #16415e}.mcs-head h2{margin:0;font-size:22px}.mcs-close{width:40px;height:40px;border:0;border-radius:12px;background:#102f45;color:#fff;font-size:24px;cursor:pointer}.mcs-restaurant{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;color:#a9bbc7}.mcs-clear{border:1px solid #8d3150;background:#481527;color:#ffb0c4;border-radius:10px;padding:8px 11px;font-weight:800;cursor:pointer}.mcs-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid #15364d}.mcs-main{display:flex;align-items:center;gap:11px;min-width:0}.mcs-main img{width:62px;height:62px;border-radius:14px;object-fit:cover;background:#09243a}.mcs-main strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcs-main small{display:block;color:#91a4b3;margin-top:5px}.mcs-qty{display:flex;align-items:center;gap:6px}.mcs-qty button{border:0;border-radius:9px;min-width:36px;height:36px;font-weight:900;font-size:17px;cursor:pointer}.mcs-plus,.mcs-minus{background:#00dfff;color:#00121d}.mcs-delete{background:#481527;color:#ffb0c4}.mcs-qty b{min-width:22px;text-align:center}.mcs-summary{padding-top:12px}.mcs-row{display:flex;justify-content:space-between;padding:5px 0;color:#cbd8df}.mcs-row.total{font-size:21px;font-weight:900;color:#00dfff;border-top:1px solid #16415e;margin-top:7px;padding-top:11px}.mcs-checkout{width:100%;border:0;border-radius:14px;background:#00dfff;color:#00121d;padding:15px;margin-top:13px;font-size:17px;font-weight:900;cursor:pointer}.mcs-empty{text-align:center;padding:50px 15px;color:#91a4b3}.mcs-empty strong{display:block;color:#fff;font-size:18px;margin:10px 0 5px}@media(max-width:520px){#mandoubCartPanel{max-height:92vh;border-radius:22px 22px 0 0;padding:15px}.mcs-item{align-items:flex-start}.mcs-qty{flex-wrap:wrap;justify-content:flex-end}.mcs-main img{width:54px;height:54px}}`;
    document.head.appendChild(style);
    const sheet=document.createElement('div');sheet.id='mandoubCartSheet';sheet.innerHTML='<div id="mandoubCartPanel"><div class="mcs-head"><h2>🛒 سلة الطلب</h2><button class="mcs-close" type="button" id="mcsClose">×</button></div><div id="mandoubCartContent"></div></div>';
    document.body.appendChild(sheet);
    document.getElementById('mcsClose').onclick=window.closeMandoubCart;
    sheet.onclick=e=>{if(e.target===sheet)window.closeMandoubCart()};
  }

  function renderSheet(){
    ensureSheet();
    const box=document.getElementById('mandoubCartContent');
    if(!cart.length){box.innerHTML='<div class="mcs-empty">🛒<strong>السلة فارغة</strong><span>أضف منتجات من المطاعم وستظهر هنا</span></div>';updateCount();return}
    const r=window.__selectedRestaurant&&window.__selectedRestaurant.id===cart[0].restaurantId?window.__selectedRestaurant:null;
    const d=r?window.getMandoubDelivery(r):{fee:null};
    const feeText=d.fee===-1?'غير متاح لأكثر من 15 كم':d.fee==null?'حدد موقعك لمعرفة الرسوم':d.fee+' جنيه';
    const total=d.fee>0?subtotal()+d.fee:subtotal();
    box.innerHTML='<div class="mcs-restaurant"><strong>'+esc(cart[0].restaurantName)+'</strong><button class="mcs-clear" type="button" onclick="clearMandoubCart()">تفريغ السلة</button></div>'+cart.map(x=>'<div class="mcs-item"><div class="mcs-main">'+(x.image?'<img src="'+esc(x.image)+'" alt="">':'')+'<div><strong>'+esc(x.name)+'</strong><small>'+Number(x.price).toLocaleString('ar-EG')+' جنيه للقطعة</small></div></div><div class="mcs-qty"><button class="mcs-minus" onclick="changeMandoubQty(\''+esc(x.productId)+'\',-1)">−</button><b>'+x.quantity+'</b><button class="mcs-plus" onclick="changeMandoubQty(\''+esc(x.productId)+'\',1)">+</button><button class="mcs-delete" onclick="removeMandoubItem(\''+esc(x.productId)+'\')">حذف</button></div></div>').join('')+'<div class="mcs-summary"><div class="mcs-row"><span>المنتجات</span><b>'+subtotal().toLocaleString('ar-EG')+' جنيه</b></div><div class="mcs-row"><span>رسوم التوصيل</span><b>'+feeText+'</b></div><div class="mcs-row total"><span>الإجمالي</span><b>'+total.toLocaleString('ar-EG')+' جنيه</b></div></div><button class="mcs-checkout" type="button" onclick="openCheckout()">إتمام الطلب</button>';
    updateCount();
  }

  window.openMandoubCart=function(){ensureSheet();renderSheet();document.getElementById('mandoubCartSheet').classList.add('show');document.body.style.overflow='hidden'};
  window.closeMandoubCart=function(){const s=document.getElementById('mandoubCartSheet');if(s)s.classList.remove('show');document.body.style.overflow=''};
  window.openCart=window.openMandoubCart;
  window.openCheckout=function(){if(!cart.length){window.openMandoubCart();return}window.closeMandoubCart();location.href='checkout.html'};
  window.renderMandoubCart=function(){updateCount();if(document.getElementById('mandoubCartSheet')?.classList.contains('show'))renderSheet()};
  window.addEventListener('mandoubCartChanged',function(){updateCount();if(document.getElementById('mandoubCartSheet')?.classList.contains('show'))renderSheet()});
  window.addEventListener('mandoubLocationChanged',function(){if(document.getElementById('mandoubCartSheet')?.classList.contains('show'))renderSheet()});
  document.addEventListener('DOMContentLoaded',function(){cart=load();customerCoords=loadCoords();updateCount()});
})();