/* MANDOUB - checkout bridge */
(function(){
  window.submitMandoubOrder=async function(){
    let cart=[];
    try{cart=JSON.parse(localStorage.getItem('mandoub_cart_v2')||'[]')}catch{}
    const msg=document.getElementById('restaurantCartMsg');
    if(!cart.length){if(msg)msg.textContent='❌ السلة فارغة';return}
    const coords=(()=>{try{return JSON.parse(localStorage.getItem('mandoub_location_coords')||'null')}catch{return null}})();
    if(!coords){if(msg)msg.textContent='📍 حدد موقعك أولاً';window.setMandoubLocation?.();return}
    localStorage.setItem('mandoub_checkout_draft',JSON.stringify({restaurantId:cart[0].restaurantId,restaurantName:cart[0].restaurantName,latitude:coords.lat,longitude:coords.lng,location:localStorage.getItem('mandoub_location')||''}));
    location.href='checkout.html';
  };
})();
