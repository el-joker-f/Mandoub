/* =====================================================
   MANDOUB - ADMIN.JS
   لوحة التحكم + Firebase Firestore
   + موقع المطاعم
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
  updateDoc,
  getDoc,
  setDoc,
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
   FIREBASE
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
    "Firebase Error:",
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

    offers:
      "إدارة العروض",

    orders:
      "إدارة الطلبات",

    drivers:
      "إدارة الطيارين",

    customers:
      "إدارة العملاء",

    settings:
      "إعدادات الموقع"

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


  if (page === "offers") {

    loadRestaurants()
      .then(() => loadOffers());

  }


  if (page === "orders") {

    loadOrders();

  }


  if (page === "drivers") {

    loadDrivers();

  }


  if (page === "settings") {

    loadSettings();

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

function getRestaurantLocation() {

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


  if (
    latitude === "" &&
    longitude === ""
  ) {

    return null;

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
      "خط العرض وخط الطول لازم يكونوا أرقام صحيحة ❌"
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
   OPEN RESTAURANT LOCATION
===================================================== */

window.openRestaurantLocation =
function(latitude, longitude) {

  if (
    latitude === undefined ||
    longitude === undefined
  ) {

    message(
      "موقع المطعم غير محدد"
    );

    return;

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
      "بيانات الموقع غير صحيحة"
    );

    return;

  }


  const url =
    "https://www.google.com/maps?q=" +
    encodeURIComponent(
      lat + "," + lng
    );


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

};


/* =====================================================
   CLEAR RESTAURANT
===================================================== */

function clearRestaurantForm() {

  const ids = [

    "restaurantName",

    "restaurantCategory",

    "restaurantRating",

    "restaurantDelivery",

    "restaurantDescription",

    "restaurantImage",

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


  const rating =
    document
      .getElementById(
        "restaurantRating"
      )
      ?.value;


  const delivery =
    document
      .getElementById(
        "restaurantDelivery"
      )
      ?.value;


  const description =
    document
      .getElementById(
        "restaurantDescription"
      )
      ?.value
      .trim();


  const image =
    document
      .getElementById(
        "restaurantImage"
      )
      ?.value
      .trim();


  if (!name) {

    message(
      "اكتب اسم المطعم أولاً"
    );

    return;

  }


  const location =
    getRestaurantLocation();


  if (location === false) {

    return;

  }


  try {

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

        rating:
          Number(
            rating || 0
          ),

        delivery:
          Number(
            delivery || 0
          ),

        description:
          description || "",

        image:
          image || "",

        location:
          location,

        active:
          true,

        createdAt:
          serverTimestamp()

      }
    );


    clearRestaurantForm();


    message(
      location
        ? "تم إضافة المطعم وموقعه ✅"
        : "تم إضافة المطعم بدون موقع 📍"
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


    const count =
      document.getElementById(
        "restaurantsCount"
      );


    if (count) {

      count.textContent =
        restaurants.length;

    }


    updateRestaurantSelects();


    if (!list) return;


    if (restaurants.length === 0) {

      list.innerHTML = `

        <div style="color:#899aaa">
          لا توجد مطاعم حتى الآن.
        </div>

      `;

      return;

    }


    list.innerHTML =
      restaurants
        .map(
          restaurant => {

            const image =
              restaurant.image ||
              "";


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
                      restaurant.name
                    )}

                  </strong>


                  <small>

                    ${escapeHTML(
                      restaurant.category ||
                      "بدون تصنيف"
                    )}

                    • التقييم:

                    ${restaurant.rating || 0}

                    ⭐

                    • التوصيل:

                    ${restaurant.delivery || 0}

                    جنيه

                  </small>


                  ${
                    hasLocation
                    ? `
                      <small style="display:block;margin-top:6px;color:#00dfff">

                        📍

                        ${Number(
                          location.latitude
                        ).toFixed(6)}

                        ,

                        ${Number(
                          location.longitude
                        ).toFixed(6)}

                      </small>
                    `
                    : `
                      <small style="display:block;margin-top:6px;color:#ffb84d">

                        📍 الموقع غير محدد

                      </small>
                    `
                  }

                </div>


                <div class="item-actions">

                  ${
                    image
                    ? `
                      <button
                        class="secondary"
                        onclick="previewImage('${escapeHTML(
                          image
                        )}')">

                        الصورة

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
                          ${Number(location.latitude)},
                          ${Number(location.longitude)}
                        )">

                        📍 الخريطة

                      </button>
                    `
                    : ""
                  }


                  <button
                    class="danger"
                    onclick="deleteRestaurant('${restaurant.id}')">

                    حذف

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
      "هل تريد حذف المطعم نهائيًا؟"
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
      error
    );


    message(
      "تعذر حذف المطعم ❌"
    );

  }

};


/* =====================================================
   RESTAURANT SELECTS
===================================================== */

function updateRestaurantSelects() {

  const productSelect =
    document.getElementById(
      "productRestaurant"
    );


  const offerSelect =
    document.getElementById(
      "offerRestaurant"
    );


  if (productSelect) {

    productSelect.innerHTML = `

      <option value="">
        اختر المطعم
      </option>

      ${
        restaurants
          .map(
            restaurant => `

              <option
                value="${restaurant.id}">

                ${escapeHTML(
                  restaurant.name
                )}

              </option>

            `
          )
          .join("")
      }

    `;

  }


  if (offerSelect) {

    offerSelect.innerHTML = `

      <option value="">
        كل المطاعم
      </option>

      ${
        restaurants
          .map(
            restaurant => `

              <option
                value="${restaurant.id}">

                ${escapeHTML(
                  restaurant.name
                )}

              </option>

            `
          )
          .join("")
      }

    `;

  }

}


/* =====================================================
   PRODUCTS
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


  const price =
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
    !restaurantId ||
    !name ||
    !price
  ) {

    message(
      "اختر المطعم واكتب اسم المنتج والسعر"
    );

    return;

  }


  try {

    await addDoc(
      collection(
        db,
        "products"
      ),
      {

        restaurantId:
          restaurantId,

        name:
          name,

        price:
          Number(price),

        image:
          image,

        description:
          description,

        active:
          true,

        createdAt:
          serverTimestamp()

      }
    );


    document.getElementById(
      "productName"
    ).value = "";


    document.getElementById(
      "productPrice"
    ).value = "";


    document.getElementById(
      "productImage"
    ).value = "";


    document.getElementById(
      "productDescription"
    ).value = "";


    message(
      "تم إضافة المنتج ✅"
    );


    await loadProducts();


  } catch (error) {

    console.error(
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

    const snapshot =
      await getDocs(
        collection(
          db,
          "products"
        )
      );


    const count =
      document.getElementById(
        "productsCount"
      );


    if (count) {

      count.textContent =
        snapshot.size;

    }


    if (!list) return;


    if (snapshot.empty) {

      list.innerHTML = `

        <div style="color:#899aaa">

          لا توجد منتجات حتى الآن.

        </div>

      `;

      return;

    }


    list.innerHTML =
      snapshot.docs
        .map(
          item => {

            const product =
              item.data();


            const restaurant =
              restaurants.find(
                restaurant =>
                  restaurant.id ===
                  product.restaurantId
              );


            return `

              <div class="item">

                <div class="item-info">

                  <strong>
                    ${escapeHTML(
                      product.name || ""
                    )}
                  </strong>

                  <small>

                    ${escapeHTML(
                      restaurant?.name ||
                      "مطعم غير معروف"
                    )}

                    • السعر:

                    ${product.price || 0}

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

                        الصورة

                      </button>
                    `
                    : ""
                  }


                  <button
                    class="danger"
                    onclick="deleteProduct('${item.id}')">

                    حذف

                  </button>

                </div>

              </div>

            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
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
async function(id) {

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
        "products",
        id
      )
    );


    message(
      "تم حذف المنتج ✅"
    );


    await loadProducts();


  } catch (error) {

    console.error(
      error
    );


    message(
      "تعذر حذف المنتج ❌"
    );

  }

};


/* =====================================================
   OFFERS
===================================================== */

window.addOffer =
async function() {

  if (!db) {

    message(
      "Firebase غير متصل ❌"
    );

    return;

  }


  const title =
    document
      .getElementById(
        "offerTitle"
      )
      ?.value
      .trim();


  const restaurantId =
    document
      .getElementById(
        "offerRestaurant"
      )
      ?.value;


  const discount =
    document
      .getElementById(
        "offerDiscount"
      )
      ?.value
      .trim();


  const image =
    document
      .getElementById(
        "offerImage"
      )
      ?.value
      .trim();


  const start =
    document
      .getElementById(
        "offerStart"
      )
      ?.value;


  const end =
    document
      .getElementById(
        "offerEnd"
      )
      ?.value;


  const description =
    document
      .getElementById(
        "offerDescription"
      )
      ?.value
      .trim();


  if (!title) {

    message(
      "اكتب عنوان العرض أولاً"
    );

    return;

  }


  try {

    await addDoc(
      collection(
        db,
        "offers"
      ),
      {

        title:
          title,

        restaurantId:
          restaurantId || null,

        discount:
          discount,

        image:
          image,

        start:
          start,

        end:
          end,

        description:
          description,

        active:
          true,

        createdAt:
          serverTimestamp()

      }
    );


    document.getElementById(
      "offerTitle"
    ).value = "";


    document.getElementById(
      "offerDiscount"
    ).value = "";


    document.getElementById(
      "offerImage"
    ).value = "";


    document.getElementById(
      "offerDescription"
    ).value = "";


    message(
      "تم إضافة العرض 🎁"
    );


    await loadOffers();


  } catch (error) {

    console.error(
      error
    );


    message(
      "حدث خطأ أثناء إضافة العرض ❌"
    );

  }

};


/* =====================================================
   LOAD OFFERS
===================================================== */

async function loadOffers() {

  if (!db) return;


  const list =
    document.getElementById(
      "offersList"
    );


  if (list) {

    list.innerHTML =
      "جاري تحميل العروض...";

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "offers"
        )
      );


    if (!list) return;


    if (snapshot.empty) {

      list.innerHTML = `

        <div style="color:#899aaa">

          لا توجد عروض حتى الآن.

        </div>

      `;

      return;

    }


    list.innerHTML =
      snapshot.docs
        .map(
          item => {

            const offer =
              item.data();


            const restaurant =
              restaurants.find(
                restaurant =>
                  restaurant.id ===
                  offer.restaurantId
              );


            return `

              <div class="item">

                <div class="item-info">

                  <strong>

                    ${escapeHTML(
                      offer.title || ""
                    )}

                  </strong>

                  <small>

                    خصم:

                    ${escapeHTML(
                      offer.discount || "-"
                    )}

                    ${
                      restaurant
                      ? `
                        • ${escapeHTML(
                          restaurant.name
                        )}
                      `
                      : ""
                    }

                    ${
                      offer.start ||
                      offer.end
                      ? `
                        • ${escapeHTML(
                          offer.start || "-"
                        )}

                        إلى

                        ${escapeHTML(
                          offer.end || "-"
                        )}
                      `
                      : ""
                    }

                  </small>

                </div>


                <div class="item-actions">

                  ${
                    offer.image
                    ? `
                      <button
                        class="secondary"
                        onclick="previewImage('${escapeHTML(
                          offer.image
                        )}')">

                        الصورة

                      </button>
                    `
                    : ""
                  }


                  <button
                    class="danger"
                    onclick="deleteOffer('${item.id}')">

                    حذف

                  </button>

                </div>

              </div>

            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      error
    );


    if (list) {

      list.innerHTML =
        "حدث خطأ أثناء تحميل العروض ❌";

    }

  }

}


/* =====================================================
   DELETE OFFER
===================================================== */

window.deleteOffer =
async function(id) {

  if (!db) return;


  if (
    !confirm(
      "هل تريد حذف العرض؟"
    )
  ) {

    return;

  }


  try {

    await deleteDoc(
      doc(
        db,
        "offers",
        id
      )
    );


    message(
      "تم حذف العرض ✅"
    );


    await loadOffers();


  } catch (error) {

    console.error(
      error
    );


    message(
      "تعذر حذف العرض ❌"
    );

  }

};


/* =====================================================
   DRIVERS
===================================================== */

window.addDriver =
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
        "driverName"
      )
      ?.value
      .trim();


  const phone =
    document
      .getElementById(
        "driverPhone"
      )
      ?.value
      .trim();


  const status =
    document
      .getElementById(
        "driverStatus"
      )
      ?.value;


  if (!name || !phone) {

    message(
      "اكتب اسم الطيار ورقم الهاتف"
    );

    return;

  }


  try {

    await addDoc(
      collection(
        db,
        "drivers"
      ),
      {

        name:
          name,

        phone:
          phone,

        status:
          status,

        active:
          true,

        createdAt:
          serverTimestamp()

      }
    );


    document.getElementById(
      "driverName"
    ).value = "";


    document.getElementById(
      "driverPhone"
    ).value = "";


    message(
      "تم إضافة الطيار 🛵"
    );


    await loadDrivers();


  } catch (error) {

    console.error(
      error
    );


    message(
      "حدث خطأ أثناء إضافة الطيار ❌"
    );

  }

};


/* =====================================================
   LOAD DRIVERS
===================================================== */

async function loadDrivers() {

  if (!db) return;


  const list =
    document.getElementById(
      "driversList"
    );


  if (list) {

    list.innerHTML =
      "جاري تحميل الطيارين...";

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "drivers"
        )
      );


    const count =
      document.getElementById(
        "driversCount"
      );


    if (count) {

      count.textContent =
        snapshot.size;

    }


    if (!list) return;


    if (snapshot.empty) {

      list.innerHTML = `

        <div style="color:#899aaa">

          لا يوجد طيارين حتى الآن.

        </div>

      `;

      return;

    }


    list.innerHTML =
      snapshot.docs
        .map(
          item => {

            const driver =
              item.data();


            return `

              <div class="item">

                <div class="item-info">

                  <strong>

                    ${escapeHTML(
                      driver.name || ""
                    )}

                  </strong>

                  <small>

                    ${escapeHTML(
                      driver.phone || ""
                    )}

                    • الحالة:

                    ${escapeHTML(
                      driver.status ||
                      "غير محدد"
                    )}

                  </small>

                </div>


                <div class="item-actions">

                  <button
                    class="secondary"
                    onclick="toggleDriverStatus(
                      '${item.id}',
                      '${escapeHTML(
                        driver.status ||
                        "غير متاح"
                      )}'
                    )">

                    تغيير الحالة

                  </button>


                  <button
                    class="danger"
                    onclick="deleteDriver('${item.id}')">

                    حذف

                  </button>

                </div>

              </div>

            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      error
    );

  }

}


/* =====================================================
   TOGGLE DRIVER STATUS
===================================================== */

window.toggleDriverStatus =
async function(
  id,
  currentStatus
) {

  if (!db) return;


  const newStatus =
    currentStatus === "متاح"
      ? "غير متاح"
      : "متاح";


  try {

    await updateDoc(
      doc(
        db,
        "drivers",
        id
      ),
      {

        status:
          newStatus

      }
    );


    message(
      "تم تغيير حالة الطيار ✅"
    );


    await loadDrivers();


  } catch (error) {

    console.error(
      error
    );


    message(
      "تعذر تغيير الحالة ❌"
    );

  }

};


/* =====================================================
   DELETE DRIVER
===================================================== */

window.deleteDriver =
async function(id) {

  if (!db) return;


  if (
    !confirm(
      "هل تريد حذف الطيار؟"
    )
  ) {

    return;

  }


  try {

    await deleteDoc(
      doc(
        db,
        "drivers",
        id
      )
    );


    message(
      "تم حذف الطيار ✅"
    );


    await loadDrivers();


  } catch (error) {

    console.error(
      error
    );


    message(
      "تعذر حذف الطيار ❌"
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


  if (table) {

    table.innerHTML = `

      <tr>

        <td colspan="6">

          جاري تحميل الطلبات...

        </td>

      </tr>

    `;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "orders"
        )
      );


    const count =
      document.getElementById(
        "ordersCount"
      );


    if (count) {

      count.textContent =
        snapshot.size;

    }


    if (!table) return;


    if (snapshot.empty) {

      table.innerHTML = `

        <tr>

          <td colspan="6">

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

                  ${order.total || 0}

                  جنيه

                </td>


                <td>

                  ${escapeHTML(
                    order.driverName ||
                    "لم يتم التعيين"
                  )}

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
      error
    );


    if (table) {

      table.innerHTML = `

        <tr>

          <td colspan="6">

            حدث خطأ أثناء تحميل الطلبات ❌

          </td>

        </tr>

      `;

    }

  }

}


/* =====================================================
   SETTINGS
===================================================== */

window.saveSettings =
async function() {

  if (!db) {

    message(
      "Firebase غير متصل ❌"
    );

    return;

  }


  const siteName =
    document
      .getElementById(
        "siteName"
      )
      ?.value
      .trim();


  const sitePhone =
    document
      .getElementById(
        "sitePhone"
      )
      ?.value
      .trim();


  const defaultDelivery =
    Number(
      document
        .getElementById(
          "defaultDelivery"
        )
        ?.value ||
        0
    );


  const ordersEnabled =
    document
      .getElementById(
        "ordersEnabled"
      )
      ?.value ===
      "true";


  try {

    await setDoc(
      doc(
        db,
        "settings",
        "site"
      ),
      {

        siteName:
          siteName,

        sitePhone:
          sitePhone,

        defaultDelivery:
          defaultDelivery,

        ordersEnabled:
          ordersEnabled,

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


    message(
      "تم حفظ الإعدادات ✅"
    );


  } catch (error) {

    console.error(
      error
    );


    message(
      "تعذر حفظ الإعدادات ❌"
    );

  }

};


/* =====================================================
   LOAD SETTINGS
===================================================== */

async function loadSettings() {

  if (!db) return;


  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "settings",
          "site"
        )
      );


    if (!snapshot.exists()) {

      return;

    }


    const settings =
      snapshot.data();


    const siteName =
      document.getElementById(
        "siteName"
      );


    const sitePhone =
      document.getElementById(
        "sitePhone"
      );


    const defaultDelivery =
      document.getElementById(
        "defaultDelivery"
      );


    const ordersEnabled =
      document.getElementById(
        "ordersEnabled"
      );


    if (siteName) {

      siteName.value =
        settings.siteName ||
        "مندوب";

    }


    if (sitePhone) {

      sitePhone.value =
        settings.sitePhone ||
        "";

    }


    if (defaultDelivery) {

      defaultDelivery.value =
        settings.defaultDelivery ??
        25;

    }


    if (ordersEnabled) {

      ordersEnabled.value =
        settings.ordersEnabled === false
          ? "false"
          : "true";

    }

  } catch (error) {

    console.error(
      error
    );

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
   DASHBOARD
===================================================== */

async function loadDashboard() {

  if (!db) return;


  try {

    await loadRestaurants();

    await loadProducts();

    await loadDrivers();

    await loadOrders();

  } catch (error) {

    console.error(
      error
    );

  }

}


/* =====================================================
   START
===================================================== */

async function startAdmin() {

  if (!db) {

    return;

  }


  await loadRestaurants();

  await loadProducts();

  await loadOffers();

  await loadDrivers();

  await loadOrders();

  await loadSettings();


  console.log(
    "Admin Panel Ready ✅"
  );

}


startAdmin();
