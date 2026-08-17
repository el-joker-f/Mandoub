/* =====================================================
   MANDOUB - SCRIPT.JS
   Firebase + Cart + Location + Tracking
===================================================== */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   FIREBASE
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


let db = null;
let firebaseReady = false;


try {

  const app =
    initializeApp(firebaseConfig);

  db =
    getFirestore(app);

  firebaseReady = true;

  console.log(
    "Firebase متصل بنجاح ✅"
  );

} catch (error) {

  console.error(
    "Firebase Error:",
    error
  );

  firebaseReady = false;

}


/* =====================================================
   CART
===================================================== */

let cart = [];

let selectedLocation = "";


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(message) {

  const old =
    document.getElementById("siteMessage");

  if (old) {
    old.remove();
  }

  const box =
    document.createElement("div");

  box.id =
    "siteMessage";

  box.textContent =
    message;

  Object.assign(box.style, {

    position: "fixed",

    left: "50%",

    bottom: "25px",

    transform: "translateX(-50%)",

    zIndex: "100000",

    width: "calc(100% - 30px)",

    maxWidth: "430px",

    padding: "15px 18px",

    borderRadius: "15px",

    background: "#00dfff",

    color: "#00121d",

    fontWeight: "900",

    textAlign: "center",

    boxShadow:
      "0 10px 35px rgba(0,0,0,.35)"

  });

  document.body.appendChild(box);

  setTimeout(() => {

    if (box) {
      box.remove();
    }

  }, 3000);

}


/* =====================================================
   LOCATION
===================================================== */

function setLocation() {

  const input =
    document.getElementById(
      "locationInput"
    );

  const message =
    document.getElementById(
      "locationMsg"
    );

  if (!navigator.geolocation) {

    message.textContent =
      "❌ جهازك لا يدعم تحديد الموقع";

    return;

  }

  message.textContent =
    "📍 جاري تحديد موقعك...";

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      selectedLocation =
        `${latitude}, ${longitude}`;

      input.value =
        "تم تحديد موقعك 📍";

      message.textContent =
        "✅ تم تحديد موقعك بنجاح";

      localStorage.setItem(
        "mandoub_location",
        selectedLocation
      );


      try {

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );

        const data =
          await response.json();

        if (
          data &&
          data.display_name
        ) {

          selectedLocation =
            data.display_name;

          input.value =
            data.display_name;

          localStorage.setItem(
            "mandoub_location",
            selectedLocation
          );

        }

      } catch (error) {

        console.log(
          "تعذر الحصول على اسم العنوان",
          error
        );

      }

    },

    (error) => {

      console.error(
        "Location Error:",
        error
      );

      if (error.code === 1) {

        message.textContent =
          "❌ اسمح للموقع بالوصول إلى موقعك";

      } else if (error.code === 2) {

        message.textContent =
          "❌ تعذر تحديد موقعك";

      } else if (error.code === 3) {

        message.textContent =
          "❌ انتهى وقت تحديد الموقع";

      } else {

        message.textContent =
          "❌ حدث خطأ أثناء تحديد الموقع";

      }

    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

  );

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(name, price) {

  const existing =
    cart.find(
      item => item.name === name
    );

  if (existing) {

    existing.quantity++;

  } else {

    cart.push({

      name,

      price: Number(price),

      quantity: 1

    });

  }

  updateCartCount();

  showMessage(
    `✅ تم إضافة ${name} إلى السلة`
  );

}


/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

  const element =
    document.getElementById(
      "cartCount"
    );

  if (!element) {
    return;
  }

  const count =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  element.textContent =
    count;

}


/* =====================================================
   CART TOTAL
===================================================== */

function getCartTotal() {

  return cart.reduce(

    (total, item) =>
      total +
      item.price * item.quantity,

    0

  );

}


/* =====================================================
   OPEN CART
===================================================== */

function openCart() {

  let modal =
    document.getElementById(
      "cartModal"
    );

  if (!modal) {

    createCartModal();

    modal =
      document.getElementById(
        "cartModal"
      );

  }

  modal.style.display =
    "block";

  renderCart();

}


/* =====================================================
   CREATE CART
===================================================== */

function createCartModal() {

  const modal =
    document.createElement("div");

  modal.id =
    "cartModal";

  modal.innerHTML = `

    <div
      class="cart-overlay"
      onclick="closeCart()">
    </div>

    <div class="cart-box">

      <div class="cart-header">

        <h2>
          🛒 سلة الطلبات
        </h2>

        <button
          type="button"
          onclick="closeCart()">

          ✕

        </button>

      </div>

      <div
        id="cartItems"
        class="cart-items">
      </div>

      <div
        id="cartTotal"
        class="cart-total">
      </div>

      <button
        id="checkoutButton"
        class="checkout-button"
        type="button"
        onclick="submitOrder()">

        إتمام الطلب

      </button>

      <p
        id="cartMessage"
        style="
          margin-top:12px;
          color:#00dfff;
          text-align:center;
        ">
      </p>

    </div>

  `;

  document.body.appendChild(
    modal
  );

}


/* =====================================================
   CLOSE CART
===================================================== */

function closeCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );

  if (modal) {

    modal.style.display =
      "none";

  }

}


/* =====================================================
   RENDER CART
===================================================== */

function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );

  const totalElement =
    document.getElementById(
      "cartTotal"
    );

  if (!container || !totalElement) {
    return;
  }


  if (cart.length === 0) {

    container.innerHTML = `

      <div class="empty-cart">

        <div style="font-size:45px">
          🛒
        </div>

        <h3>
          السلة فارغة
        </h3>

        <p>
          أضف طلب من أحد المطاعم أولاً
        </p>

      </div>

    `;

    totalElement.innerHTML = "";

    return;

  }


  container.innerHTML = "";


  cart.forEach(
    (item, index) => {

      const element =
        document.createElement("div");

      element.className =
        "cart-item";

      element.innerHTML = `

        <div>

          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <p>
            ${item.price} جنيه × ${item.quantity}
          </p>

        </div>

        <div
          style="
            display:flex;
            align-items:center;
            gap:6px;
          ">

          <button
            type="button"
            onclick="increaseItem(${index})">

            +

          </button>

          <strong>
            ${item.quantity}
          </strong>

          <button
            type="button"
            onclick="decreaseItem(${index})">

            −

          </button>

          <button
            type="button"
            onclick="removeItem(${index})">

            حذف

          </button>

        </div>

      `;

      container.appendChild(
        element
      );

    }
  );


  totalElement.innerHTML = `

    <span>
      الإجمالي
    </span>

    <strong>
      ${getCartTotal()} جنيه
    </strong>

  `;

}


/* =====================================================
   QUANTITY
===================================================== */

function increaseItem(index) {

  if (!cart[index]) {
    return;
  }

  cart[index].quantity++;

  updateCartCount();

  renderCart();

}


function decreaseItem(index) {

  if (!cart[index]) {
    return;
  }

  cart[index].quantity--;

  if (
    cart[index].quantity <= 0
  ) {

    cart.splice(index, 1);

  }

  updateCartCount();

  renderCart();

}


function removeItem(index) {

  if (!cart[index]) {
    return;
  }

  cart.splice(index, 1);

  updateCartCount();

  renderCart();

}


/* =====================================================
   SUBMIT ORDER
===================================================== */

async function submitOrder() {

  const message =
    document.getElementById(
      "cartMessage"
    );

  if (cart.length === 0) {

    message.textContent =
      "❌ السلة فارغة";

    return;

  }

  if (!selectedLocation) {

    message.textContent =
      "📍 حدد موقع التوصيل أولاً";

    closeCart();

    document
      .getElementById("locationInput")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    return;

  }

  if (!firebaseReady || !db) {

    message.textContent =
      "❌ Firebase غير متصل";

    return;

  }

  message.textContent =
    "⏳ جاري إرسال الطلب...";


  try {

    const orderData = {

      items:
        cart.map(item => ({

          name:
            item.name,

          price:
            item.price,

          quantity:
            item.quantity

        })),

      total:
        getCartTotal(),

      location:
        selectedLocation,

      status:
        "جديد",

      createdAt:
        serverTimestamp()

    };


    const reference =
      await addDoc(
        collection(
          db,
          "orders"
        ),
        orderData
      );


    localStorage.setItem(
      "lastOrderId",
      reference.id
    );


    message.textContent =
      "✅ تم إرسال طلبك بنجاح";


    const orderNumber =
      document.getElementById(
        "orderNumber"
      );

    if (orderNumber) {

      orderNumber.value =
        reference.id;

    }


    cart = [];

    updateCartCount();

    renderCart();

    showMessage(
      `✅ تم إرسال الطلب — رقم الطلب: ${reference.id}`
    );


    setTimeout(
      closeCart,
      1800
    );


  } catch (error) {

    console.error(
      "ORDER ERROR:",
      error
    );

    message.textContent =
      "❌ حصل خطأ أثناء إرسال الطلب";

  }

}


/* =====================================================
   TRACK ORDER
===================================================== */

async function trackOrder() {

  const input =
    document.getElementById(
      "orderNumber"
    );

  const message =
    document.getElementById(
      "trackMsg"
    );

  if (!input || !message) {
    return;
  }

  const orderNumber =
    input.value.trim();

  if (!orderNumber) {

    message.textContent =
      "❌ اكتب رقم الطلب أولاً";

    return;

  }

  if (!firebaseReady || !db) {

    message.textContent =
      "❌ Firebase غير متصل";

    return;

  }

  message.textContent =
    "🔎 جاري البحث عن الطلب...";


  try {

    const reference =
      doc(
        db,
        "orders",
        orderNumber
      );

    const snapshot =
      await getDoc(
        reference
      );


    if (!snapshot.exists()) {

      message.textContent =
        "❌ الطلب غير موجود";

      return;

    }


    const data =
      snapshot.data();


    message.innerHTML = `

      📦 حالة الطلب:
      <strong>
        ${escapeHTML(
          data.status || "جديد"
        )}
      </strong>

      <br>

      الإجمالي:
      ${Number(data.total || 0)} جنيه

    `;

  } catch (error) {

    console.error(
      "TRACK ERROR:",
      error
    );

    message.textContent =
      "❌ تعذر البحث عن الطلب";

  }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =====================================================
   LOGIN
===================================================== */

function openLogin() {

  showMessage(
    "👤 تسجيل الدخول قريبًا"
  );

}


/* =====================================================
   LOAD LOCATION
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const saved =
      localStorage.getItem(
        "mandoub_location"
      );

    if (saved) {

      selectedLocation =
        saved;

      const input =
        document.getElementById(
          "locationInput"
        );

      if (input) {

        input.value =
          saved;

      }

    }

    updateCartCount();

  }
);


/* =====================================================
   GLOBAL
===================================================== */

window.addToCart =
  addToCart;

window.openCart =
  openCart;

window.closeCart =
  closeCart;

window.setLocation =
  setLocation;

window.submitOrder =
  submitOrder;

window.trackOrder =
  trackOrder;

window.showMessage =
  showMessage;

window.increaseItem =
  increaseItem;

window.decreaseItem =
  decreaseItem;

window.removeItem =
  removeItem;

window.openLogin =
  openLogin;


console.log(
  firebaseReady
    ? "Mandoub + Firebase Ready ✅"
    : "Mandoub Loaded — Firebase Error ❌"
);
