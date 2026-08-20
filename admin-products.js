import { db } from './auth.js';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { uploadImage } from './admin-upload.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money=n=>`${Number(n||0).toLocaleString('ar-EG')} ج`;
const msg=t=>window.message?window.message(t):alert(t);

function ensureFields(){
  const select=$('productRestaurant');
  if(select) select.style.display='block';
  const input=$('productImage');
  if(input && input.type!=='file'){
    input.type='file';
    input.accept='image/*';
    input.removeAttribute('value');
  }
}

function preview(input,id='productPreview'){
  const img=$(id),file=input?.files?.[0];
  if(!img)return;
  if(!file){img.style.display='none';img.removeAttribute('src');return;}
  img.src=URL.createObjectURL(file);img.style.display='block';
}
window.previewProductImage=preview;

async function renderProducts(){
  ensureFields();
  const select=$('productRestaurant'),list=$('productsList');
  if(!select||!list)return;
  const rs=await getDocs(collection(db,'restaurants'));
  const restaurants=rs.docs.map(d=>({id:d.id,...d.data()}));
  const old=select.value;
  select.innerHTML='<option value="">اختر المطعم</option>'+restaurants.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');
  if(restaurants.some(r=>r.id===old))select.value=old;
  await loadSelectedProducts();
}

async function loadSelectedProducts(){
  const rid=$('productRestaurant')?.value,list=$('productsList');
  if(!list)return;
  if(!rid){list.innerHTML='<div class="muted">اختر مطعمًا لعرض منتجاته وإدارتها.</div>';return;}
  try{
    const s=await getDocs(collection(db,'restaurants',rid,'products'));
    const a=s.docs.map(d=>({id:d.id,...d.data()}));
    list.innerHTML=a.length?a.map(p=>`<div class="item"><div class="item-info">${p.image?`<img src="${esc(p.image)}" onerror="this.src='assets/logo.png'" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:12px;float:right;margin-left:12px">`:''}<strong>${esc(p.name)}</strong><small>${money(p.price)}${p.description?` — ${esc(p.description)}`:''}</small></div><button class="danger" onclick="deleteProduct('${rid}','${p.id}')">🗑️ حذف</button></div>`).join(''):'<div class="muted">لا توجد منتجات لهذا المطعم.</div>';
  }catch(e){console.error(e);list.innerHTML='<div class="muted">تعذر تحميل المنتجات ❌</div>'}
}

window.addProduct=async()=>{
  const rid=$('productRestaurant')?.value;
  const n=$('productName')?.value.trim();
  const p=Number($('productPrice')?.value);
  const description=$('productDescription')?.value.trim()||'';
  const file=$('productImage')?.files?.[0];
  if(!rid||!n||!Number.isFinite(p)||p<0){msg('اختر المطعم واكتب اسم المنتج والسعر ❌');return;}
  try{
    msg('جاري إضافة المنتج... ⏳');
    const image=await uploadImage(file,`restaurants/${rid}/products`);
    await addDoc(collection(db,'restaurants',rid,'products'),{name:n,price:p,image,description,active:true,createdAt:serverTimestamp()});
    $('productName').value='';$('productPrice').value='';$('productDescription').value='';$('productImage').value='';
    $('productPreview')?.removeAttribute('src');if($('productPreview'))$('productPreview').style.display='none';
    msg('تم إضافة المنتج بنجاح ✅');
    await loadSelectedProducts();
  }catch(e){
    console.error(e);
    if(e.message==='IMAGE_ONLY')msg('اختار صورة صحيحة فقط ❌');
    else if(e.message==='IMAGE_TOO_LARGE')msg('حجم الصورة يجب ألا يتجاوز 5MB ❌');
    else if(e.code==='permission-denied')msg('Firebase رفض الإضافة: حسابك ليس Admin ❌');
    else if(e.code==='unauthenticated')msg('جلسة الأدمن انتهت، سجل الدخول مرة أخرى ❌');
    else if(e.message==='UPLOAD_FAILED')msg('تعذر رفع الصورة إلى Cloudinary ❌');
    else msg('تعذر إضافة المنتج ❌');
  }
};

window.deleteProduct=async(rid,pid)=>{
  if(!confirm('حذف المنتج؟'))return;
  try{await deleteDoc(doc(db,'restaurants',rid,'products',pid));msg('تم حذف المنتج ✅');await loadSelectedProducts();}
  catch(e){console.error(e);msg(e.code==='permission-denied'?'ليس لديك صلاحية حذف المنتج ❌':'تعذر حذف المنتج ❌')}
};

const oldShowPage=window.showPage;
window.showPage=(id,b)=>{
  oldShowPage?.(id,b);
  if(id==='products')setTimeout(renderProducts,50);
};

window.addEventListener('DOMContentLoaded',()=>{
  ensureFields();
  $('productRestaurant')?.addEventListener('change',loadSelectedProducts);
  setTimeout(()=>{if($('products'))renderProducts()},300);
});
