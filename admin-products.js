import { db } from './auth.js';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money=n=>`${Number(n||0).toLocaleString('ar-EG')} ج`;
const $=id=>document.getElementById(id);
let busy=false;

async function render(){
  const root=$('restaurantsList');
  if(!root||busy)return;
  busy=true;
  try{
    const rs=await getDocs(collection(db,'restaurants'));
    const restaurants=rs.docs.map(d=>({id:d.id,...d.data()}));
    if(!restaurants.length){root.innerHTML='<div class="muted">لا توجد مطاعم بعد.</div>';return;}
    const html=[];
    for(const r of restaurants){
      const ps=await getDocs(collection(db,'restaurants',r.id,'products'));
      const products=ps.docs.map(d=>({id:d.id,...d.data()}));
      html.push(`<div class="restaurant-card">
        <div class="restaurant-head">
          <div><strong>🍔 ${esc(r.name)}</strong><small style="display:block;color:#91a4b3;margin-top:6px">${esc(r.category||'')} — توصيل أساسي ${money(r.deliveryFee)}</small></div>
          <div class="actions"><button class="secondary" onclick="showRestaurantOffers('${r.id}')">🎁 عروض المطعم</button><button class="danger" onclick="deleteRestaurant('${r.id}')">🗑️ حذف</button></div>
        </div>
        <div class="product-panel">
          <h3>🍟 منتجات ${esc(r.name)}</h3>
          <div class="product-form">
            <input id="pn-${r.id}" placeholder="اسم المنتج">
            <input id="pp-${r.id}" type="number" min="0" step="0.01" placeholder="السعر">
            <input id="pi-${r.id}" type="url" placeholder="رابط الصورة">
            <button class="primary" onclick="addInlineProduct('${r.id}')">➕ إضافة</button>
          </div>
          <input id="pd-${r.id}" style="width:100%;margin-bottom:12px" placeholder="وصف المنتج">
          <div class="product-list">${products.length?products.map(p=>`<div class="product-mini"><div><strong>${esc(p.name)}</strong><small>${money(p.price)}${p.description?` — ${esc(p.description)}`:''}</small></div><button class="danger" onclick="deleteInlineProduct('${r.id}','${p.id}')">حذف</button></div>`).join(''):'<div class="muted">لا توجد منتجات لهذا المطعم.</div>'}</div>
        </div>
      </div>`);
    }
    root.innerHTML=html.join('');
  }catch(e){console.error(e);root.innerHTML='<div class="muted">تعذر تحميل المطاعم والمنتجات ❌</div>'}
  finally{busy=false}
}

window.addInlineProduct=async rid=>{
  const n=$(`pn-${rid}`)?.value.trim();
  const p=Number($(`pp-${rid}`)?.value);
  const image=$(`pi-${rid}`)?.value.trim()||'';
  const description=$(`pd-${rid}`)?.value.trim()||'';
  if(!n||!Number.isFinite(p)||p<0){alert('اكتب اسم المنتج والسعر بشكل صحيح ❌');return;}
  try{
    await addDoc(collection(db,'restaurants',rid,'products'),{name:n,price:p,image,description,active:true,createdAt:serverTimestamp()});
    await render();
  }catch(e){console.error(e);alert('تعذر إضافة المنتج ❌')}
};

window.deleteInlineProduct=async(rid,pid)=>{
  if(!confirm('حذف هذا المنتج؟'))return;
  try{await deleteDoc(doc(db,'restaurants',rid,'products',pid));await render();}
  catch(e){console.error(e);alert('تعذر حذف المنتج ❌')}
};

const observer=new MutationObserver(()=>render());
window.addEventListener('DOMContentLoaded',()=>{
  const root=$('restaurantsList');
  if(root){observer.observe(root,{childList:true});setTimeout(render,900);}
});