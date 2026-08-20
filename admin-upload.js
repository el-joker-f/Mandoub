import { db } from './auth.js';
import { collection, addDoc, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const CLOUDINARY_CLOUD_NAME = 'bclmaynn';
const CLOUDINARY_UPLOAD_PRESET = 'mandoub';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const $ = id => document.getElementById(id);
const msg = t => window.message ? window.message(t) : alert(t);

export async function uploadImage(file, folder = 'admin-media') {
  if (!file) return '';
  if (!file.type.startsWith('image/')) throw new Error('IMAGE_ONLY');
  if (file.size > 5 * 1024 * 1024) throw new Error('IMAGE_TOO_LARGE');

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  form.append('folder', `mandoub/${folder}`);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: form
  });

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data?.error?.message || '';
    } catch (_) {}
    console.error('Cloudinary upload failed:', response.status, detail);
    throw new Error('UPLOAD_FAILED');
  }

  const data = await response.json();
  if (!data.secure_url) throw new Error('UPLOAD_FAILED');
  return data.secure_url;
}

function imageError(e) {
  console.error(e);
  msg(
    e.message === 'IMAGE_ONLY'
      ? 'اختار صورة فقط ❌'
      : e.message === 'IMAGE_TOO_LARGE'
        ? 'حجم الصورة يجب ألا يتجاوز 5MB ❌'
        : 'تعذر رفع الصورة إلى خدمة الصور ❌'
  );
}

function preview(input, previewId) {
  const f = input?.files?.[0], img = $(previewId);
  if (!img) return;
  if (!f) {
    img.style.display = 'none';
    img.removeAttribute('src');
    return;
  }
  img.src = URL.createObjectURL(f);
  img.style.display = 'block';
}

window.previewAdminImage = preview;

window.addRestaurant = async () => {
  const n = $('restaurantName')?.value.trim();
  if (!n) return msg('اكتب اسم المطعم ❌');
  try {
    msg('جاري رفع صورة المطعم... ⏳');
    const image = await uploadImage($('restaurantImage')?.files?.[0], 'restaurants');
    await addDoc(collection(db, 'restaurants'), {
      name: n,
      category: $('restaurantCategory')?.value.trim() || '',
      rating: Number($('restaurantRating')?.value || 0),
      deliveryFee: Number($('restaurantDelivery')?.value || 0),
      image,
      description: $('restaurantDescription')?.value.trim() || '',
      latitude: Number($('restaurantLatitude')?.value || 0),
      longitude: Number($('restaurantLongitude')?.value || 0),
      active: true,
      createdAt: serverTimestamp()
    });
    msg('تم إضافة المطعم بالصورة ✅');
    setTimeout(() => location.reload(), 700);
  } catch (e) {
    imageError(e);
  }
};

window.addProduct = async () => {};

window.addOffer = async () => {
  const t = $('offerTitle')?.value.trim();
  const p = Number($('offerPrice')?.value);
  const op = Number($('offerOldPrice')?.value || 0);
  if (!t || !Number.isFinite(p) || p < 0) return msg('أكمل بيانات العرض ❌');
  try {
    msg('جاري رفع صورة العرض... ⏳');
    const image = await uploadImage($('offerImage')?.files?.[0], 'offers');
    await addDoc(collection(db, 'offers'), {
      title: t,
      description: $('offerDescription')?.value.trim() || '',
      image,
      oldPrice: op,
      price: p,
      discount: op > 0 ? Math.max(0, Math.round((1 - p / op) * 100)) : 0,
      restaurantId: $('offerRestaurant')?.value || null,
      showOnHome: $('offerShowHome')?.checked !== false,
      active: true,
      startAt: $('offerStart')?.value ? Timestamp.fromDate(new Date($('offerStart').value)) : null,
      endAt: $('offerEnd')?.value ? Timestamp.fromDate(new Date($('offerEnd').value)) : null,
      createdAt: serverTimestamp()
    });
    msg('تم إضافة العرض بالصورة ✅');
    setTimeout(() => location.reload(), 700);
  } catch (e) {
    imageError(e);
  }
};
