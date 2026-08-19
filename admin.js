/* =====================================================
   PRODUCTS
   المسار الصحيح:
   restaurants
      └── restaurantId
           └── products
                └── productId
===================================================== */

window.addProduct =
async function() {

  if (!db) {

    message(
      "Firebase غير متصل ❌"
    );

    return;

  }


  /* ================================
     RESTAURANT
  ================================= */

  const restaurantId =
    document
      .getElementById(
        "productRestaurant"
      )
      ?.value;


  /* ================================
     PRODUCT DATA
  ================================= */

  const name =
    document
      .getElementById(
        "productName"
      )
      ?.value
      .trim();


  const priceValue =
    document
      .getElementById(
        "productPrice"
      )
      ?.value
      .trim();


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


  /* ================================
     VALIDATION
  ================================= */

  if (!restaurantId) {

    message(
      "اختر المطعم أولاً ❌"
    );

    return;

  }


  if (!name) {

    message(
      "اكتب اسم المنتج أولاً ❌"
    );

    return;

  }


  if (
    priceValue === "" ||
    !Number.isFinite(
      Number(priceValue)
    )
  ) {

    message(
      "اكتب سعرًا صحيحًا للمنتج ❌"
    );

    return;

  }


  const price =
    Number(priceValue);


  if (price < 0) {

    message(
      "السعر لا يمكن أن يكون سالبًا ❌"
    );

    return;

  }


  /* ================================
     ADD PRODUCT
  ================================= */

  try {

    /*
      مهم جدًا:

      المنتج أصبح داخل المطعم نفسه:

      restaurants/{restaurantId}/products
    */

    const productsRef =
      collection(
        db,
        "restaurants",
        restaurantId,
        "products"
      );


    await addDoc(
      productsRef,
      {

        name:
          name,

        description:
          description || "",

        price:
          price,

        image:
          image || "",

        active:
          true,

        createdAt:
          serverTimestamp()

      }
    );


    /* ==============================
       CLEAR FORM
    ============================== */

    const productName =
      document.getElementById(
        "productName"
      );

    const productPrice =
      document.getElementById(
        "productPrice"
      );

    const productImage =
      document.getElementById(
        "productImage"
      );

    const productDescription =
      document.getElementById(
        "productDescription"
      );


    if (productName) {

      productName.value = "";

    }


    if (productPrice) {

      productPrice.value = "";

    }


    if (productImage) {

      productImage.value = "";

    }


    if (productDescription) {

      productDescription.value = "";

    }


    message(
      "تم إضافة المنتج للمطعم بنجاح ✅"
    );


    /* ==============================
       RELOAD PRODUCTS
    ============================== */

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

    /* ==========================================
       لو مفيش مطاعم
    ========================================== */

    if (
      !restaurants ||
      restaurants.length === 0
    ) {

      await loadRestaurants();

    }


    /*
      هنا لا نستخدم:

      collection(db, "products")

      لأن المنتجات أصبحت Subcollection
      داخل كل مطعم.
    */


    const allProducts = [];


    /* ==========================================
       تحميل منتجات كل مطعم
    ========================================== */

    for (
      const restaurant of restaurants
    ) {

      try {

        const productsRef =
          collection(
            db,
            "restaurants",
            restaurant.id,
            "products"
          );


        const snapshot =
          await getDocs(
            productsRef
          );


        snapshot.forEach(
          productDoc => {

            allProducts.push({

              id:
                productDoc.id,

              restaurantId:
                restaurant.id,

              restaurantName:
                restaurant.name ||
                "مطعم غير معروف",

              ...productDoc.data()

            });

          }
        );


      } catch (restaurantError) {

        console.error(
          "Products Error for Restaurant:",
          restaurant.id,
          restaurantError
        );

      }

    }


    /* ==========================================
       COUNT
    ========================================== */

    const count =
      document.getElementById(
        "productsCount"
      );


    if (count) {

      count.textContent =
        allProducts.length;

    }


    if (!list) return;


    /* ==========================================
       EMPTY
    ========================================== */

    if (
      allProducts.length === 0
    ) {

      list.innerHTML = `

        <div style="color:#899aaa">

          لا توجد منتجات حتى الآن.

          <br>

          أضف أول منتج من لوحة التحكم.

        </div>

      `;

      return;

    }


    /* ==========================================
       DISPLAY
    ========================================== */

    list.innerHTML =
      allProducts
        .map(
          product => {

            const price =
              Number(
                product.price || 0
              );


            const active =
              product.active !== false;


            return `

              <div class="item">

                <div class="item-info">

                  <strong>

                    ${escapeHTML(
                      product.name ||
                      "منتج بدون اسم"
                    )}

                  </strong>


                  <small>

                    المطعم:

                    ${escapeHTML(
                      product.restaurantName ||
                      "مطعم غير معروف"
                    )}

                  </small>


                  <small>

                    السعر:

                    ${price}

                    جنيه

                  </small>


                  ${
                    product.description
                    ? `
                      <small>

                        ${escapeHTML(
                          product.description
                        )}

                      </small>
                    `
                    : ""
                  }


                  <small>

                    الحالة:

                    ${
                      active
                      ? "متاح ✅"
                      : "غير متاح ❌"
                    }

                  </small>

                </div>


                <div class="item-actions">

                  ${
                    product.image
                    ? `
                      <button
                        class="secondary"
                        type="button"
                        onclick="previewImage(
                          '${escapeHTML(
                            product.image
                          )}'
                        )">

                        الصورة

                      </button>
                    `
                    : ""
                  }


                  <button
                    class="danger"
                    type="button"
                    onclick="deleteProduct(
                      '${product.restaurantId}',
                      '${product.id}'
                    )">

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

  if (!db) {

    message(
      "Firebase غير متصل ❌"
    );

    return;

  }


  /* ==========================================
     VALIDATION
  ========================================== */

  if (
    !restaurantId ||
    !productId
  ) {

    message(
      "بيانات المنتج غير مكتملة ❌"
    );

    return;

  }


  /* ==========================================
     CONFIRM
  ========================================== */

  if (
    !confirm(
      "هل تريد حذف هذا المنتج نهائيًا؟"
    )
  ) {

    return;

  }


  try {

    /*
      الحذف من:

      restaurants/{restaurantId}/products/{productId}
    */

    const productRef =
      doc(
        db,
        "restaurants",
        restaurantId,
        "products",
        productId
      );


    await deleteDoc(
      productRef
    );


    message(
      "تم حذف المنتج ✅"
    );


    /* ========================================
       RELOAD
    ======================================== */

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
