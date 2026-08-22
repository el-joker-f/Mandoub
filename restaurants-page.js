/* MANDOUB - compact restaurant cards */
import { auth, db as userDb } from './auth.js';
import { getDoc, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

(async function () {
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const waitFirebase = () => new Promise(resolve => {
    if (window.firebaseReady) return resolve(true);
    let n = 0;
    const timer = setInterval(() => {
      if (window.firebaseReady) { clearInterval(timer); resolve(true); }
      else if (++n > 60) { clearInterval(timer); resolve(false); }
    }, 100);
  });
  if (!(await waitFirebase())) return;

  const firestore = window.firebaseDB;
  const collection = window.firebaseCollection;
  const { getDocs } = await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js');
  let restaurants = [], offers = [], favorites = [];

  async function loadFavorites() {
    const user = auth.currentUser;
    if (!user) {
      try { favorites = JSON.parse(localStorage.getItem('mandoub_fav_restaurants') || '[]'); }
      catch { favorites = []; }
      return;
    }
    try {
      const snap = await getDoc(doc(userDb, 'customers', user.uid));
      favorites = snap.exists() ? (snap.data().favoriteRestaurants || []) : [];
    } catch { favorites = []; }
  }

  async function toggleFavorite(id) {
    const set = new Set(favorites);
    set.has(id) ? set.delete(id) : set.add(id);
    favorites = [...set];
    const user = auth.currentUser;
    if (!user) localStorage.setItem('mandoub_fav_restaurants', JSON.stringify(favorites));
    else await setDoc(doc(userDb, 'customers', user.uid), { favoriteRestaurants: favorites, updatedAt: serverTimestamp() }, { merge: true });
    render();
  }
  window.toggleRestaurantFavorite = id => toggleFavorite(id).catch(console.error);

  function isActiveOffer(o) {
    if (o.active === false) return false;
    const now = Date.now();
    const start = o.startAt?.toDate ? o.startAt.toDate().getTime() : o.startAt ? new Date(o.startAt).getTime() : 0;
    const end = o.endAt?.toDate ? o.endAt.toDate().getTime() : o.endAt ? new Date(o.endAt).getTime() : 0;
    return (!start || now >= start) && (!end || now <= end);
  }

  try {
    const snap = await getDocs(collection(firestore, 'restaurants'));
    restaurants = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.active !== false);
  } catch (e) {
    console.error(e);
    document.getElementById('restaurantsContainer').innerHTML = '<div class="restaurants-message">❌ تعذر تحميل المطاعم</div>';
    return;
  }

  try {
    const snap = await getDocs(collection(firestore, 'offers'));
    offers = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(isActiveOffer);
  } catch (e) { console.warn('offers', e); offers = []; }

  await loadFavorites();

  const container = document.getElementById('restaurantsContainer');
  const search = document.getElementById('search');
  const typeButtons = document.querySelectorAll('#typeFilters .pill');
  const foodFilters = document.getElementById('foodFilters');
  const foodTypes = [...new Set(restaurants.map(r => r.foodCategory || r.category).filter(Boolean))];
  foodFilters.innerHTML = '<button class="pill active" data-food="all">كل الأنواع</button>' + foodTypes.map(x => `<button class="pill" data-food="${esc(x)}">${esc(x)}</button>`).join('');

  let businessType = new URLSearchParams(location.search).get('type') || 'all';
  let foodType = 'all';

  function activeFilters() {
    typeButtons.forEach(b => b.classList.toggle('active', b.dataset.type === businessType));
    foodFilters.querySelectorAll('.pill').forEach(b => b.classList.toggle('active', b.dataset.food === foodType));
  }

  function restaurantOffer(r) { return offers.find(o => o.restaurantId === r.id); }

  function render() {
    const q = (search?.value || '').trim().toLowerCase();
    const list = restaurants.filter(r => {
      const typeOk = businessType === 'all' || (r.businessType || 'restaurant') === businessType;
      const foodOk = foodType === 'all' || (r.foodCategory || r.category || '') === foodType;
      const text = `${r.name || ''} ${r.category || ''} ${r.foodCategory || ''}`.toLowerCase();
      return typeOk && foodOk && (!q || text.includes(q));
    });

    const cards = list.map(r => {
      const offer = restaurantOffer(r);
      const delivery = window.getMandoubDelivery?.(r);
      const deliveryText = delivery?.fee === -1 ? '🚫 خارج نطاق التوصيل' : delivery?.fee != null ? `🚚 ${Number(delivery.fee).toLocaleString('ar-EG')} ج.م • ${Number(delivery.distance || 0).toFixed(1)} كم` : '📍 حدد موقعك للتوصيل';
      const id = esc(r.id);
      const name = esc(r.name || 'مطعم');
      return `<article class="mandoub-rest-card" role="link" tabindex="0" onclick="location.href='restaurant-menu.html?id=${encodeURIComponent(r.id)}'" onkeydown="if(event.key==='Enter'||event.key===' ')location.href='restaurant-menu.html?id=${encodeURIComponent(r.id)}'">
        <button class="mandoub-rest-fav ${favorites.includes(r.id) ? 'active' : ''}" onclick="event.stopPropagation();toggleRestaurantFavorite('${id}')" aria-label="مفضلة">${favorites.includes(r.id) ? '♥' : '♡'}</button>
        <div class="mandoub-rest-image"><img src="${esc(r.image || 'assets/logo.png')}" onerror="this.onerror=null;this.src='assets/logo.png'" alt="${name}"></div>
        <div class="mandoub-rest-info">
          <div class="mandoub-rest-title"><strong>${name}</strong>${offer ? '<span class="mandoub-offer-mini">عرض</span>' : ''}</div>
          <div class="mandoub-rest-meta"><span>★ ${esc(r.rating || '—')}</span>${r.deliveryTime ? `<span>• ${esc(r.deliveryTime)} دقيقة</span>` : ''}${r.deliveryFee != null ? `<span>• ${Number(r.deliveryFee).toLocaleString('ar-EG')} ج.م</span>` : ''}</div>
          <div class="mandoub-rest-delivery">${deliveryText}</div>
          ${offer ? `<a class="mandoub-rest-offer" href="offers.html?restaurantId=${encodeURIComponent(r.id)}" onclick="event.stopPropagation()">🎁 ${esc(offer.discount ? `خصم ${offer.discount}%` : offer.title || 'عرض متاح')}</a>` : ''}
        </div>
      </article>`;
    }).join('');

    container.innerHTML = `<div class="mandoub-rest-list"><div class="mandoub-list-title"><div><b>مطاعم وأماكن قريبة منك</b><small>${list.length} مكان متاح الآن</small></div><span>✨</span></div>${cards || '<div class="restaurants-message">لا توجد نتائج مطابقة حاليًا.</div>'}</div>`;
  }

  typeButtons.forEach(b => b.onclick = () => { businessType = b.dataset.type; activeFilters(); render(); });
  foodFilters.addEventListener('click', e => { const b = e.target.closest('.pill'); if (!b) return; foodType = b.dataset.food; activeFilters(); render(); });
  search?.addEventListener('input', render);
  window.addEventListener('mandoubLocationChanged', render);
  window.addEventListener('mandoubCartChanged', render);
  try {
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    onAuthStateChanged(auth, async () => { await loadFavorites(); render(); });
  } catch {}

  const style = document.createElement('style');
  style.id = 'mandoubRestaurantCardsV6';
  style.textContent = `
    html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
    body{background:#020d1b!important;color:#fff!important}
    .rest-page{width:100%!important;max-width:900px!important;margin:auto!important;padding:12px 9px 55px!important;background:#020d1b!important}
    .restaurant-list,.mandoub-rest-list{display:flex!important;flex-direction:column!important;gap:10px!important;width:100%!important;max-width:820px!important;margin:auto!important}
    .mandoub-list-title{display:flex;align-items:center;justify-content:space-between;padding:5px 3px 7px;color:#fff}
    .mandoub-list-title b{font-size:19px;font-weight:900}.mandoub-list-title small{display:block;color:#91a4b3;font-size:11px;margin-top:2px}
    .mandoub-rest-card{position:relative!important;display:flex!important;flex-direction:row!important;direction:rtl!important;align-items:center!important;width:100%!important;height:118px!important;min-height:118px!important;max-height:118px!important;padding:7px!important;gap:10px!important;box-sizing:border-box!important;overflow:hidden!important;background:#061a2d!important;border:1px solid #16415e!important;border-radius:18px!important;box-shadow:0 6px 18px rgba(0,0,0,.24)!important;cursor:pointer!important}
    .mandoub-rest-image{width:100px!important;height:102px!important;min-width:100px!important;max-width:100px!important;flex:0 0 100px!important;overflow:hidden!important;border-radius:15px!important;background:#031321!important}
    .mandoub-rest-image img{display:block!important;width:100px!important;height:102px!important;min-width:100px!important;max-width:100px!important;object-fit:cover!important;background:#031321!important}
    .mandoub-rest-info{min-width:0!important;flex:1 1 auto!important;height:100%!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:5px!important;overflow:hidden!important}
    .mandoub-rest-title{display:flex;align-items:center;gap:6px;min-width:0}.mandoub-rest-title strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px;font-weight:900;color:#fff}
    .mandoub-offer-mini{flex:0 0 auto;background:#00dfff;color:#061a2d;border-radius:6px;padding:3px 6px;font-size:9px;font-weight:900}
    .mandoub-rest-meta{display:flex;gap:5px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#d8e5ed;font-size:11px}.mandoub-rest-meta span:first-child{color:#00dfff;font-weight:800}
    .mandoub-rest-delivery{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#00dfff;font-size:10px}
    .mandoub-rest-offer{align-self:flex-start;max-width:125px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none;background:#00dfff;color:#061a2d;border-radius:7px;padding:4px 7px;font-size:8px;font-weight:900}
    .mandoub-rest-fav{position:absolute!important;left:7px!important;top:7px!important;width:31px!important;height:31px!important;border:1px solid #16415e!important;border-radius:50%!important;background:#020d1b!important;color:#fff!important;font-size:18px!important;line-height:1!important;z-index:5!important}
    .mandoub-rest-fav.active{color:#00dfff!important}
    .restaurants-message{padding:35px 10px;text-align:center;color:#91a4b3!important}
    @media(max-width:520px){.mandoub-rest-card{height:112px!important;min-height:112px!important;max-height:112px!important;padding:6px!important;gap:8px!important}.mandoub-rest-image{width:90px!important;height:98px!important;min-width:90px!important;max-width:90px!important;flex-basis:90px!important}.mandoub-rest-image img{width:90px!important;height:98px!important;min-width:90px!important;max-width:90px!important}.mandoub-rest-title strong{font-size:15px}.mandoub-rest-meta{font-size:10px}.mandoub-rest-delivery{font-size:9px}.mandoub-rest-fav{left:6px!important;top:6px!important;width:29px!important;height:29px!important}.mandoub-rest-offer{max-width:110px}}
    @media(max-width:380px){.mandoub-rest-card{height:106px!important;min-height:106px!important;max-height:106px!important}.mandoub-rest-image{width:82px!important;height:92px!important;min-width:82px!important;max-width:82px!important;flex-basis:82px!important}.mandoub-rest-image img{width:82px!important;height:92px!important;min-width:82px!important;max-width:82px!important}.mandoub-rest-title strong{font-size:14px}.mandoub-rest-meta{font-size:9px}.mandoub-rest-delivery{font-size:8px}}
    @media(min-width:700px){.mandoub-rest-card{height:136px!important;min-height:136px!important;max-height:136px!important}.mandoub-rest-image{width:125px!important;height:120px!important;min-width:125px!important;max-width:125px!important;flex-basis:125px!important}.mandoub-rest-image img{width:125px!important;height:120px!important;min-width:125px!important;max-width:125px!important}.mandoub-rest-title strong{font-size:19px}}
  `;
  document.head.appendChild(style);
  activeFilters();
  render();
})();
