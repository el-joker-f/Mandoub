let cart = 0;
function addToCart(){
  cart++;
  document.getElementById("cartCount").textContent = cart;
}
function setLocation(){
  const input = document.getElementById("locationInput");
  const msg = document.getElementById("locationMsg");
  if(!input.value.trim()){
    msg.textContent = "اكتب عنوان التوصيل أولاً.";
    return;
  }
  msg.textContent = "تم حفظ عنوان التوصيل: " + input.value;
}
function trackOrder(){
  const n = document.getElementById("orderNumber").value.trim();
  document.getElementById("trackMsg").textContent =
    n ? "تم استلام رقم الطلب " + n + " — نظام التتبع سيتم ربطه بقاعدة البيانات في الخطوة القادمة." : "اكتب رقم الطلب.";
}
