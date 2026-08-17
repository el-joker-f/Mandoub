/* =====================================================
   MANDOUB - SCRIPT.JS
   السلة + تحديد الموقع + إرسال الطلب إلى Firebase
===================================================== */

let cart = [];

let selectedLocation = "";

let firebaseReady = false;


/* =====================================================
   FIREBASE
===================================================== */

function waitForFirebase() {

  return new Promise((resolve) => {

    if (window.firebaseReady === true) {
      firebaseReady = true;
      resolve(true);
      return;
    }

    let tries = 0;

    const timer = setInterval(() => {

      tries++;

      if (window.firebaseReady === true) {

        clearInterval(timer);

        firebaseReady = true;

        resolve(true);

      }

      if (tries >= 50) {

        clearInterval(timer);

        firebaseReady = false;

        resolve(false);

      }

    }, 100);

  });

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(message) {

  let old = document.getElementById("siteMessage");

  if (old) {
    old.remove();
  }

  const box = document.createElement("div");

  box.id = "siteMessage";

  box.textContent = message;

  box.style.position = "fixed";
  box.style.left = "50%";
  box.style.bottom = "25px";
  box.style.transform = "translateX(-50%)";
  box.style.zIndex = "99999";
  box.style.width = "calc(100% - 30px)";
  box.style.maxWidth = "430px";
  box.style.padding = "15px 18px";
  box.style.borderRadius = "15px";
  box.style.background = "#00dfff";
  box.style.color = "#00121d";
  box.style.fontWeight = "900";
  box.style.textAlign = "center";
  box.style.boxShadow = "0 10px 35px rgba(0,0,0,.35)";

  document.body.appendChild(box);

  setTimeout(() => {

    box.remove();

  }, 3000);

}


/* =====================================================
   LOCATION
===================================================== */

function setLocation() {

  const input =
    document.getElementById("locationInput");

  const message =
    document.getElementById("locationMsg");


  if (!navigator.geolocation) {

    message.textContent =
      "❌ جهازك لا يدعم تحديد الموقع";

    return;

  }


  message.textContent =
    "📍 جاري تحديد موقعك...";


  navigator.geolocation.getCurrentPosition(

    async function(position) {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


      selectedLocation =
        `${latitude}, ${longitude}`;


      input.value =
        `تم تحديد موقعك 📍`;


      message.textContent =
        "✅ تم تحديد موقعك بنجاح";


      localStorage.setItem(
        "mandoub_location",
        selectedLocation
      );


      try {

        await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`,
          {
            headers: {
              "Accept": "application/json"
            }
          }
        )
        .then(res => res.json())
        .then(data => {

          if (
            data &&
            data.display_name
          ) {

            input.value =
              data.display_name;

            selectedLocation =
              data.display_name;

            localStorage.setItem(
              "mandoub_location",
              selectedLocation
            );

          }

        });

      } catch (error) {

        console.log(
          "لم يتم جلب اسم العنوان",
          error
        );

      }

    },

    function(error) {

      console.error(
        "Location Error:",
        error
      );


      if (error.code === 1) {

        message.textContent =
          "❌ لازم تسمح للموقع بالوصول إلى موقعك";

      }

      else if (error.code === 2) {

        message.textContent =
          "❌ تعذر تحديد موقعك";

      }

      else if (error.code === 3) {

        message.textContent =
          "❌ انتهى وقت تحديد الموقع، حاول مرة أخرى";

      }

      else {

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
   LOAD SAVED LOCATION
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    const saved =
      localStorage.getItem(
        "mandoub_location"
      );

    if (!saved) {
      return;
    }

    selectedLocation = saved;

    const input =
      document.getElementById(
        "locationInput"
      );

    if (input) {

      input.value =
        saved;

    }

  }
);


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

  }

  else {

    cart.push({

      name: name,

      price: Number(price),

      quantity: 1

    });

  }


  updateCartCount();

  showMessage(
    `✅ تم إضافة ${name} إلى السلة`
  );


  openCart();

}


/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

  const countElement =
    document.getElementById(
      "cartCount"
    );


  if (!countElement) {
    return;
  }


  const count =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  countElement.textContent =
    count;

}


/* =====================================================
   CART TOTAL
===================================================== */

function getCartTotal() {

  return cart.reduce(

    (total, item) => {

      return total +
        (item.price * item.quantity);

    },

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
   CREATE CART MODAL
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

  const total =
    document.getElementById(
      "cartTotal"
    );


  if (!container || !total) {
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


    total.innerHTML = "";

    return;

  }


  container.innerHTML = "";


  cart.forEach(
    (item, index) => {

      const itemElement =
        document.createElement(
          "div"
        );


      itemElement.className =
        "cart-item";


      itemElement.innerHTML = `

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
            style="
              background:#00dfff;
              color:#00121d;
              padding:7px 10px;
            "
            onclick="increaseItem(${index})">

            +

          </button>


          <strong>
            ${item.quantity}
          </strong>


          <button
            type="button"
            style="
              background:#173b55;
              padding:7px 10px;
            "
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
        itemElement
      );

    }
  );


  const cartTotal =
    getCartTotal();


  total.innerHTML = `

    <span>
      الإجمالي
    </span>

    <strong>
      ${cartTotal} جنيه
    </strong>

  `;

}


/* =====================================================
   INCREASE ITEM
===================================================== */

function increaseItem(index) {

  if (!cart[index]) {
    return;
  }

  cart[index].quantity++;

  updateCartCount();

  renderCart();

}


/* =====================================================
   DECREASE ITEM
===================================================== */

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


/* =====================================================
   REMOVE ITEM
===================================================== */

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


    const locationInput =
      document.getElementById(
        "locationInput"
      );


    if (locationInput) {

      locationInput.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      locationInput.focus();

    }

    return;

  }


  message.textContent =
    "⏳ جاري إرسال الطلب...";


  const ready =
    await waitForFirebase();


  if (!ready) {

    message.textContent =
      "❌ Firebase غير متصل";

    console.error(
      "Firebase is not ready"
    );

    return;

  }


  try {

    const orderData = {

      items: cart.map(item => ({

        name: item.name,

        price: item.price,

        quantity: item.quantity

      })),

      total:
        getCartTotal(),

      location:
        selectedLocation,

      status:
        "جديد",

      createdAt:
        window.firebaseServerTimestamp()

    };


    const orders =
      window.firebaseCollection(
        window.firebaseDB,
        "orders"
      );


    const result =
      await window.firebaseAddDoc(
        orders,
        orderData
      );


    console.log(
      "Order ID:",
      result.id
    );


    message.textContent =
      "✅ تم إرسال طلبك بنجاح";


    showMessage(
      "✅ تم إرسال الطلب بنجاح"
    );


    cart = [];

    updateCartCount();

    renderCart();


    setTimeout(() => {

      closeCart();

    }, 1800);


  }

  catch (error) {

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

function trackOrder() {

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


  message.textContent =
    "🔎 جاري البحث عن الطلب...";


  waitForFirebase()
    .then(async ready => {

      if (!ready) {

        message.textContent =
          "❌ Firebase غير متصل";

        return;

      }


      try {

        const {
          doc,
          getDoc
        } = await import(
          "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"
        );


        const orderRef =
          doc(
            window.firebaseDB,
            "orders",
            orderNumber
          );


        const snapshot =
          await getDoc(
            orderRef
          );


        if (!snapshot.exists()) {

          message.textContent =
            "❌ الطلب غير موجود";

          return;

        }


        const data =
          snapshot.data();


        message.textContent =
          `📦 حالة الطلب: ${data.status || "جديد"}`;

      }

      catch (error) {

        console.error(error);

        message.textContent =
          "❌ تعذر البحث عن الطلب";

      }

    });

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
    "👤 تسجيل الدخول هنضيفه في الخطوة الجاية"
  );

}


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


/* =====================================================
   START
===================================================== */

console.log(
  "Mandoub Script Loaded ✅"
);

waitForFirebase()
  .then(ready => {

    console.log(
      ready
        ? "Firebase Ready ✅"
        : "Firebase Not Ready ❌"
    );

  });
