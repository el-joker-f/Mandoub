/* =====================================================
   MANDOUB - SCRIPT.JS
   السلة + الموقع + المطاعم من Firebase + الطلبات
===================================================== */


let cart = [];

let selectedLocation = "";

let firebaseReady = false;


/* =====================================================
   FIREBASE WAIT
===================================================== */

function waitForFirebase() {

  return new Promise((resolve) => {

    if (window.firebaseReady === true) {

      firebaseReady = true;

      resolve(true);

      return;
    }


    let tries = 0;


    const timer =
      setInterval(() => {

        tries++;


        if (window.firebaseReady === true) {

          clearInterval(timer);

          firebaseReady = true;

          resolve(true);

          return;
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

  const old =
    document.getElementById(
      "siteMessage"
    );


  if (old) {

    old.remove();

  }


  const box =
    document.createElement(
      "div"
    );


  box.id =
    "siteMessage";


  box.textContent =
    message;


  box.style.position =
    "fixed";

  box.style.left =
    "50%";

  box.style.bottom =
    "25px";

  box.style.transform =
    "translateX(-50%)";

  box.style.zIndex =
    "999999";

  box.style.width =
    "calc(100% - 30px)";

  box.style.maxWidth =
    "430px";

  box.style.padding =
    "15px 18px";

  box.style.borderRadius =
    "15px";

  box.style.background =
    "#00dfff";

  box.style.color =
    "#00121d";

  box.style.fontWeight =
    "900";

  box.style.textAlign =
    "center";

  box.style.boxShadow =
    "0 10px 35px rgba(0,0,0,.35)";


  document.body.appendChild(
    box
  );


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


  if (!input || !message) {

    return;

  }


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

          input.value =
            data.display_name;


          selectedLocation =
            data.display_name;


          localStorage.setItem(
            "mandoub_location",
            selectedLocation
          );

        }

      } catch(error) {

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

function loadSavedLocation() {

  const saved =
    localStorage.getItem(
      "mandoub_location"
    );


  if (!saved) {

    return;

  }


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


/* =====================================================
   GET RESTAURANTS FROM FIREBASE
===================================================== */

async function loadRestaurants() {

  const container =
    document.getElementById(
      "restaurantsContainer"
    );


  if (!container) {

    return;

  }


  container.innerHTML = `

    <div class="restaurants-message">

      ⏳ جاري تحميل المطاعم...

    </div>

  `;


  const ready =
    await waitForFirebase();


  if (!ready) {

    container.innerHTML = `

      <div class="restaurants-message">

        ❌ Firebase غير متصل

      </div>

    `;

    return;

  }


  try {

    const {
      collection,
      getDocs
    } = await import(
      "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"
    );


    /*
      اسم المجموعة:
      restaurants

      صفحة الأدمن تضيف المطاعم داخلها.
    */

    const restaurantsRef =
      collection(
        window.firebaseDB,
        "restaurants"
      );


    const snapshot =
      await getDocs(
        restaurantsRef
      );


    if (snapshot.empty) {

      container.innerHTML = `

        <div class="restaurants-message">

          🍽️ لا توجد مطاعم حاليًا

          <br>

          <small>
            سيتم عرض المطاعم هنا عند إضافتها من صفحة الأدمن.
          </small>

        </div>

      `;

      return;

    }


    container.innerHTML = "";


    let count = 0;


    snapshot.forEach(
      (docSnapshot) => {

        const restaurant =
          docSnapshot.data();


        /*
          دعم أكثر من اسم للحقل
          عشان نقدر نتعامل مع بيانات الأدمن
        */

        const name =
          restaurant.name ||
          restaurant.title ||
          restaurant.restaurantName ||
          "مطعم";


        const category =
          restaurant.category ||
          restaurant.type ||
          "مطاعم";


        const price =
          Number(
            restaurant.price ||
            restaurant.deliveryPrice ||
            0
          );


        const rating =
          restaurant.rating ||
          "جديد";


        const image =
          restaurant.image ||
          restaurant.imageUrl ||
          restaurant.photo ||
          "";


        const id =
          docSnapshot.id;


        const card =
          document.createElement(
            "article"
          );


        card.className =
          "restaurant";


        const imageHTML =
          image

          ? `

            <div
              class="food"
              style="
                padding:0;
                overflow:hidden;
              ">

              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                  display:block;
                "
                onerror="
                  this.parentElement.innerHTML='🍽️';
                  this.parentElement.style.fontSize='65px';
                "
              >

            </div>

          `

          : `

            <div class="food">
              🍽️
            </div>

          `;


        card.innerHTML = `

          ${imageHTML}

          <div class="card-body">

            <h3>
              ${escapeHTML(name)}
            </h3>


            <p>
              ${escapeHTML(category)}
            </p>


            <div class="restaurant-info">

              <span>
                ⭐ ${escapeHTML(rating)}
              </span>

              <span>
                ${
                  price > 0
                    ? `توصيل من ${price}ج`
                    : "التوصيل حسب الطلب"
                }
              </span>

            </div>


            <button
              type="button"
              onclick="addRestaurantToCart(
                '${escapeJS(name)}',
                ${price},
                '${escapeJS(id)}'
              )">

              اطلب الآن

            </button>

          </div>

        `;


        container.appendChild(
          card
        );


        count++;

      }
    );


    if (count === 0) {

      container.innerHTML = `

        <div class="restaurants-message">

          🍽️ لا توجد مطاعم حاليًا

        </div>

      `;

    }

  }

  catch(error) {

    console.error(
      "LOAD RESTAURANTS ERROR:",
      error
    );


    container.innerHTML = `

      <div class="restaurants-message">

        ❌ تعذر تحميل المطاعم

        <br>

        <small>
          حاول تحديث الصفحة.
        </small>

      </div>

    `;

  }

}


/* =====================================================
   ADD RESTAURANT TO CART
===================================================== */

function addRestaurantToCart(
  name,
  price,
  restaurantId
) {

  const existing =
    cart.find(
      item =>
        item.name === name &&
        item.restaurantId === restaurantId
    );


  if (existing) {

    existing.quantity++;

  }

  else {

    cart.push({

      name:
        name,

      price:
        Number(price) || 0,

      quantity:
        1,

      restaurantId:
        restaurantId

    });

  }


  updateCartCount();


  showMessage(
    `✅ تم إضافة ${name} إلى السلة`
  );


  openCart();

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(
  name,
  price
) {

  addRestaurantToCart(
    name,
    price,
    ""
  );

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
        (
          item.price *
          item.quantity
        );

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
    document.createElement(
      "div"
    );


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
        id="cartMessage">
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


  container.innerHTML =
    "";


  cart.forEach(
    (item,index) => {

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
              border-radius:8px;
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
              color:#fff;
              padding:7px 10px;
              border-radius:8px;
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

    cart.splice(
      index,
      1
    );

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


  cart.splice(
    index,
    1
  );


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

    if (message) {

      message.textContent =
        "❌ السلة فارغة";

    }

    return;

  }


  if (!selectedLocation) {

    if (message) {

      message.textContent =
        "📍 حدد موقع التوصيل أولاً";

    }


    closeCart();


    const locationInput =
      document.getElementById(
        "locationInput"
      );


    if (locationInput) {

      locationInput.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });


      locationInput.focus();

    }


    return;

  }


  if (message) {

    message.textContent =
      "⏳ جاري إرسال الطلب...";

  }


  const ready =
    await waitForFirebase();


  if (!ready) {

    if (message) {

      message.textContent =
        "❌ Firebase غير متصل";

    }

    return;

  }


  try {

    const orderData = {

      items:
        cart.map(
          item => ({

            name:
              item.name,

            price:
              item.price,

            quantity:
              item.quantity,

            restaurantId:
              item.restaurantId || ""

          })
        ),


      total:
        getCartTotal(),


      location:
        selectedLocation,


      status:
        "جديد",


      createdAt:
        new Date()

    };


    const {
      collection,
      addDoc,
      serverTimestamp
    } = await import(
      "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"
    );


    orderData.createdAt =
      serverTimestamp();


    const orders =
      collection(
        window.firebaseDB,
        "orders"
      );


    const result =
      await addDoc(
        orders,
        orderData
      );


    localStorage.setItem(
      "lastOrderId",
      result.id
    );


    if (message) {

      message.textContent =
        "✅ تم إرسال طلبك بنجاح";

    }


    showMessage(
      "✅ تم إرسال الطلب بنجاح — رقم الطلب: " +
      result.id
    );


    const orderNumber =
      document.getElementById(
        "orderNumber"
      );


    if (orderNumber) {

      orderNumber.value =
        result.id;

    }


    cart = [];


    updateCartCount();


    renderCart();


    setTimeout(
      () => {

        closeCart();

      },
      1800
    );

  }


  catch(error) {

    console.error(
      "ORDER ERROR:",
      error
    );


    if (message) {

      message.textContent =
        "❌ حصل خطأ أثناء إرسال الطلب";

    }

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


  message.textContent =
    "🔎 جاري البحث عن الطلب...";


  const ready =
    await waitForFirebase();


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


    message.innerHTML = `

      📦 حالة الطلب:
      <strong>
        ${escapeHTML(
          data.status || "جديد"
        )}
      </strong>

      <br>

      💰 الإجمالي:
      <strong>
        ${Number(data.total || 0)} جنيه
      </strong>

    `;

  }

  catch(error) {

    console.error(
      "TRACK ERROR:",
      error
    );


    message.textContent =
      "❌ تعذر البحث عن الطلب";

  }

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
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(value)

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
   ESCAPE JAVASCRIPT
===================================================== */

function escapeJS(value) {

  return String(value)

    .replaceAll(
      "\\",
      "\\\\"
    )

    .replaceAll(
      "'",
      "\\'"
    )

    .replaceAll(
      "\n",
      "\\n"
    )

    .replaceAll(
      "\r",
      "\\r"
    );

}


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.addToCart =
  addToCart;


window.addRestaurantToCart =
  addRestaurantToCart;


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

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    loadSavedLocation();

    updateCartCount();

    await loadRestaurants();

  }
);


console.log(
  "Mandoub Script Loaded ✅"
);
