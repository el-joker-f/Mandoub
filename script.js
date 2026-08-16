// =====================================================
// مندوب
// نظام السلة + الطلبات + العنوان + التتبع
// =====================================================


// =====================================================
// السلة
// =====================================================

let cart = [];


// =====================================================
// إضافة منتج للسلة
// =====================================================

function addToCart(productName, price) {

  cart.push({
    name: productName,
    price: Number(price)
  });

  updateCartCount();

  showMessage(
    "تمت إضافة " + productName + " إلى السلة 🛒"
  );
}


// =====================================================
// تحديث رقم السلة
// =====================================================

function updateCartCount() {

  const cartCount =
    document.getElementById("cartCount");

  if (cartCount) {

    cartCount.textContent =
      cart.length;

  }
}


// =====================================================
// فتح السلة
// =====================================================

function openCart() {

  console.log("تم الضغط على السلة");

  const oldModal =
    document.getElementById("cartModal");

  if (oldModal) {
    oldModal.remove();
  }


  const modal =
    document.createElement("div");

  modal.id = "cartModal";


  let itemsHTML = "";


  // السلة فارغة

  if (cart.length === 0) {

    itemsHTML = `

      <div class="empty-cart">

        <div style="font-size:50px;">
          🛒
        </div>

        <h3>
          السلة فارغة
        </h3>

        <p>
          لم تقم بإضافة أي طلب حتى الآن.
        </p>

      </div>

    `;

  }


  // السلة فيها منتجات

  else {

    cart.forEach(function(item, index) {

      itemsHTML += `

        <div class="cart-item">

          <div>

            <strong>
              ${escapeHTML(item.name)}
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


  // حساب الإجمالي

  const total =
    cart.reduce(
      function(sum, item) {

        return sum + Number(item.price);

      },
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

        ${itemsHTML}

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


// =====================================================
// إغلاق السلة
// =====================================================

function closeCart() {

  const modal =
    document.getElementById("cartModal");

  if (modal) {

    modal.remove();

  }

}


// =====================================================
// حذف منتج
// =====================================================

function removeFromCart(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) {

    return;

  }


  cart.splice(index, 1);

  updateCartCount();

  openCart();

}


// =====================================================
// إتمام الطلب
// =====================================================

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
      "اكتب عنوان التوصيل أولاً 📍"
    );

    if (locationInput) {

      locationInput.focus();

    }

    return;

  }


  // ===================================================
  // لو Firebase موجود نحفظ الطلب فيه
  // ===================================================

  if (
    window.firebaseDB &&
    window.firebaseCollection &&
    window.firebaseAddDoc
  ) {

    try {

      const total =
        cart.reduce(
          function(sum, item) {

            return sum + Number(item.price);

          },
          0
        );


      const order = {

        items:
          cart.map(function(item) {

            return {

              name: item.name,

              price: Number(item.price)

            };

          }),


        total: total,

        location: location,

        status: "جديد",


        createdAt:
          window.firebaseServerTimestamp
          ?
          window.firebaseServerTimestamp()
          :
          new Date().toISOString()

      };


      const collection =
        window.firebaseCollection(
          window.firebaseDB,
          "orders"
        );


      const docRef =
        await window.firebaseAddDoc(
          collection,
          order
        );


      const orderId =
        docRef.id;


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


      const orderNumber =
        document.getElementById(
          "orderNumber"
        );


      if (orderNumber) {

        orderNumber.value =
          orderId;

      }


      return;

    }


    catch (error) {

      console.error(
        "Firebase Error:",
        error
      );


      showMessage(
        "حدث خطأ في Firebase ❌"
      );

      return;

    }

  }


  // ===================================================
  // لو Firebase مش متصل
  // نحفظ الطلب مؤقتًا على الجهاز
  // ===================================================

  const localOrderId =
    "ORD-" +
    Date.now();


  const total =
    cart.reduce(
      function(sum, item) {

        return sum + Number(item.price);

      },
      0
    );


  const localOrder = {

    id: localOrderId,

    items: cart,

    total: total,

    location: location,

    status: "جديد",

    createdAt:
      new Date().toISOString()

  };


  localStorage.setItem(
    "lastOrder",
    JSON.stringify(localOrder)
  );


  localStorage.setItem(
    "lastOrderId",
    localOrderId
  );


  cart = [];

  updateCartCount();

  closeCart();


  showMessage(
    "تم حفظ الطلب مؤقتًا ✅ رقم الطلب: " +
    localOrderId
  );


  const orderNumber =
    document.getElementById(
      "orderNumber"
    );


  if (orderNumber) {

    orderNumber.value =
      localOrderId;

  }

}


// =====================================================
// تحديد الموقع
// =====================================================

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
        "اكتب عنوان التوصيل أولاً.";

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


// =====================================================
// تحميل العنوان
// =====================================================

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


// =====================================================
// تتبع الطلب
// =====================================================

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


  // ===================================================
  // البحث في Firebase
  // ===================================================

  if (
    window.firebaseDB
  ) {

    try {

      const firestore =
        await import(
          "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"
        );


      const orderRef =
        firestore.doc(
          window.firebaseDB,
          "orders",
          number
        );


      const snapshot =
        await firestore.getDoc(
          orderRef
        );


      if (snapshot.exists()) {

        const order =
          snapshot.data();


        msg.innerHTML = `

          <strong>
            حالة الطلب:
            ${escapeHTML(
              order.status || "جديد"
            )}
          </strong>

          <br>

          الإجمالي:
          ${Number(order.total || 0)}
          جنيه

        `;

        return;

      }

    }

    catch (error) {

      console.error(
        "Track Firebase Error:",
        error
      );

    }

  }


  // ===================================================
  // البحث في الطلب المحلي
  // ===================================================

  const savedOrder =
    localStorage.getItem(
      "lastOrder"
    );


  const savedOrderId =
    localStorage.getItem(
      "lastOrderId"
    );


  if (
    savedOrder &&
    savedOrderId === number
  ) {

    const order =
      JSON.parse(savedOrder);


    msg.innerHTML = `

      <strong>
        حالة الطلب:
        ${escapeHTML(
          order.status || "جديد"
        )}
      </strong>

      <br>

      الإجمالي:
      ${Number(order.total || 0)}
      جنيه

    `;

    return;

  }


  msg.textContent =
    "لم يتم العثور على الطلب.";

}


// =====================================================
// الرسائل
// =====================================================

function showMessage(text) {

  const oldMessage =
    document.getElementById(
      "cartMessage"
    );


  if (oldMessage) {

    oldMessage.remove();

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

  message.style.maxWidth =
    "90%";

  message.style.textAlign =
    "center";


  document.body.appendChild(
    message
  );


  setTimeout(
    function() {

      if (message) {

        message.remove();

      }

    },
    3000
  );

}


// =====================================================
// حماية النصوص
// =====================================================

function escapeHTML(text) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(text);


  return div.innerHTML;

}


// =====================================================
// تشغيل الموقع
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "مندوب: JavaScript يعمل بنجاح ✅"
    );


    updateCartCount();

    loadSavedLocation();


    // تأكيد ربط زر السلة

    const cartButton =
      document.getElementById(
        "cartButton"
      );


    if (cartButton) {

      cartButton.onclick =
        function(event) {

          event.preventDefault();

          openCart();

        };

    }

  }
);
