/* Restaurant cards -> dedicated restaurant menu page */
(async function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>Number(n||0).toLocaleString('ar-EG')+' ج';
  const wait=()=>new Promise(resolve=>{if(window.firebaseReady)return resolve(true);let n=0;const t=setInterval(()=>{if(window.firebaseReady){clearInterval(t);resolve(true)}else if(++n>60){clearInterval(t);resolve(false)}},100)});
  if(!(await wait())){document.getElementById('restaurantsContainer').innerHTML='<div class="restaurants-message">❌ تعذر الاتصال بقاعدة البيانات</div>';return}
  const db=window.firebaseDB,col=window.firebaseCollection,getDocs=(await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js')).getDocs;
  let restaurants=[];
  try{const s=await getDocs(col(db,'restaurants'));restaurants=s.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.active!==false)}catch(e){console.error(e);document.getElementById('restaurantsContainer').innerHTML='<div class="restaurants-message">❌ تعذر تحميل المطاعم</div>';return}
  const container=document.getElementById('restaurantsContainer');
  container.innerHTML=`<div class="restaurant-picker" id="restaurantPicker">${restaurants.map(r=>`<a class="restaurant-choice" href="restaurant-menu.html?id=${encodeURIComponent(r.id)}"><img src="${esc(r.image||'assets/logo.png')}" alt="${esc(r.name)}"><div style="flex:1"><strong>${esc(r.name)}</strong><small>${esc(r.category||'مطعم')} ${r.rating?`★ ${esc(r.rating)}`:''}</small><small class="delivery-preview" data-id="${esc(r.id)}">🚚 حساب التوصيل حسب موقعك</small></div><span style="font-size:22px;color:#00dfff">←</span></a>`).join('')||'<div class="restaurants-message">لا توجد مطاعم متاحة حالياً.</div>'}</div>`;
  function renderDelivery(){document.querySelectorAll('.delivery-preview').forEach(e=>{const r=restaurants.find(x=>x.id===e.dataset.id);const d=window.getMandoubDelivery?.(r);if(d?.fee===-1)e.textContent=`🚫 ${d.distance.toFixed(1)} كم — خارج نطاق التوصيل`;else if(d?.fee!=null)e.textContent=`🚚 ${d.fee} ج • ${d.distance.toFixed(1)} كم`;else e.textContent='🚚 حدد موقعك لمعرفة رسوم التوصيل'})}
  renderDelivery();window.addEventListener('mandoubLocationChanged',renderDelivery);window.addEventListener('mandoubCartChanged',renderDelivery);
})();