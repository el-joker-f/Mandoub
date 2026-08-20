import { db } from './auth.js';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { uploadImage } from './admin-upload.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money=n=>`${Number(n||0).toLocaleString('ar-EG')} ج`;
let busy=false;

function ensureAdminFields(){
  if(!$('productRestaurant')){const s=document.createElement('select');s.id='productRestaurant';s.style.display='none';document.body.appendChild(s)}
  for(const id of ['restaurantImage','offerImage']){const el=$(id);if(el&&el.type!=='file'){el.type='file';el.accept='image/*';el.removeAttribute('value')}}
}
function preview(input,id){const f=input?.files?.[0],img=$(id);if(!img)return;if(!f){img.style.display='none';img.removeAttribute('src');return}img.src=URL.createObjectURL(f);img.style.display='block'}
window.previewAdminImage=preview;

async function render(){const root=$('restaurantsList');if(!root||busy)return;busy=true;try{ensureAdminFields();const rs=await getDocs(collection(db,'restaurants'));const restaurants=rs.docs.map(d=>({id:d.id,...d.data()}));if(!restaurants.length){root.innerHTML='<div class="muted">لا توجد مطاعم بعد.</div>';return}root.innerHTML=restaurants.map(r=>`<div class="restaurant-card"><div class="restaurant-head"><div><strong>🍔 ${esc(r.name)}</strong><small style="display:block;color:#91a4b3;margin-top:6px">${esc(r.category||'')} — توصيل أساسي ${money(r.deliveryFee)}</small></div><div class="actions"><button class="secondary" onclick="showRestaurantOffers('${r.id}')">🎁 عروض المطعم</button><button class="danger" onclick="deleteRestaurant('${r.id}')">🗑️ حذف</button></div></div><div class="product-panel"><h3>🍟 منتجات ${esc(r.name)}</h3><div class="product-form"><input id="pn-${r.id}" placeholder="اسم المنتج"><input id="pp-${r.id}" type="number" min="0" step="0.01" placeholder="السعر"><label class="file-pick"><span>📷 اختيار صورة</span><input id="pi-${r.id}" type="file" accept="image/*" onchange="previewAdminImage(this,'prev-${r.id}')"></label><button class="primary" onclick="addInlineProduct('${r.id}')">➕ إضافة</button></div><img id="prev-${r.id}" class="admin-preview" alt="معاينة" style="display:none"><input id="pd-${r.id}" style="width:100%;margin-bottom:12px" placeholder="وصف المنتج"><div class="product-list" id="pl-${r.id}"><div class="muted">جاري التحميل...</div></div></div></div>`).join('');for(const r of restaurants){const ps=await getDocs(collection(db,'restaurants',r.id,'products'));const box=$(`pl-${r.id}`);const products=ps.docs.map(d=>({id:d.id,...d.data()}));box.innerHTML=products.length?products.map(p=>`<div class="product-mini">${p.image?`<img src="${esc(p.image)}" onerror="this.src='assets/logo.png'" alt="" style="width:58px;height:58px;object-fit:cover;border-radius:10px">`:''}<div><strong>${esc(p.name)}</strong><small>${money(p.price)}${p.description?` — ${esc(p.description)}`:''}</small></div><button class="danger" onclick="deleteInlineProduct('${r.id}','${p.id}')">حذف</button></div>`).join(''):'<div class="muted">لا توجد منتجات لهذا المطعم.</div>'}}catch(e){console.error(e);root.innerHTML='<div class="muted">تعذر تحميل المطاعم والمنتجات ❌</div>'}finally{busy=false}}

window.addInlineProduct=async rid=>{const n=$(`pn-${rid}`)?.value.trim(),p=Number($(`pp-${rid}`)?.value),description=$(`pd-${rid}`)?.value.trim()||'',file=$(`pi-${rid}`)?.files?.[0];if(!n||!Number.isFinite(p)||p<0)return alert('اكتب اسم المنتج والسعر بشكل صحيح ❌');try{const image=await uploadImage(file,`restaurants/${rid}/products`);await addDoc(collection(db,'restaurants',rid,'products'),{name:n,price:p,image,description,active:true,createdAt:serverTimestamp()});await render()}catch(e){console.error(e);alert(e.message==='IMAGE_ONLY'?'اختار صورة فقط ❌':e.message==='IMAGE_TOO_LARGE'?'حجم الصورة يجب ألا يتجاوز 5MB ❌':'تعذر إضافة المنتج ❌')}};
window.deleteInlineProduct=async(rid,pid)=>{if(!confirm('حذف هذا المنتج؟'))return;try{await deleteDoc(doc(db,'restaurants',rid,'products',pid));await render()}catch(e){console.error(e);alert('تعذر حذف المنتج ❌')}};

window.addEventListener('DOMContentLoaded',()=>{ensureAdminFields();setTimeout(render,700)});
