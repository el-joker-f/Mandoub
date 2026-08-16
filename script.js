// ================= السلة =================

let cart = [];


// ================= إضافة منتج للسلة =================

function addToCart(productName, price) {

  const product = {
    name: productName,
    price: price
  };

  cart.push(product);

  updateCartCount();

  showMessage("تمت إضافة " + productName + " إلى السلة 🛒");
}


// ================= تحديث رقم السلة =================

function updateCartCount() {

  const cartCount =
    document.getElementById("cartCount");

  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}


// ================= فتح السلة =================

function openCart() {

  const oldCart =
    document.getElementById("cartModal");

  if (oldCart) {
    oldCart.remove();
  }


  const modal =
    document.createElement("div");

  modal.id = "cartModal";


  let itemsHTML = "";


  if (cart.length === 0) {

    itemsHTML = `
      <div class="empty-cart">
        🛒
        <h3>السلة فارغة</h3>
        <p>لم تقم بإضافة أي طلب حتى الآن.</p>
      </div>
    `;

  } else {

    cart.forEach((item, index) => {

      itemsHTML += `
        <div class="cart-item">

          <div>
            <strong>${item.name}</strong>
            <p>${item.price} جنيه</p>
          </div>

          <button
            type="button"
            onclick="removeFromCart(${index})"
          >
            حذف
          </button>

        </div>
      `;

    });

  }


  const total =
    cart.reduce(
      (sum, item) => sum + item.price,
      0
    );


  modal.innerHTML = `

    <div
      class="cart-overlay"
      onclick="closeCart()"
    ></div>

    <div class="cart-box">

      <div class="cart-header">

        <h2>🛒 سلة الطلبات</h2>

        <button
          type="button"
          onclick="closeCart()"
        >
          ✕
        </button>

      </div>


      <div class="cart-items">

        ${itemsHTML}

      </div>


      ${
        cart.length > 0
        ? `
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
            onclick="checkout()"
          >
            إتمام الطلب
          </button>
        `
        : ""
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


// ================= حذف منتج =================

function removeFromCart(index) {

  cart.splice(index, 1);

  updateCartCount();

  openCart();

}


// ================= إتمام الطلب =================

async function checkout() {

  // التأكد أن السلة ليست فارغة

  if (cart.length === 0) {

    showMessage("السلة فارغة.");

    return;

  }


  // التأكد أن Firebase متصل

  if (
    !window.firebaseDB ||
    !window.firebaseCollection ||
    !window.firebaseAddDoc ||
    !window.firebaseServerTimestamp
  ) {

    showMessage(
      "Firebase لم يتم الاتصال به بعد ❌"
    );

    console.error(
      "Firebase غير متاح."
    );

    return;

  }


  // الحصول على عنوان التوصيل

  const locationInput =
    document.getElementById("locationInput");


  const location =
    locationInput
      ? locationInput.value.trim()
      : "";


  if (!location) {

    showMessage(
      "اكتب عنوان التوصيل أولاً 📍"
    );

    if (locationInput) {
      locationInput.focus();
    }

    return;

  }


  // حساب إجمالي الطلب

  const total =
    cart.reduce(
      (sum, item) => sum + item.price,
      0
    );


  try {

    // إنشاء الطلب

    const order = {

      items: cart.map(item => ({
        name: item.name,
        price: item.price
      })),

      total: total,

      location: location,

      status: "جديد",

      createdAt:
        window.firebaseServerTimestamp()

    };


    // حفظ الطلب في Firestore

    const docRef =
      await window.firebaseAddDoc(

        window.firebaseCollection(
          window.firebaseDB,
          "orders"
        ),

        order

      );


    // رقم الطلب

    const orderId =
      docRef.id;


    // حفظ رقم الطلب في المتصفح
    // عشان نقدر نستخدمه في التتبع

    localStorage.setItem(
      "lastOrderId",
      orderId
    );


    // رسالة نجاح

    showMessage(
      "تم تسجيل الطلب بنجاح ✅ رقم الطلب: " +
      orderId
    );


    // تفريغ السلة

    cart = [];

    updateCartCount();


    // إغلاق السلة

    setTimeout(() => {

      closeCart();

    }, 2000);


    // وضع رقم الطلب تلقائيًا في خانة التتبع

    const orderNumber =
      document.getElementById("orderNumber");

    if (orderNumber) {
      orderNumber.value = orderId;
    }


  } catch (error) {

    console.error(
      "Firebase Error:",
      error
    );


    // في حالة وجود مشكلة في صلاحيات Firestore

    if (
      error.code ===
      "permission-denied"
    ) {

      showMessage(
        "Firestore رفض حفظ الطلب ❌"
      );

    } else {

      showMessage(
        "حصل خطأ أثناء تسجيل الطلب ❌"
      );

    }

  }

}


// ================= رسالة =================

function showMessage(text) {

  const oldMessage =
    document.getElementById("cartMessage");

  if (oldMessage) {
    oldMessage.remove();
  }


  const message =
    document.createElement("div");

  message.id = "cartMessage";

  message.textContent = text;


  message.style.position = "fixed";

  message.style.bottom = "25px";

  message.style.left = "50%";

  message.style.transform =
    "translateX(-50%)";

  message.style.background =
    "#00e0ff";

  message.style.color =
    "#00121d";

  message.style.padding =
    "12px 22px";

  message.style.borderRadius =
    "12px";

  message.style.fontWeight =
    "800";

  message.style.zIndex =
    "99999";

  message.style.boxShadow =
    "0 8px 25px rgba(0,0,0,.3)";


  document.body.appendChild(message);


  setTimeout(() => {

    if (message) {
      message.remove();
    }

  }, 3000);

}


// ================= الموقع =================

function setLocation() {

  const input =
    document.getElementById("locationInput");

  const msg =
    document.getElementById("locationMsg");


  if (!input.value.trim()) {

    msg.textContent =
      "اكتب عنوان التوصيل أولاً.";

    return;

  }


  const location =
    input.value.trim();


  // حفظ العنوان في المتصفح

  localStorage.setItem(
    "deliveryLocation",
    location
  );


  msg.textContent =
    "تم حفظ عنوان التوصيل: " +
    location;

}


// ================= تحميل العنوان المحفوظ =================

function loadSavedLocation() {

  const savedLocation =
    localStorage.getItem(
      "deliveryLocation"
    );


  const input =
    document.getElementById(
      "locationInput"
    );


  if (
    savedLocation &&
    input
  ) {

    input.value =
      savedLocation;

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


  const number =
    input.value.trim();


  if (!number) {

    msg.textContent =
      "اكتب رقم الطلب.";

    return;

  }


  // التأكد أن Firebase متصل

  if (
    !window.firebaseDB ||
    !window.firebaseCollection
  ) {

    msg.textContent =
      "Firebase غير متصل.";

    return;

  }


  try {

    // استيراد دوال Firestore

    const {
      doc,
      getDoc
    } =
      await import(
        "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"
      );


    // البحث عن الطلب

    const orderRef =
      doc(
        window.firebaseDB,
        "orders",
        number
      );


    const orderSnapshot =
      await getDoc(orderRef);


    if (!orderSnapshot.exists()) {

      msg.textContent =
        "لم يتم العثور على الطلب.";

      return;

    }


    const order =
      orderSnapshot.data();


    msg.innerHTML = `
      <strong>
        حالة الطلب:
        ${order.status || "جديد"}
      </strong>
      <br>
      الإجمالي:
      ${order.total || 0} جنيه
    `;


  } catch (error) {

    console.error(
      "Track Error:",
      error
    );


    msg.textContent =
      "حدث خطأ أثناء تتبع الطلب.";

  }

}


// ================= زر السلة =================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const cartButton =
      document.querySelector(
        ".cart"
      );


    if (cartButton) {

      cartButton.addEventListener(
        "click",
        openCart
      );

    }


    // تحميل العنوان المحفوظ

    loadSavedLocation();


    // تحديث السلة

    updateCartCount();

  }
);
