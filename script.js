// ================= السلة =================

let cart = [];


// إضافة منتج للسلة
function addToCart(productName, price) {

  const product = {
    name: productName,
    price: price
  };

  cart.push(product);

  updateCartCount();

  showMessage("تمت إضافة " + productName + " إلى السلة 🛒");
}


// تحديث رقم السلة
function updateCartCount() {

  const cartCount =
    document.getElementById("cartCount");

  cartCount.textContent = cart.length;
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

    <div class="cart-overlay" onclick="closeCart()"></div>

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

function checkout() {

  if (cart.length === 0) {

    showMessage("السلة فارغة.");

    return;

  }

  showMessage(
    "تم تجهيز طلبك بنجاح ✅"
  );

  cart = [];

  updateCartCount();

  setTimeout(() => {

    closeCart();

  }, 1200);

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
  message.style.transform = "translateX(-50%)";
  message.style.background = "#00e0ff";
  message.style.color = "#00121d";
  message.style.padding = "12px 22px";
  message.style.borderRadius = "12px";
  message.style.fontWeight = "800";
  message.style.zIndex = "99999";
  message.style.boxShadow =
    "0 8px 25px rgba(0,0,0,.3)";


  document.body.appendChild(message);


  setTimeout(() => {

    if (message) {
      message.remove();
    }

  }, 2000);

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


  msg.textContent =
    "تم حفظ عنوان التوصيل: " +
    input.value;

}


// ================= تتبع الطلب =================

function trackOrder() {

  const input =
    document.getElementById("orderNumber");

  const msg =
    document.getElementById("trackMsg");


  const number =
    input.value.trim();


  if (!number) {

    msg.textContent =
      "اكتب رقم الطلب.";

    return;

  }


  msg.textContent =
    "تم استلام رقم الطلب " +
    number +
    " — نظام التتبع سيتم ربطه بقاعدة البيانات لاحقًا.";

}


// ================= زر السلة =================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const cartButton =
      document.querySelector(".cart");

    if (cartButton) {

      cartButton.addEventListener(
        "click",
        openCart
      );

    }

  }
);
