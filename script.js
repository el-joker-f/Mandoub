// =====================================================
// مندوب - script.js
// =====================================================


// ================= السلة =================

let cart = [];


// ================= إضافة للسلة =================

function addToCart(productName, price) {

  cart.push({

    name: productName,

    price: Number(price)

  });


  updateCartCount();


  showMessage(
    "تمت إضافة " +
    productName +
    " إلى السلة 🛒"
  );

}


// ================= تحديث السلة =================

function updateCartCount() {

  const cartCount =
    document.getElementById(
      "cartCount"
    );


  if (cartCount) {

    cartCount.textContent =
      cart.length;

  }

}


// ================= فتح السلة =================

function openCart() {

  const oldModal =
    document.getElementById(
      "cartModal"
    );


  if (oldModal) {

    oldModal.remove();

  }


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "cartModal";


  let itemsHTML = "";


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
          أضف منتجًا من المطاعم أولًا.
        </p>

      </div>

    `;

  }

  else {

    cart.forEach(
      function(item, index) {

        itemsHTML += `

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

      }
    );

  }


  const total =
    cart.reduce(
      function(sum, item) {

        return sum +
          Number(item.price);

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


  document.body.appendChild(
    modal
  );

}


// ================= إغلاق السلة =================

function closeCart() {

  const modal =
    document.getElementById(
      "cartModal"
    );


  if (modal) {

    modal.remove();

  }

}


// ================= حذف =================

function removeFromCart(index) {

  cart.splice(
    index,
    1
  );


  updateCartCount();

  openCart();

}


// ================= إتمام الطلب =================

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

    return;

  }


  // ================= Firebase =================

  if (
    window.firebaseReady &&
    window.firebaseDB &&
    window.firebaseCollection &&
    window.firebaseAddDoc
  ) {

    try {

      const total =
        cart.reduce(
          function(sum, item) {

            return sum +
              Number(item.price);

          },
          0
        );


      const order = {

        items:
          cart.map(
            function(item) {

              return {

                name:
                  item.name,

                price:
                  Number(item.price)

              };

            }
          ),


        total:
          total,


        location:
          location,


        status:
          "جديد",


        createdAt:
          window.firebaseServerTimestamp()

      };


      const ordersCollection =
        window.firebaseCollection(
          window.firebaseDB,
          "orders"
        );


      const docRef =
        await window.firebaseAddDoc(
          ordersCollection,
          order
        );


      const orderId =
        docRef.id;


      localStorage.setItem(
        "lastOrderId",
        orderId
      );


      localStorage.setItem(
        "lastOrder",
        JSON.stringify({
          id: orderId,
          ...order
        })
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


    }

    catch (error) {

      console.error(
        "Firebase Error:",
        error
      );


      showMessage(
        "Firebase رفض تسجيل الطلب ❌"
      );

    }


    return;

  }


  // ================= Firebase غير متصل =================

  showMessage(
    "Firebase غير متصل ❌"
  );

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


  if (
    window.firebaseReady &&
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


      if (
        snapshot.exists()
      ) {

        const order =
          snapshot.data();


        msg.innerHTML = `

          <strong>
            حالة الطلب:
            ${order.status || "جديد"}
          </strong>

          <br>

          الإجمالي:
          ${order.total || 0}
          جنيه

        `;


        return;

      }


    }

    catch (error) {

      console.error(
        "Track Error:",
        error
      );

    }

  }


  msg.textContent =
    "لم يتم العثور على الطلب.";

}


// ================= رسالة =================

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


  setTimeout(
    function() {

      if (message) {

        message.remove();

      }

    },
    3000
  );

}


// ================= التشغيل =================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    updateCartCount();

    loadSavedLocation();

    console.log(
      "مندوب يعمل ✅"
    );

    console.log(
      "Firebase:",
      window.firebaseReady
        ?
        "متصل ✅"
        :
        "غير متصل ❌"
    );

  }
);
