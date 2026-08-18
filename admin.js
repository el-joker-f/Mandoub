/* =====================================================
   MANDOUB - ADMIN.JS
   Firebase + Restaurants + Location + Rating
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
  serverTimestamp,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



/* ================= FIREBASE CONFIG ================= */

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
    "1:311140400335:web:db198b7c53259c53594bba"

};



/* ================= INIT ================= */

const app =
initializeApp(firebaseConfig);


const db =
getFirestore(app);



let restaurants = [];



/* ================= MESSAGE ================= */


function message(text){

 const box =
 document.getElementById("message");


 if(!box) return;


 box.innerHTML = text;

 box.style.display="block";


 setTimeout(()=>{

   box.style.display="none";

 },2500);

}




/* ================= NAVIGATION ================= */


window.showPage =
function(page,button){


 document
 .querySelectorAll(".page")
 .forEach(p=>{

   p.classList.remove("active");

 });


 const target =
 document.getElementById(page);


 if(target)
 target.classList.add("active");



 document
 .querySelectorAll(".menu button")
 .forEach(b=>{

   b.classList.remove("active");

 });


 if(button)
 button.classList.add("active");



 if(page==="restaurants")
 loadRestaurants();



 if(page==="products")
 loadRestaurants();



};





/* =====================================================
   RESTAURANTS
===================================================== */



window.getRestaurantLocation =
function(){


 if(!navigator.geolocation){

   message(
   "المتصفح لا يدعم تحديد الموقع"
   );

   return;

 }



 navigator.geolocation.getCurrentPosition(

 function(position){


   document.getElementById(
   "restaurantLat"
   ).value =
   position.coords.latitude;



   document.getElementById(
   "restaurantLng"
   ).value =
   position.coords.longitude;



   message(
   "تم تحديد موقع المطعم ✅"
   );


 },

 function(){

   message(
   "لم يتم السماح بالموقع ❌"
   );

 }

 );


};





window.addRestaurant =
async function(){



const name =
document
.getElementById("restaurantName")
.value
.trim();



const category =
document
.getElementById("restaurantCategory")
.value
.trim();



const image =
document
.getElementById("restaurantImage")
.value
.trim();



const description =
document
.getElementById("restaurantDescription")
.value
.trim();



const lat =
Number(
document
.getElementById("restaurantLat")
.value
);



const lng =
Number(
document
.getElementById("restaurantLng")
.value
);



if(!name){

 message(
 "اكتب اسم المطعم"
 );

 return;

}




await addDoc(

collection(
db,
"restaurants"
),

{


name,

category,

image,

description,


location:{

 lat,

 lng

},



/* تقييم العملاء */

ratingTotal:0,

ratingCount:0,

ratingAverage:0,



active:true,


createdAt:
serverTimestamp()


}



);



message(
"تم إضافة المطعم ✅"
);



loadRestaurants();


};
/* =====================================================
   LOAD RESTAURANTS
===================================================== */


async function loadRestaurants(){


const list =
document.getElementById(
"restaurantsList"
);



if(list){

list.innerHTML =
"جاري تحميل المطاعم...";

}



const snapshot =
await getDocs(
collection(
db,
"restaurants"
)
);



restaurants =
snapshot.docs.map(doc=>({

id:doc.id,
...doc.data()

}));



const count =
document.getElementById(
"restaurantsCount"
);


if(count){

count.innerHTML =
restaurants.length;

}




/* تحديث قائمة المطاعم للمنتجات */

const select =
document.getElementById(
"productRestaurant"
);



if(select){

select.innerHTML =

`
<option value="">
اختر المطعم
</option>

${
restaurants.map(r=>`

<option value="${r.id}">
${r.name}
</option>

`).join("")
}

`;

}




if(!list) return;



if(restaurants.length===0){

list.innerHTML =
"لا توجد مطاعم";

return;

}



list.innerHTML =

restaurants.map(r=>`


<div class="item">


<div class="item-info">


<strong>

${r.name}

</strong>


<small>

${r.category || ""}

<br>

📍

${
r.location?.lat || "-"
}

,

${
r.location?.lng || "-"
}


<br>


⭐ التقييم:

${
r.ratingAverage || 0
}


</small>


</div>



<div class="item-actions">


<button

class="secondary"

onclick="openMap(
${r.location?.lat || 0},
${r.location?.lng || 0}
)"

>

الخريطة 📍

</button>



<button

class="danger"

onclick="deleteRestaurant('${r.id}')"

>

حذف

</button>


</div>



</div>


`).join("");



}





/* ================= MAP ================= */


window.openMap =
function(lat,lng){


if(!lat || !lng){

message(
"لا يوجد موقع للمطعم"
);

return;

}



window.open(

`https://maps.google.com/?q=${lat},${lng}`

);

};






/* ================= DELETE RESTAURANT ================= */


window.deleteRestaurant =
async function(id){



if(!confirm(
"حذف المطعم؟"
))

return;



await deleteDoc(

doc(
db,
"restaurants",
id
)

);



message(
"تم حذف المطعم"
);



loadRestaurants();


};






/* =====================================================
   PRODUCTS
===================================================== */


window.addProduct =
async function(){



const restaurantId =

document
.getElementById(
"productRestaurant"
)
.value;



const name =

document
.getElementById(
"productName"
)
.value
.trim();



const price =

Number(

document
.getElementById(
"productPrice"
)
.value

);



const image =

document
.getElementById(
"productImage"
)
.value
.trim();





if(!restaurantId || !name || !price){


message(
"أكمل بيانات المنتج"
);


return;


}





await addDoc(

collection(
db,
"products"
),

{


restaurantId,

name,

price,

image,


active:true,


createdAt:
serverTimestamp()


}


);




message(
"تم إضافة المنتج ✅"
);



};
/* =====================================================
   LOAD PRODUCTS
===================================================== */


async function loadProducts(){


const list =
document.getElementById(
"productsList"
);



const snapshot =
await getDocs(
collection(
db,
"products"
)
);



const count =
document.getElementById(
"productsCount"
);



if(count){

count.innerHTML =
snapshot.size;

}



if(!list)
return;



if(snapshot.empty){

list.innerHTML =
"لا توجد منتجات";

return;

}



list.innerHTML =

snapshot.docs.map(item=>{


const p =
item.data();



const restaurant =
restaurants.find(
r=>r.id===p.restaurantId
);



return `

<div class="item">


<div class="item-info">


<strong>

${p.name}

</strong>


<small>

المطعم:

${restaurant?.name || "غير معروف"}

<br>

السعر:

${p.price} جنيه


</small>


</div>



<button

class="danger"

onclick="deleteProduct('${item.id}')"

>

حذف

</button>



</div>

`;



}).join("");



}






window.deleteProduct =
async function(id){



await deleteDoc(

doc(
db,
"products",
id
)

);



message(
"تم حذف المنتج"
);



loadProducts();


};








/* =====================================================
   DELIVERY CALCULATION
===================================================== */



window.calculateDelivery =
function(distance){


distance =
Number(distance);



if(distance <= 2){

return 25;

}



if(distance <= 5){

return 30;

}



if(distance <= 7){

return 35;

}



if(distance <= 10){

return 45;

}



return 45;


};







/* =====================================================
   CUSTOMER RATING
===================================================== */



window.addRestaurantRating =
async function(
restaurantId,
rate
){



const ref =
doc(
db,
"restaurants",
restaurantId
);



const snap =
await getDoc(ref);



if(!snap.exists())
return;



const data =
snap.data();



const total =
(data.ratingTotal || 0)
+
Number(rate);



const count =
(data.ratingCount || 0)
+
1;



const average =
total / count;



await updateDoc(

ref,

{


ratingTotal:
total,


ratingCount:
count,


ratingAverage:
Number(
average.toFixed(1)
)


}

);



};







/* =====================================================
   OFFERS
===================================================== */


window.addOffer =
async function(){



const title =

document
.getElementById(
"offerTitle"
)
.value
.trim();



if(!title){

message(
"اكتب اسم العرض"
);

return;

}



await addDoc(

collection(
db,
"offers"
),

{


title,


discount:
document.getElementById(
"offerDiscount"
).value,


image:
document.getElementById(
"offerImage"
).value,


active:true,


createdAt:
serverTimestamp()


}

);



message(
"تم إضافة العرض"
);


};

/* =====================================================
   DRIVERS
===================================================== */


window.addDriver =
async function(){


const name =
document.getElementById(
"driverName"
).value.trim();


const phone =
document.getElementById(
"driverPhone"
).value.trim();



if(!name || !phone){

message(
"اكتب بيانات الطيار"
);

return;

}



await addDoc(

collection(
db,
"drivers"
),

{

name,

phone,


status:"متاح",


active:true,


createdAt:
serverTimestamp()


}

);



message(
"تم إضافة الطيار 🛵"
);


loadDrivers();


};





async function loadDrivers(){


const list =
document.getElementById(
"driversList"
);



if(!list)
return;



const snapshot =
await getDocs(
collection(
db,
"drivers"
)
);



list.innerHTML =


snapshot.docs.map(d=>{


const x=d.data();


return `

<div class="item">


<div>

<strong>
${x.name}
</strong>

<br>

<small>

${x.phone}

-

${x.status}

</small>


</div>


<button

class="danger"

onclick="deleteDriver('${d.id}')"

>

حذف

</button>


</div>

`;


}).join("");



}





window.deleteDriver =
async function(id){


await deleteDoc(

doc(
db,
"drivers",
id
)

);


message(
"تم حذف الطيار"
);


loadDrivers();


};







/* =====================================================
   ORDERS
===================================================== */


async function loadOrders(){


const table =
document.getElementById(
"ordersTable"
);



if(!table)
return;



const snapshot =
await getDocs(
collection(
db,
"orders"
)
);



table.innerHTML =


snapshot.docs.map(o=>{


const order =
o.data();



return `

<tr>


<td>

${o.id}

</td>



<td>

${order.customerName || "-"}

</td>



<td>

${order.total || 0}

جنيه

</td>



<td>

${order.status || "جديد"}

</td>


</tr>

`;


}).join("");



}







/* =====================================================
   SETTINGS
===================================================== */


window.saveSettings =
async function(){


await setDoc(

doc(
db,
"settings",
"site"
),

{


siteName:
document.getElementById(
"siteName"
).value,


phone:
document.getElementById(
"sitePhone"
).value,


deliverySystem:true,


updatedAt:
serverTimestamp()


},

{

merge:true

}


);



message(
"تم حفظ الإعدادات ✅"
);



};







/* =====================================================
   START ADMIN
===================================================== */


async function startAdmin(){


await loadRestaurants();


await loadProducts();


await loadDrivers();


await loadOrders();



const status =
document.getElementById(
"firebaseStatus"
);



if(status){

status.innerHTML =
"Firebase متصل ✅";

}



}



startAdmin();


