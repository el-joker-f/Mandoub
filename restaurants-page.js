/* MANDOUB - final restaurant card renderer */
import { auth, db as userDb } from './auth.js';
import { getDoc, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

(async function(){
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const wait=()=>new Promise(resolve=>{if(window.firebaseReady)return resolve(true);let n=0,t=setInterval(()=>{if(window.firebaseReady){clearInterval(t);resolve(true)}else if(++n>80){clearInterval(t);resolve(false)}},100)});
  if(!(await wait()))return;
  const firestore=window.firebaseDB;
  const {collection,getDocs}=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js');
  let restaurants=[],offers=[],favorites=[];

  async function loadFavorites(){
    const u=auth.currentUser;
    if(!u){try{favorites=JSON.parse(localStorage.getItem('mandoub_fav_restaurants')||'[]')}catch{favorites=[]}return}
    try{const s=await getDoc(doc(userDb,'customers',u.uid));favorites=s.exists()?(s.data().favoriteRestaurants||[]):[]}catch{favorites=[]}
  }
  async function toggleFavorite(id){
    const s=new Set(favorites);s.has(id)?s.delete(id):s.add(id);favorites=[...s];
    const u=auth.currentUser;
    if(u)await setDoc(doc(userDb,'customers',u.uid),{favoriteRestaurants:favorites,updatedAt:serverTimestamp()},{merge:true});
    else localStorage.setItem('mandoub_fav_restaurants',JSON.stringify(favorites));
    render();
  }
  window.toggleRestaurantFavorite=id=>toggleFavorite(id).catch(console.error);
  function activeOffer(o){
    if(o.active===false)return false;
    const now=Date.now();
    const start=o.startAt?.toDate?o.startAt.toDate().getTime():o.startAt?new Date(o.startAt).getTime():0;
    const end=o.endAt?.toDate?o.endAt.toDate().getTime():o.endAt?new Date(o.endAt).getTime():0;
    return(!start||now>=start)&&(!end||now<=end);
  }
  try{const s=await getDocs(collection(firestore,'restaurants'));restaurants=s.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.active!==false)}catch(e){console.error(e);document.getElementById('restaurantsContainer').innerHTML='<div class="restaurants-message">❌ تعذر تحميل المطاعم</div>';return}
  try{const s=await getDocs(collection(firestore,'offers'));offers=s.docs.map(d=>({id:d.id,...d.data()})).filter(activeOffer)}catch{offers=[]}
  await loadFavorites();

  const container=document.getElementById('restaurantsContainer'),search=document.getElementById('search'),typeButtons=document.querySelectorAll('#typeFilters .pill'),foodFilters=document.getElementById('foodFilters');
  const foodTypes=[...new Set(restaurants.map(r=>r.foodCategory||r.category).filter(Boolean))];
  foodFilters.innerHTML='<button class="pill active" data-food="all">كل الأنواع</button>'+foodTypes.map(x=>`<button class="pill" data-food="${esc(x)}">${esc(x)}</button>`).join('');
  let businessType=new URLSearchParams(location.search).get('type')||'all',foodType='all';
  function filters(){typeButtons.forEach(b=>b.classList.toggle('active',b.dataset.type===businessType));foodFilters.querySelectorAll('.pill').forEach(b=>b.classList.toggle('active',b.dataset.food===foodType))}
  function render(){
    const q=(search?.value||'').trim().toLowerCase();
    const list=restaurants.filter(r=>{const typeOk=businessType==='all'||(r.businessType||'restaurant')===businessType;const foodOk=foodType==='all'||(r.foodCategory||r.category||'')===foodType;const text=`${r.name||''} ${r.category||''} ${r.foodCategory||''}`.toLowerCase();return typeOk&&foodOk&&(!q||text.includes(q))});
    const cards=list.map(r=>{
      const offer=offers.find(o=>o.restaurantId===r.id);
      const delivery=window.getMandoubDelivery?.(r);
      const fee=delivery?.fee??r.deliveryFee;
      const deliveryText=fee===-1?'🚫 خارج نطاق التوصيل':fee!=null?`🚚 ${Number(fee).toLocaleString('ar-EG')} ج.م`:'📍 حدد موقعك للتوصيل';
      const id=esc(r.id),name=esc(r.name||'مطعم'),rating=esc(r.rating||'—'),time=esc(r.deliveryTime||'30');
      return `<article class="mandoub-rest-card" onclick="location.href='restaurant-menu.html?id=${encodeURIComponent(r.id)}'" role="link" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')location.href='restaurant-menu.html?id=${encodeURIComponent(r.id)}'">
        <div class="mandoub-rest-image"><img src="${esc(r.image||'assets/logo.png')}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='assets/logo.png'"></div>
        <div class="mandoub-rest-info">
          <div class="mandoub-rest-title"><strong>${name}</strong>${offer?'<span class="mandoub-offer-mini">عرض</span>':''}</div>
          <div class="mandoub-rest-meta"><span>★ ${rating}</span><span>• ${time} دقيقة</span><span>• ${fee!=null&&fee!==-1?Number(fee).toLocaleString('ar-EG')+' ج.م':''}</span></div>
          <div class="mandoub-rest-delivery">${deliveryText}</div>
          ${offer?`<a class="mandoub-rest-offer" href="offers.html?restaurantId=${encodeURIComponent(r.id)}" onclick="event.stopPropagation()">🎁 ${esc(offer.discount?`خصم ${offer.discount}%`:offer.title||'عرض متاح')}</a>`:''}
        </div>
        <button class="mandoub-rest-fav ${favorites.includes(r.id)?'active':''}" onclick="event.stopPropagation();toggleRestaurantFavorite('${id}')" aria-label="مفضلة">${favorites.includes(r.id)?'♥':'♡'}</button>
      </article>`;
    }).join('');
    container.innerHTML=`<div class="mandoub-rest-list"><div class="mandoub-list-title"><div><b>مطاعم وأماكن قريبة منك</b><small>${list.length} مكان متاح الآن</small></div><span>✨</span></div>${cards||'<div class="restaurants-message">لا توجد نتائج مطابقة حاليًا.</div>'}</div>`;
  }
  typeButtons.forEach(b=>b.onclick=()=>{businessType=b.dataset.type;filters();render()});
  foodFilters.addEventListener('click',e=>{const b=e.target.closest('.pill');if(!b)return;foodType=b.dataset.food;filters();render()});
  search?.addEventListener('input',render);window.addEventListener('mandoubLocationChanged',render);
  try{const {onAuthStateChanged}=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');onAuthStateChanged(auth,async()=>{await loadFavorites();render()})}catch{}
  filters();render();
})();
