/* =====================================================
   MANDOUB - ADMIN.JS
   لوحة التحكم + Firebase Firestore
   إصلاح وترقية restaurants تلقائياً
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
   GET LOCATION
   يدعم IDs القديمة والجديدة
===================================================== */

function getRestaurantLocation() {

  const latitudeInput =
    document.getElementById(
      "restaurantLat"
    ) ||
    document.getElementById(
      "restaurantLatitude"
    );


  const longitudeInput =
    document.getElementById(
      "restaurantLng"
    ) ||
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


  if (
    latitude === "" ||
    longitude === ""
  ) {

    message(
      "اكتب خط العرض وخط الطول معاً ❌"
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
      "خط العرض وخط الطول لازم يكونوا أرقام ❌"
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
   تحديد موقع المطعم تلقائياً
   من GPS الجهاز
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


  message(
    "جاري تحديد موقع المطعم 📍"
  );


  navigator.geolocation.getCurrentPosition(

    position => {

      const lat =
        position.coords.latitude;


      const lng =
        position.coords.longitude;


      const latitudeInput =
        document.getElementById(
          "restaurantLat"
        ) ||
        document.getElementById(
          "restaurantLatitude"
        );


      const longitudeInput =
        document.getElementById(
          "restaurantLng"
        ) ||
        document.getElementById(
          "restaurantLongitude"
        );


      if (latitudeInput) {

        latitudeInput.value =
          lat;

      }


      if (longitudeInput) {

        longitudeInput.value =
          lng;

      }


      message(
        "تم تحديد موقع المطعم 📍✅"
      );

    },


    error => {

      console.error(
        "Geolocation Error:",
        error
      );


      message(
        "لم نتمكن من تحديد الموقع ❌"
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
   OPEN RESTAURANT LOCATION
===================================================== */

window.openRestaurantLocation =
function(latitude, longitude) {

  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude === null ||
    longitude === null
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
   CLEAR RESTAURANT FORM
===================================================== */

function clearRestaurantForm() {

  const ids = [

    "restaurantName",

    "restaurantCategory",

    "restaurantRating",

    "restaurantDelivery",

    "restaurantDescription",

    "restaurantImage",

    "restaurantLat",

    "restaurantLng",

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
   MIGRATE / REPAIR RESTAURANTS
   إصلاح المطاعم الموجودة تلقائياً
===================================================== */

async function repairRestaurants() {

  if (!db) return;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "restaurants"
        )
      );


    let repaired =
      0;


    for (
      const restaurantDoc
      of snapshot.docs
    ) {

      const data =
        restaurantDoc.data();


      const changes = {};


      /* -----------------------------------------
         delivery
      ----------------------------------------- */

      if (
        data.delivery === undefined
      ) {

        changes.delivery =
          0;

      }


      /* -----------------------------------------
         active
      ----------------------------------------- */

      if (
        data.active === undefined
      ) {

        changes.active =
          true;

      }


      /* -----------------------------------------
         rating
      ----------------------------------------- */

      if (
        data.rating === undefined
      ) {

        changes.rating =
          0;

      }


      /* -----------------------------------------
         category
      ----------------------------------------- */

      if (
        data.category === undefined
      ) {

        changes.category =
          "";

      }


      /* -----------------------------------------
         description
      ----------------------------------------- */

      if (
        data.description === undefined
      ) {

        changes.description =
          "";

      }


      /* -----------------------------------------
         image
      ----------------------------------------- */

      if (
        data.image === undefined
      ) {

        changes.image =
          "";

      }


      /* -----------------------------------------
         location
      ----------------------------------------- */

      if (
        data.location === undefined ||
        data.location === null
      ) {

        changes.location = {

          latitude:
            null,

          longitude:
            null

        };

      } else {

        if (
          data.location.latitude === undefined
        ) {

          changes[
            "location.latitude"
          ] =
            null;

        }


        if (
          data.location.longitude === undefined
        ) {

          changes[
            "location.longitude"
          ] =
            null;

        }

      }


      /* -----------------------------------------
         createdAt
      ----------------------------------------- */

      if (
        data.createdAt === undefined
      ) {

        changes.createdAt =
          serverTimestamp();

      }


      /* -----------------------------------------
         SAVE CHANGES
      ----------------------------------------- */

      if (
        Object.keys(changes).length > 0
      ) {

        await updateDoc(
          restaurantDoc.ref,
          changes
        );


        repaired++;

      }

    }


    console.log(
      "Restaurants repaired:",
      repaired
    );


    if (repaired > 0) {

      message(
        "تم إصلاح بيانات المطاعم تلقائياً ✅"
      );

    }


  } catch (error) {

    console.error(
      "Repair Restaurants Error:",
      error
    );


    message(
      "تعذر إصلاح بيانات المطاعم ❌"
    );

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
          location || {

            latitude:
              null,

            longitude:
              null

          },

        active:
          true,

        createdAt:
          serverTimestamp()

      }
    );


    clearRestaurantForm();


    message(
      "تم إضافة المطعم بالكامل ✅"
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


    updateRestaurantSelects();


    if (!list) return;


    if (
      restaurants.length === 0
    ) {

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

                    ${escapeHTML(
                      restaurant.category ||
                      "بدون تصنيف"
                    )}

                    • التقييم:

                    ${Number(
                      restaurant.rating || 0
                    )}

                    ⭐

                    • التوصيل:

                    ${Number(
                      restaurant.delivery || 0
                    )}

                    جنيه

                  </small>


                  ${
                    hasLocation
                    ? `
                      <small
                        style="
                          display:block;
                          margin-top:6px;
                          color:#00dfff;
                        "
                      >

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
                      <small
                        style="
                          display:block;
                          margin-top:6px;
                          color:#ffb84d;
                        "
                      >

                        📍 الموقع غير محدد

                      </small>
                    `
                  }

                </div>


                <div class="item-actions">

                  ${
                    restaurant.image
                    ? `
                      <button
                        class="secondary"
                        onclick="previewImage('${escapeHTML(
                          restaurant.image
                        )}')"
                      >

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
                          ${Number(
                            location.latitude
                          )},
                          ${Number(
                            location.longitude
                          )}
                        )"
                      >

                        📍 الخريطة

                      </button>
                    `
                    : ""
                  }


                  <button
                    class="danger"
                    onclick="deleteRestaurant('${restaurant.id}')"
                  >

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
      "هل تريد حذف المطعم نهائياً؟"
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

function updateRestaurantSelects() {

  const productSelect =
    document.getElementById(
      "productRestaurant"
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
                value="${escapeHTML(
                  restaurant.id
                )}"
              >

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

}


/* =====================================================
   PRODUCTS
   مهم:
   المنتجات تحفظ داخل المطعم نفسه
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
    price === ""
  ) {

    message(
      "اختر المطعم واكتب اسم المنتج والسعر"
    );

    return;

  }


  const numericPrice =
    Number(price);


  if (
    !Number.isFinite(
      numericPrice
    ) ||
    numericPrice < 0
  ) {

    message(
      "السعر غير صحيح ❌"
    );

    return;

  }


  try {

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
          numericPrice,

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

    const allProducts = [];


    for (
      const restaurant
      of restaurants
    ) {

      const snapshot =
        await getDocs(
          collection(
            db,
            "restaurants",
            restaurant.id,
            "products"
          )
        );


      snapshot.forEach(
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

        <div style="color:#899aaa">

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

                  ${escapeHTML(
                    product.restaurantName ||
                    "مطعم"
                  )}

                  • السعر:

                  ${Number(
                    product.price || 0
                  )}

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
                      )}')"
                    >

                      الصورة

                    </button>
                  `
                  : ""
                }


                <button
                  class="danger"
                  onclick="deleteProduct(
                    '${product.restaurantId}',
                    '${product.id}'
                  )"
                >

                  حذف

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

      <td colspan="6">

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


    if (
      snapshot.empty
    ) {

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

                  ${Number(
                    order.total || 0
                  )}

                  جنيه

                </td>


                <td>

                  ${escapeHTML(
                    order.driverName ||
                    "لم يتم التعيين"
                  )}

                </td>


                <td>

                  ${escapeHTML(
                    order.status ||
                    "جديد"
                  )}

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

        <td colspan="6">

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


  console.log(
    "Starting Admin Panel..."
  );


  /* -----------------------------------------------
     أول حاجة:
     إصلاح restaurants الموجودة بالفعل
  ------------------------------------------------ */

  await repairRestaurants();


  /* -----------------------------------------------
     تحميل المطاعم
  ------------------------------------------------ */

  await loadRestaurants();


  /* -----------------------------------------------
     تحميل المنتجات
  ------------------------------------------------ */

  await loadProducts();


  /* -----------------------------------------------
     تحميل الطلبات
  ------------------------------------------------ */

  await loadOrders();


  console.log(
    "Admin Panel Ready ✅"
  );

}


startAdmin();
