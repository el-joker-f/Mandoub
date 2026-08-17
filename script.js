// ================= السلة =================

let cart = [];


// ================= تحديث رقم السلة =================

function updateCartCount() {

  const count =
    document.getElementById("cartCount");

  if (count) {
    count.textContent = cart.length;
  }

}


// ================= إضافة للسلة =================

function addToCart(name, price) {

  cart.push({
    name: name,
    price: Number(price)
  });

  updateCartCount();

  showMessage(
    "تمت إضافة " + name + " إلى السلة 🛒"
  );

}


// ================= فتح السلة =================

function openCart() {

  const old =
    document.getElementById("cartModal");

  if (old) {
    old.remove();
  }


  const modal =
    document.createElement("div");

  modal.id = "cartModal";


  let items = "";


  if (cart.length === 0) {

    items = `
      <div class="empty-cart">

        <div style="font-size:50px">
          🛒
        </div>

        <h3>
          السلة فارغة
        </h3>

        <p>
          أضف منتجًا أولًا.
        </p>

      </div>
    `;

  } else {

    cart.forEach((item, index) => {

      items += `
        <div class="cart-item">

          <div>
            <strong>
              ${item.name}
            </strong>

            <p>
              ${item.price} جنيه
            </p>
          </div>

          <button
            type="button"
            onclick="removeFromCart(${index})">

            حذف

          </button>

        </div>
      `;

    });

  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price),
      0
    );


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


      <div class="cart-items">

        ${items}

      </div>


      ${
        cart.length > 0
        ?
        `

        <div class="cart-total">

          <span>
            الإجمالي
          </span>

          <strong>
            ${total} جنيه
          </strong>

        </div>


        <button
          type="button"
          class="checkout-button"
          onclick="checkout()">

          إتمام الطلب

        </button>

        `
        :
        ""
      }

    </div>

  `;


  document.body.appendChild(modal);

}


// ================= إغلاق السلة =================

function closeCart() {

  const modal =
    document.getElementById("cartModal");

  if (modal) {
    modal.remove();
  }

}


// ================= حذف =================

function removeFromCart(index) {

  cart.splice(index, 1);

  updateCartCount();

  openCart();

}


// ================= انتظار Firebase =================

function waitForFirebase() {

  return new Promise((resolve) => {

    if (window.firebaseReady) {

      resolve();

      return;

    }


    let attempts = 0;


    const timer =
      setInterval(() => {

        attempts++;


        if (window.firebaseReady) {

          clearInterval(timer);

          resolve();

        }


        if (attempts >= 50) {

          clearInterval(timer);

          resolve();

        }

      }, 100);

  });

}


// ================= تسجيل الطلب =================

async function checkout() {

  if (cart.length === 0) {

    showMessage(
      "السلة فارغة ❌"
    );

    return;

  }


  const locationInput =
    document.getElementById(
      "locationInput"
    );


  const location =
    locationInput
      ?
      locationInput.value.trim()
      :
      "";


  if (!location) {

    showMessage(
      "اكتب عنوان التوصيل أولًا 📍"
    );

    return;

  }


  showMessage(
    "جاري تسجيل الطلب..."
  );


  await waitForFirebase();


  if (!window.firebaseReady) {

    showMessage(
      "Firebase غير متصل ❌"
    );

    console.error(
      "Firebase لم يتم تحميله."
    );

    return;

  }


  try {

    const total =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price),
        0
      );


    const order = {

      items: cart.map(item => ({

        name: item.name,

        price: Number(item.price)

      })),

      total: total,

      location: location,

      status: "جديد",

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
        order
      );


    const orderId =
      result.id;


    localStorage.setItem(
      "lastOrderId",
      orderId
    );


    cart = [];

    updateCartCount();

    closeCart();


    showMessage(
      "تم تسجيل الطلب بنجاح ✅ رقم الطلب: " +
      orderId
    );


    const orderInput =
      document.getElementById(
        "orderNumber"
      );


    if (orderInput) {

      orderInput.value =
        orderId;

    }


  }

  catch (error) {

    console.error(
      "Firebase Error:",
      error
    );


    if (
      error.code ===
      "permission-denied"
    ) {

      showMessage(
        "Firestore رفض الطلب ❌"
      );

    } else {

      showMessage(
        "حصل خطأ أثناء تسجيل الطلب ❌"
      );

    }

  }

}


// ================= الموقع =================

function setLocation() {

  const input =
    document.getElementById(
      "locationInput"
    );

  const msg =
    document.getElementById(
      "locationMsg"
    );


  if (!input) {
    return;
  }


  const location =
    input.value.trim();


  if (!location) {

    if (msg) {

      msg.textContent =
        "اكتب عنوان التوصيل أولًا.";

    }

    return;

  }


  localStorage.setItem(
    "deliveryLocation",
    location
  );


  if (msg) {

    msg.textContent =
      "تم حفظ عنوان التوصيل: " +
      location;

  }

}


// ================= تحميل الموقع =================

function loadSavedLocation() {

  const saved =
    localStorage.getItem(
      "deliveryLocation"
    );


  const input =
    document.getElementById(
      "locationInput"
    );


  if (
    saved &&
    input
  ) {

    input.value =
      saved;

  }

}


// ================= تتبع الطلب =================

async function trackOrder() {

  const input =
    document.getElementById(
      "orderNumber"
    );

  const msg =
    document.getElementById(
      "trackMsg"
    );


  if (!input || !msg) {
    return;
  }


  const number =
    input.value.trim();


  if (!number) {

    msg.textContent =
      "اكتب رقم الطلب.";

    return;

  }


  await waitForFirebase();


  if (!window.firebaseReady) {

    msg.textContent =
      "Firebase غير متصل.";

    return;

  }


  try {

    const orderRef =
      window.firebaseDoc(
        window.firebaseDB,
        "orders",
        number
      );


    const result =
      await window.firebaseGetDoc(
        orderRef
      );


    if (!result.exists()) {

      msg.textContent =
        "لم يتم العثور على الطلب.";

      return;

    }


    const order =
      result.data();


    msg.innerHTML = `

      <strong>
        حالة الطلب:
        ${order.status || "جديد"}
      </strong>

      <br>

      الإجمالي:
      ${order.total || 0} جنيه

    `;

  }

  catch (error) {

    console.error(
      "Track Error:",
      error
    );


    msg.textContent =
      "حدث خطأ أثناء تتبع الطلب.";

  }

}


// ================= الرسائل =================

function showMessage(text) {

  const old =
    document.getElementById(
      "cartMessage"
    );


  if (old) {
    old.remove();
  }


  const message =
    document.createElement(
      "div"
    );


  message.id =
    "cartMessage";


  message.textContent =
    text;


  message.style.position =
    "fixed";

  message.style.bottom =
    "25px";

  message.style.left =
    "50%";

  message.style.transform =
    "translateX(-50%)";

  message.style.background =
    "#00e0ff";

  message.style.color =
    "#00121d";

  message.style.padding =
    "13px 22px";

  message.style.borderRadius =
    "14px";

  message.style.fontWeight =
    "800";

  message.style.zIndex =
    "999999";

  message.style.boxShadow =
    "0 8px 30px rgba(0,0,0,.4)";


  document.body.appendChild(
    message
  );


  setTimeout(() => {

    if (message) {
      message.remove();
    }

  }, 3000);

}


// ================= تشغيل الموقع =================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateCartCount();

    loadSavedLocation();

    console.log(
      "موقع مندوب يعمل ✅"
    );

  }
);
