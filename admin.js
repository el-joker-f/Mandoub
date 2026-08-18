/* =====================================================
   MANDOUB - ADMIN.JS
   لوحة التحكم + Firebase Firestore
   الهيكل:
   restaurants
      └── restaurantId
           └── products
                └── productId
===================================================== */
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
/* =====================================================
   FIREBASE CONFIG
===================================================== */
const firebaseConfig = {
  apiKey:
    "AIzaSyB6-RVH7-8NrN-AaOOv6QjL9APDeyj7oIU",
  authDomain:
    "mandoub-dv.firebaseapp.com",
  projectId:
    "mandoub-dv",
  storageBucket:
    "mandoub-dv.firebasestorage.app",
  messagingSenderId:
    "311140400335",
  appId:
    "1:311140400335:web:db198b7c53259c53594bba",
  measurementId:
    "G-7V1LJQYYXD"
};
/* =====================================================
   FIREBASE INIT
===================================================== */
let db = null;
let restaurants = [];
let messageTimer = null;
try {
  const app =
    initializeApp(firebaseConfig);
  db =
    getFirestore(app);
  const status =
    document.getElementById(
      "firebaseStatus"
    );
  if (status) {
    status.textContent =
      "Firebase متصل ✅";
    status.style.background =
      "#082f26";
    status.style.color =
      "#35e6a1";
  }
  console.log(
    "Firebase Admin Connected ✅"
  );
} catch (error) {
  console.error(
    "Firebase Init Error:",
    error
  );
  const status =
    document.getElementById(
      "firebaseStatus"
    );
  if (status) {
    status.textContent =
      "Firebase غير متصل ❌";
    status.style.background =
      "#3a1220";
    status.style.color =
      "#ff6b91";
  }
}
/* =====================================================
   MESSAGE
===================================================== */
function message(text) {
  const box =
    document.getElementById(
      "message"
    );
  if (!box) return;
  box.textContent =
    text;
  box.style.display =
    "block";
  clearTimeout(
    messageTimer
  );
  messageTimer =
    setTimeout(() => {
      box.style.display =
        "none";
    }, 2800);
}
/* =====================================================
   NAVIGATION
===================================================== */
window.showPage =
function(page, button) {
  document
    .querySelectorAll(".page")
    .forEach(item => {
      item.classList.remove(
        "active"
      );
    });
  const target =
    document.getElementById(
      page
    );
  if (target) {
    target.classList.add(
      "active"
    );
  }
  document
    .querySelectorAll(".menu button")
    .forEach(item => {
      item.classList.remove(
        "active"
      );
    });
  if (button) {
    button.classList.add(
      "active"
    );
  }
  const titles = {
    dashboard:
      "لوحة التحكم",
    restaurants:
      "إدارة المطاعم",
    products:
      "إدارة المنتجات",
    orders:
      "إدارة الطلبات"
  };
  const title =
    document.getElementById(
      "pageTitle"
    );
  if (title) {
    title.textContent =
      titles[page] ||
      "لوحة التحكم";
  }
  if (page === "restaurants") {
    loadRestaurants();
  }
  if (page === "products") {
    loadRestaurants()
      .then(() => loadProducts());
  }
  if (page === "orders") {
    loadOrders();
  }
};
/* =====================================================
   ESCAPE HTML
===================================================== */
function escapeHTML(value) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}
/* =====================================================
   RESTAURANT LOCATION
===================================================== */
window.getRestaurantLocation =
function() {
  if (
    !navigator.geolocation
  ) {
    message(
      "المتصفح لا يدعم تحديد الموقع ❌"
    );
    return;
  }
  const status =
    document.getElementById(
      "locationStatus"
    );
  if (status) {
    status.textContent =
      "جاري تحديد موقعك... 📍";
  }
  navigator.geolocation.getCurrentPosition(
    position => {
      const latitude =
        position.coords.latitude;
      const longitude =
        position.coords.longitude;
      const latitudeInput =
        document.getElementById(
          "restaurantLatitude"
        );
      const longitudeInput =
        document.getElementById(
          "restaurantLongitude"
        );
      if (latitudeInput) {
        latitudeInput.value =
          latitude.toFixed(6);
      }
      if (longitudeInput) {
        longitudeInput.value =
          longitude.toFixed(6);
      }
      if (status) {
        status.textContent =
          `تم تحديد الموقع: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} ✅`;
      }
      message(
        "تم تحديد موقع المطعم 📍"
      );
    },
    error => {
      console.error(
        "Geolocation Error:",
        error
      );
      if (status) {
        status.textContent =
          "تعذر تحديد الموقع، أدخل الإحداثيات يدويًا.";
      }
      message(
        "تعذر تحديد الموقع ❌"
      );
    },
    {
      enableHighAccuracy:
        true,
      timeout:
        10000,
      maximumAge:
        0
    }
  );
};
/* =====================================================
   READ RESTAURANT LOCATION
===================================================== */
function getRestaurantCoordinates() {
  const latitudeInput =
    document.getElementById(
      "restaurantLatitude"
    );
  const longitudeInput =
    document.getElementById(
      "restaurantLongitude"
    );
  const latitude =
    latitudeInput
      ? latitudeInput.value.trim()
      : "";
  const longitude =
    longitudeInput
      ? longitudeInput.value.trim()
      : "";
  /*
     لو الاتنين فاضيين
     نسمح بإضافة المطعم بدون موقع.
  */
  if (
    latitude === "" &&
    longitude === ""
  ) {
    return null;
  }
  /*
     لازم الاتنين يكونوا موجودين.
  */
  if (
    latitude === "" ||
    longitude === ""
  ) {
    message(
      "اكتب خط العرض وخط الطول معًا ❌"
    );
    return false;
  }
  const lat =
    Number(latitude);
  const lng =
    Number(longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    message(
      "إحداثيات الموقع غير صحيحة ❌"
    );
    return false;
  }
  if (
    lat < -90 ||
    lat > 90
  ) {
    message(
      "خط العرض يجب أن يكون بين -90 و 90 ❌"
    );
    return false;
  }
  if (
    lng < -180 ||
    lng > 180
  ) {
    message(
      "خط الطول يجب أن يكون بين -180 و 180 ❌"
    );
    return false;
  }
  return {
    latitude:
      lat,
    longitude:
      lng
  };
}
/* =====================================================
   OPEN GOOGLE MAPS
===================================================== */
window.openRestaurantLocation =
function(latitude, longitude) {
  const lat =
    Number(latitude);
  const lng =
    Number(longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    message(
      "موقع المطعم غير صحيح ❌"
    );
    return;
  }
  const url =
    "https://www.google.com/maps?q=" +
    encodeURIComponent(
      `${lat},${lng}`
    );
  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
};
/* =====================================================
   CLEAR RESTAURANT FORM
===================================================== */
function clearRestaurantForm() {
  const ids = [
    "restaurantName",
    "restaurantCategory",
    "restaurantRating",
    "restaurantDelivery",
    "restaurantImage",
    "restaurantDescription",
    "restaurantLatitude",
    "restaurantLongitude"
  ];
  ids.forEach(id => {
    const input =
      document.getElementById(
        id
      );
    if (input) {
      input.value =
        "";
    }
  });
  const rating =
    document.getElementById(
      "restaurantRating"
    );
  const delivery =
    document.getElementById(
      "restaurantDelivery"
    );
  if (rating) {
    rating.value =
      "0";
  }
  if (delivery) {
    delivery.value =
      "0";
  }
  const status =
    document.getElementById(
      "locationStatus"
    );
  if (status) {
    status.textContent =
      "يمكنك إدخال الإحداثيات يدويًا أو استخدام موقعك الحالي.";
  }
}
/* =====================================================
   ADD RESTAURANT
===================================================== */
window.addRestaurant =
async function() {
  if (!db) {
    message(
      "Firebase غير متصل ❌"
    );
    return;
  }
  const name =
    document
      .getElementById(
        "restaurantName"
      )
      ?.value
      .trim();
  const category =
    document
      .getElementById(
        "restaurantCategory"
      )
      ?.value
      .trim();
  const ratingValue =
    document
      .getElementById(
        "restaurantRating"
      )
      ?.value;
  const deliveryValue =
    document
      .getElementById(
        "restaurantDelivery"
      )
      ?.value;
  const image =
    document
      .getElementById(
        "restaurantImage"
      )
      ?.value
      .trim();
  const description =
    document
      .getElementById(
        "restaurantDescription"
      )
      ?.value
      .trim();
  if (!name) {
    message(
      "اكتب اسم المطعم أولاً ❌"
    );
    return;
  }
  const rating =
    Number(
      ratingValue || 0
    );
  const delivery =
    Number(
      deliveryValue || 0
    );
  if (
    !Number.isFinite(rating) ||
    rating < 0 ||
    rating > 5
  ) {
    message(
      "التقييم يجب أن يكون بين 0 و 5 ❌"
    );
    return;
  }
  if (
    !Number.isFinite(delivery) ||
    delivery < 0
  ) {
    message(
      "رسوم التوصيل غير صحيحة ❌"
    );
    return;
  }
  const location =
    getRestaurantCoordinates();
  if (location === false) {
    return;
  }
  try {
    /*
       هنا Firebase ينشئ ID تلقائي
       وينشئ كل الحقول مرة واحدة.
    */
    const restaurantRef =
      await addDoc(
        collection(
          db,
          "restaurants"
        ),
        {
          name:
            name,
          category:
            category || "",
          description:
            description || "",
          image:
            image || "",
          rating:
            rating,
          delivery:
            delivery,
          location:
            location,
          active:
            true,
          createdAt:
            serverTimestamp()
        }
      );
    console.log(
      "Restaurant Created:",
      restaurantRef.id
    );
    clearRestaurantForm();
    message(
      "تم إضافة المطعم إلى Firebase بنجاح ✅"
    );
    await loadRestaurants();
  } catch (error) {
    console.error(
      "Add Restaurant Error:",
      error
    );
    message(
      "حدث خطأ أثناء إضافة المطعم ❌"
    );
  }
};
/* =====================================================
   LOAD RESTAURANTS
===================================================== */
async function loadRestaurants() {
  if (!db) return;
  const list =
    document.getElementById(
      "restaurantsList"
    );
  if (list) {
    list.innerHTML =
      "جاري تحميل المطاعم...";
  }
  try {
    const snapshot =
      await getDocs(
        collection(
          db,
          "restaurants"
        )
      );
    restaurants =
      snapshot.docs.map(
        item => ({
          id:
            item.id,
          ...item.data()
        })
      );
    updateRestaurantSelect();
    if (!list) return;
    if (
      restaurants.length === 0
    ) {
      list.innerHTML = `
        <div class="empty">
          لا توجد مطاعم حتى الآن.
        </div>
      `;
      return;
    }
    list.innerHTML =
      restaurants
        .map(
          restaurant => {
            const location =
              restaurant.location;
            const hasLocation =
              location &&
              Number.isFinite(
                Number(
                  location.latitude
                )
              ) &&
              Number.isFinite(
                Number(
                  location.longitude
                )
              );
            return `
              <div class="item">
                <div class="item-info">
                  <strong>
                    ${escapeHTML(
                      restaurant.name ||
                      "مطعم"
                    )}
                  </strong>
                  <small>
                    التصنيف:
                    ${escapeHTML(
                      restaurant.category ||
                      "بدون تصنيف"
                    )}
                    <br>
                    التقييم:
                    ${restaurant.rating ?? 0}
                    ⭐
                    • التوصيل:
                    ${restaurant.delivery ?? 0}
                    جنيه
                    ${
                      hasLocation
                      ? `
                        <br>
                        📍
                        ${Number(
                          location.latitude
                        ).toFixed(6)}
                        ,
                        ${Number(
                          location.longitude
                        ).toFixed(6)}
                      `
                      : `
                        <br>
                        📍 الموقع غير محدد
                      `
                    }
                  </small>
                </div>
                <div class="item-actions">
                  ${
                    restaurant.image
                    ? `
                      <button
                        class="secondary"
                        onclick="previewImage('${escapeHTML(
                          restaurant.image
                        )}')">
                        🖼️ الصورة
                      </button>
                    `
                    : ""
                  }
                  ${
                    hasLocation
                    ? `
                      <button
                        class="secondary"
                        onclick="openRestaurantLocation(
                          ${Number(
                            location.latitude
                          )},
                          ${Number(
                            location.longitude
                          )}
                        )">
                        📍 الخريطة
                      </button>
                    `
                    : ""
                  }
                  <button
                    class="danger"
                    onclick="deleteRestaurant('${restaurant.id}')">
                    🗑️ حذف
                  </button>
                </div>
              </div>
            `;
          }
        )
        .join("");
  } catch (error) {
    console.error(
      "Load Restaurants Error:",
      error
    );
    if (list) {
      list.innerHTML =
        "حدث خطأ أثناء تحميل المطاعم ❌";
    }
  }
}
/* =====================================================
   DELETE RESTAURANT
===================================================== */
window.deleteRestaurant =
async function(id) {
  if (!db) {
    message(
      "Firebase غير متصل ❌"
    );
    return;
  }
  if (
    !confirm(
      "هل تريد حذف المطعم؟"
    )
  ) {
    return;
  }
  try {
    await deleteDoc(
      doc(
        db,
        "restaurants",
        id
      )
    );
    message(
      "تم حذف المطعم ✅"
    );
    await loadRestaurants();
    await loadProducts();
  } catch (error) {
    console.error(
      "Delete Restaurant Error:",
      error
    );
    message(
      "تعذر حذف المطعم ❌"
    );
  }
};
/* =====================================================
   RESTAURANT SELECT
===================================================== */
function updateRestaurantSelect() {
  const select =
    document.getElementById(
      "productRestaurant"
    );
  if (!select) return;
  select.innerHTML = `
    <option value="">
      اختر المطعم
    </option>
    ${
      restaurants
        .map(
          restaurant => `
            <option value="${restaurant.id}">
              ${escapeHTML(
                restaurant.name ||
                "مطعم"
              )}
            </option>
          `
        )
        .join("")
    }
  `;
}
/* =====================================================
   ADD PRODUCT
===================================================== */
window.addProduct =
async function() {
  if (!db) {
    message(
      "Firebase غير متصل ❌"
    );
    return;
  }
  const restaurantId =
    document
      .getElementById(
        "productRestaurant"
      )
      ?.value;
  const name =
    document
      .getElementById(
        "productName"
      )
      ?.value
      .trim();
  const priceValue =
    document
      .getElementById(
        "productPrice"
      )
      ?.value;
  const image =
    document
      .getElementById(
        "productImage"
      )
      ?.value
      .trim();
  const description =
    document
      .getElementById(
        "productDescription"
      )
      ?.value
      .trim();
  if (
    !restaurantId
  ) {
    message(
      "اختر المطعم أولاً ❌"
    );
    return;
  }
  if (!name) {
    message(
      "اكتب اسم المنتج ❌"
    );
    return;
  }
  const price =
    Number(
      priceValue
    );
  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    message(
      "اكتب سعرًا صحيحًا ❌"
    );
    return;
  }
  try {
    /*
       مهم جدًا:
       المنتج يتحفظ داخل المطعم نفسه:
       restaurants
          └── restaurantId
               └── products
                    └── productId
    */
    await addDoc(
      collection(
        db,
        "restaurants",
        restaurantId,
        "products"
      ),
      {
        name:
          name,
        price:
          price,
        image:
          image || "",
        description:
          description || "",
        active:
          true,
        createdAt:
          serverTimestamp()
      }
    );
    const nameInput =
      document.getElementById(
        "productName"
      );
    const priceInput =
      document.getElementById(
        "productPrice"
      );
    const imageInput =
      document.getElementById(
        "productImage"
      );
    const descriptionInput =
      document.getElementById(
        "productDescription"
      );
    if (nameInput)
      nameInput.value = "";
    if (priceInput)
      priceInput.value = "";
    if (imageInput)
      imageInput.value = "";
    if (descriptionInput)
      descriptionInput.value = "";
    message(
      "تم إضافة المنتج داخل المطعم ✅"
    );
    await loadProducts();
  } catch (error) {
    console.error(
      "Add Product Error:",
      error
    );
    message(
      "حدث خطأ أثناء إضافة المنتج ❌"
    );
  }
};
/* =====================================================
   LOAD PRODUCTS
===================================================== */
async function loadProducts() {
  if (!db) return;
  const list =
    document.getElementById(
      "productsList"
    );
  if (list) {
    list.innerHTML =
      "جاري تحميل المنتجات...";
  }
  try {
    let allProducts = [];
    /*
       نقرأ منتجات كل مطعم
       من subcollection الخاصة به.
    */
    for (
      const restaurant of restaurants
    ) {
      const productsSnapshot =
        await getDocs(
          collection(
            db,
            "restaurants",
            restaurant.id,
            "products"
          )
        );
      productsSnapshot.forEach(
        productDoc => {
          allProducts.push({
            id:
              productDoc.id,
            restaurantId:
              restaurant.id,
            restaurantName:
              restaurant.name,
            ...productDoc.data()
          });
        }
      );
    }
    if (!list) return;
    if (
      allProducts.length === 0
    ) {
      list.innerHTML = `
        <div class="empty">
          لا توجد منتجات حتى الآن.
        </div>
      `;
      return;
    }
    list.innerHTML =
      allProducts
        .map(
          product => `
            <div class="item">
              <div class="item-info">
                <strong>
                  ${escapeHTML(
                    product.name ||
                    "منتج"
                  )}
                </strong>
                <small>
                  المطعم:
                  ${escapeHTML(
                    product.restaurantName ||
                    "غير معروف"
                  )}
                  <br>
                  السعر:
                  ${product.price ?? 0}
                  جنيه
                </small>
              </div>
              <div class="item-actions">
                ${
                  product.image
                  ? `
                    <button
                      class="secondary"
                      onclick="previewImage('${escapeHTML(
                        product.image
                      )}')">
                      🖼️ الصورة
                    </button>
                  `
                  : ""
                }
                <button
                  class="danger"
                  onclick="deleteProduct(
                    '${product.restaurantId}',
                    '${product.id}'
                  )">
                  🗑️ حذف
                </button>
              </div>
            </div>
          `
        )
        .join("");
  } catch (error) {
    console.error(
      "Load Products Error:",
      error
    );
    if (list) {
      list.innerHTML =
        "حدث خطأ أثناء تحميل المنتجات ❌";
    }
  }
}
/* =====================================================
   DELETE PRODUCT
===================================================== */
window.deleteProduct =
async function(
  restaurantId,
  productId
) {
  if (!db) return;
  if (
    !confirm(
      "هل تريد حذف المنتج؟"
    )
  ) {
    return;
  }
  try {
    await deleteDoc(
      doc(
        db,
        "restaurants",
        restaurantId,
        "products",
        productId
      )
    );
    message(
      "تم حذف المنتج ✅"
    );
    await loadProducts();
  } catch (error) {
    console.error(
      "Delete Product Error:",
      error
    );
    message(
      "تعذر حذف المنتج ❌"
    );
  }
};
/* =====================================================
   ORDERS
===================================================== */
async function loadOrders() {
  if (!db) return;
  const table =
    document.getElementById(
      "ordersTable"
    );
  if (!table) return;
  table.innerHTML = `
    <tr>
      <td colspan="5">
        جاري تحميل الطلبات...
      </td>
    </tr>
  `;
  try {
    const snapshot =
      await getDocs(
        collection(
          db,
          "orders"
        )
      );
    if (snapshot.empty) {
      table.innerHTML = `
        <tr>
          <td colspan="5">
            لا توجد طلبات حتى الآن.
          </td>
        </tr>
      `;
      return;
    }
    table.innerHTML =
      snapshot.docs
        .map(
          item => {
            const order =
              item.data();
            return `
              <tr>
                <td>
                  ${escapeHTML(
                    item.id
                  )}
                </td>
                <td>
                  ${escapeHTML(
                    order.customerName ||
                    order.name ||
                    "غير محدد"
                  )}
                </td>
                <td>
                  ${escapeHTML(
                    order.location ||
                    order.address ||
                    "غير محدد"
                  )}
                </td>
                <td>
                  ${Number(
                    order.total || 0
                  )}
                  جنيه
                </td>
                <td>
                  <span class="badge">
                    ${escapeHTML(
                      order.status ||
                      "جديد"
                    )}
                  </span>
                </td>
              </tr>
            `;
          }
        )
        .join("");
  } catch (error) {
    console.error(
      "Load Orders Error:",
      error
    );
    table.innerHTML = `
      <tr>
        <td colspan="5">
          حدث خطأ أثناء تحميل الطلبات ❌
        </td>
      </tr>
    `;
  }
}
/* =====================================================
   IMAGE PREVIEW
===================================================== */
window.previewImage =
function(url) {
  if (!url) return;
  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
};
/* =====================================================
   START ADMIN
===================================================== */
async function startAdmin() {
  if (!db) {
    return;
  }
  await loadRestaurants();
  await loadProducts();
  await loadOrders();
  console.log(
    "Admin Panel Ready ✅"
  );
}
startAdmin();
