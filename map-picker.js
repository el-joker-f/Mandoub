/* MANDOUB - Free map picker using Leaflet + OpenStreetMap */
(function(){
  let ready=null,map=null,marker=null,mode='';
  const load=()=>ready||(ready=new Promise((resolve,reject)=>{
    if(window.L)return resolve(window.L);
    const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);
    const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>resolve(window.L);s.onerror=reject;document.head.appendChild(s);
  }));
  function modal(){
    let m=document.getElementById('mandoubMapModal');if(m)return m;
    m=document.createElement('div');m.id='mandoubMapModal';m.innerHTML=`<div class="mandoub-map-backdrop"><div class="mandoub-map-box"><div class="mandoub-map-head"><b>📍 اختر الموقع</b><button id="mandoubMapClose">×</button></div><div id="mandoubMap"></div><div class="mandoub-map-actions"><button id="mandoubGps">📍 موقعي الحالي</button><button id="mandoubMapSave">✅ حفظ الموقع</button></div><small>اضغط على الخريطة لتحديد المكان. الخريطة مجانية.</small></div></div>`;
    document.body.appendChild(m);document.getElementById('mandoubMapClose').onclick=()=>m.remove();return m;
  }
  async function open(initial,kind){
    mode=kind;const L=await load(),m=modal();m.style.display='block';
    const center=initial||{lat:30.615,lng:32.27};
    setTimeout(()=>{
      if(!map){map=L.map('mandoubMap').setView([center.lat,center.lng],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);map.on('click',e=>pick(e.latlng.lat,e.latlng.lng));}
      else map.invalidateSize();map.setView([center.lat,center.lng],14);pick(center.lat,center.lng);
    },80);
    document.getElementById('mandoubGps').onclick=()=>navigator.geolocation?.getCurrentPosition(p=>{pick(p.coords.latitude,p.coords.longitude);map.setView([p.coords.latitude,p.coords.longitude],16)},()=>alert('اسمح للموقع بالوصول ثم حاول مرة أخرى'),{enableHighAccuracy:true,timeout:15000});
    document.getElementById('mandoubMapSave').onclick=()=>{if(!marker)return;const p=marker.getLatLng();save(p.lat,p.lng);m.remove()};
  }
  function pick(lat,lng){const L=window.L;if(marker)marker.setLatLng([lat,lng]);else marker=L.marker([lat,lng]).addTo(map);marker.bindPopup(`📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`).openPopup()}
  function save(lat,lng){if(mode==='admin'){const a=document.getElementById('restaurantLatitude'),b=document.getElementById('restaurantLongitude'),msg=document.getElementById('placeLocationMsg'),url=document.getElementById('restaurantLocationUrl');if(a)a.value=lat.toFixed(7);if(b)b.value=lng.toFixed(7);if(url)url.value=`${lat.toFixed(7)},${lng.toFixed(7)}`;if(msg){msg.textContent=`✅ تم اختيار الموقع: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;msg.style.color='#7ff0a8'}}else{localStorage.setItem('mandoub_location_coords',JSON.stringify({lat,lng}));localStorage.setItem('mandoub_location',`${lat}, ${lng}`);const input=document.getElementById('customerLocation');if(input)input.value=`${lat.toFixed(6)}, ${lng.toFixed(6)}`;window.dispatchEvent(new CustomEvent('mandoubLocationPicked',{detail:{lat,lng}}));if(typeof window.__mandoubCheckoutRender==='function')window.__mandoubCheckoutRender()}}
  function init(){
    const adminBtn=document.getElementById('getPlaceLocation');if(adminBtn){adminBtn.onclick=e=>{e.preventDefault();open(readAdmin(),'admin')}}
    const locBtn=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('📍 تحديد موقعي'));if(locBtn&&document.getElementById('customerLocation')){const b=document.createElement('button');b.type='button';b.className=locBtn.className;b.style.marginTop='8px';b.textContent='🗺️ اختيار الموقع من الخريطة';locBtn.after(b);b.onclick=()=>open(readCustomer(),'customer');window.setLocationNow=()=>open(readCustomer(),'customer')}
  }
  const readAdmin=()=>{const lat=Number(document.getElementById('restaurantLatitude')?.value),lng=Number(document.getElementById('restaurantLongitude')?.value);return Number.isFinite(lat)&&Number.isFinite(lng)&&lat&&lng?{lat,lng}:null};
  const readCustomer=()=>{try{const p=JSON.parse(localStorage.getItem('mandoub_location_coords')||'null');if(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng))return p}catch{}return null};
  window.addEventListener('load',()=>setTimeout(init,1000));document.addEventListener('DOMContentLoaded',()=>setTimeout(init,900));
})();
