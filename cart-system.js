/* MANDOUB - unified cart */
(function(){
  const KEY='mandoub_cart_v2';
  let cart=load();
  let customerCoords=loadCoords();
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
  function save(){localStorage.setItem(KEY,JSON.stringify(cart));updateCount();window.dispatchEvent(new CustomEvent('mandoubCartChanged'))}
  function loadCoords(){try{return JSON.parse(localStorage.getItem('mandoub_location_coords')||'null')}catch{return null}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function count(){return cart.reduce((s,x)=>s+x.quantity,0)}
  function updateCount(){const e=document.getElementById('cartCount');if(e)e.textContent=count()}
  function fee(km){if(km==null)return null;if(km<=3)return 25;if(km<=5)return 30;if(km<=7)return 35;if(km<=9)return 45;if(km<=15)return 55;return -1}
  function distance(a,b){const R=6371,rad=Math.PI/180;const dLat=(b.lat-a.lat)*rad,dLon=(b.lng-a.lng)*rad;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
  function setCustomerCoords(lat,lng){customerCoords={lat:Number(lat),lng:Number(lng)};localStorage.setItem('mandoub_location_coords',JSON.stringify(customerCoords));window.dispatchEvent(new CustomEvent('mandoubLocationChanged'))}
  window.setMandoubLocation=function(){if(!navigator.geolocation){alert('جهازك لا يدعم تحديد الموقع');return}const msg=document.getElementById('locationMsg');if(msg)msg.textContent='📍 جاري تحديد موقعك...';navigator.geolocation.getCurrentPosition(async p=>{setCustomerCoords(p.coords.latitude,p.coords.longitude);const text=`${p.coords.latitude}, ${p.coords.longitude}`;localStorage.setItem('mandoub_location',text);const input=document.getElementById('locationInput');if(input)input.value='تم تحديد موقعك 📍';if(msg)msg.textContent='✅ تم تحديد موقعك بنجاح';try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}&accept-language=ar`);const d=await r.json();if(d.display_name){localStorage.setItem('mandoub_location',d.display_name);if(input)input.value=d.display_name}}catch{}},e=>{if(msg)msg.textContent=e.code===1?'❌ اسمح للموقع بالوصول إلى موقعك':'❌ تعذر تحديد موقعك'},{enableHighAccuracy:true,timeout:15000,maximumAge:0})};
  if(document.getElementById('locationInput'))window.setLocation=window.setMandoubLocation;
  window.getMandoubCart=()=>cart;
  window.getMandoubDelivery=restaurant=>{if(!customerCoords||!Number(restaurant?.latitude)||!Number(restaurant?.longitude))return{distance:null,fee:null};const km=distance(customerCoords,{lat:Number(restaurant.latitude),lng:Number(restaurant.longitude)});return{distance:km,fee:fee(km)}};
  window.addToCart=function(product,restaurant){
    if(!product||!restaurant)return;
    if(cart.length&&cart[0].restaurantId!==restaurant.id){alert(`⚠️ السلة تحتوي منتجات من «${cart[0].restaurantName}».\nلا يمكن خلط طلبين من مطعمين مختلفين.\nافرغ السلة أولاً ثم اختر من «${restaurant.name}».`);return}
    const old=cart.find(x=>x.productId===product.id);
    if(old)old.quantity++;else cart.push({productId:product.id,restaurantId:restaurant.id,restaurantName:restaurant.name,name:product.name,price:Number(product.price)||0,image:product.image||'',quantity:1});
    save();
  };
  window.clearMandoubCart=function(){cart=[];save()};
  window.changeMandoubQty=function(id,delta){const x=cart.find(i=>i.productId===id);if(!x)return;x.quantity+=delta;if(x.quantity<=0)cart=cart.filter(i=>i.productId!==id);save()};
  window.removeMandoubItem=function(id){cart=cart.filter(i=>i.productId!==id);save()};
  function embeddedCart(){return document.getElementById('restaurantCart')}
  function renderEmbedded(){
    const box=embeddedCart();if(!box)return;
    updateCount();
    if(!cart.length){box.innerHTML='';return}
    const restaurant=window.__selectedRestaurant;
    const d=restaurant?window.getMandoubDelivery(restaurant):{distance:null,fee:null};
    const subtotal=cart.reduce((s,x)=>s+x.price*x.quantity,0);
    const feeText=d.fee===-1?'غير متاح لأكثر من 15 كم':d.fee==null?'حدد موقعك لمعرفة الرسوم':`${d.fee} جنيه`;
    const total=d.fee>0?subtotal+d.fee:subtotal;
    box.innerHTML=`<div class="restaurant-cart-head"><div><h3>🛒 سلة الطلب</h3><small>${esc(cart[0].restaurantName)}</small></div><button type="button" class="clear-cart-button" onclick="clearMandoubCart()">🗑️ تفريغ السلة</button></div><div>${cart.map(x=>`<div class="restaurant-cart-item"><div>${x.image?`<img src="${esc(x.image)}">`:''}<div><strong>${esc(x.name)}</strong><small>${x.price} ج × ${x.quantity}</small></div></div><div class="qty"><button class="qty-plus" onclick="changeMandoubQty('${x.productId}',1)">+</button><b>${x.quantity}</b><button class="qty-minus" onclick="changeMandoubQty('${x.productId}',-1)">−</button><button class="item-delete" onclick="removeMandoubItem('${x.productId}')">حذف</button></div></div>`).join('')}</div><div class="restaurant-cart-summary"><div>المنتجات <b>${subtotal.toLocaleString('ar-EG')} ج</b></div><div>المسافة <b>${d.distance==null?'—':d.distance.toFixed(2)+' كم'}</b></div><div>رسوم التوصيل <b>${feeText}</b></div><div class="grand">الإجمالي <b>${total.toLocaleString('ar-EG')} ج</b></div></div><button class="checkout-button" onclick="openCheckout()">إتمام الطلب</button><p id="restaurantCartMsg"></p>`;
  }
  window.openCart=function(){location.href='cart.html'};
  window.openCheckout=function(){if(!cart.length){location.href='cart.html';return}location.href='checkout.html'};
  window.renderMandoubCart=renderEmbedded;
  window.submitMandoubOrder=window.openCheckout;
  window.addEventListener('mandoubCartChanged',renderEmbedded);
  window.addEventListener('mandoubLocationChanged',renderEmbedded);
  document.addEventListener('DOMContentLoaded',()=>{cart=load();customerCoords=loadCoords();updateCount();renderEmbedded()});
})();