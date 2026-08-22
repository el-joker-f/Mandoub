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

  /* Menu UI: dark Mandoub design. */
  function installMenuUI(){
    if(!document.querySelector('.menu-main')||document.getElementById('mandoubMenuModernUI'))return;
    const style=document.createElement('style');
    style.id='mandoubMenuModernUI';
    style.textContent=`
      html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;background:#020d1b!important;color:#fff!important}
      body:has(.menu-main){background:#020d1b!important;color:#fff!important}
      .menu-main{width:100%!important;max-width:920px!important;margin:auto!important;background:#020d1b!important;color:#fff!important;box-shadow:none!important;padding-bottom:30px!important}
      .menu-top{height:66px!important;padding:9px 12px!important;background:#061a2d!important;border-bottom:1px solid #16415e!important;box-shadow:none!important}
      .menu-top a,.menu-top button{width:43px!important;height:43px!important;border:1px solid #16415e!important;background:#020d1b!important;color:#fff!important;box-shadow:none!important}
      .menu-top .logo{width:45px!important;height:45px!important;border-radius:13px!important;object-fit:contain!important}
      .restaurant-hero{background:#061a2d!important;border-bottom:1px solid #16415e!important}
      .hero-cover{height:155px!important;max-height:155px!important;position:relative!important;background:#031321!important;overflow:hidden!important}
      .hero-cover img{display:block!important;width:100%!important;height:155px!important;max-height:155px!important;object-fit:cover!important;background:#031321!important}
      .hero-info{padding:13px!important}.hero-info h1{font-size:24px!important;color:#fff!important;font-weight:950!important}.hero-info p{color:#91a4b3!important;font-size:13px!important}
      .meta{gap:6px!important}.meta span{background:#031321!important;border:1px solid #16415e!important;color:#d8e5ed!important;padding:6px 9px!important;font-size:12px!important}.meta .delivery{background:#061a2d!important;color:#00dfff!important}
      .location button{background:#00dfff!important;color:#061a2d!important}.restaurant-offer-link{background:#00dfff!important;color:#061a2d!important}
      .menu-pills{top:66px!important;padding:8px 10px!important;background:#061a2d!important;border-bottom:1px solid #16415e!important;box-shadow:none!important;overflow-x:auto!important}
      .menu-pill{background:#020d1b!important;border:1px solid #16415e!important;color:#d8e5ed!important;padding:8px 11px!important;font-size:13px!important}.menu-pill.active{background:#00dfff!important;color:#061a2d!important;border-color:#00dfff!important}
      .content-wrap{padding:0 10px!important}.section-title{font-size:22px!important;color:#fff!important;margin:17px 0 11px!important}

      /* Products: compact horizontal cards, fixed image side, never stretched. */
      .products{display:flex!important;flex-direction:column!important;gap:9px!important;width:100%!important;min-width:0!important}
      .product{position:relative!important;display:flex!important;flex-direction:row!important;direction:rtl!important;align-items:stretch!important;width:100%!important;height:124px!important;min-height:124px!important;max-height:124px!important;min-width:0!important;background:#061a2d!important;border:1px solid #16415e!important;border-radius:17px!important;box-shadow:0 5px 16px rgba(0,0,0,.24)!important;overflow:hidden!important;box-sizing:border-box!important}
      .product-image-wrap{position:relative!important;flex:0 0 116px!important;width:116px!important;min-width:116px!important;height:122px!important;max-height:122px!important;background:#031321!important;overflow:hidden!important}
      .product img{display:block!important;width:116px!important;height:122px!important;max-width:116px!important;max-height:122px!important;min-width:116px!important;object-fit:cover!important;background:#031321!important}
      .body{min-width:0!important;flex:1 1 auto!important;width:auto!important;height:100%!important;padding:10px 11px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;overflow:hidden!important;background:#061a2d!important}
      .body h2{font-size:17px!important;color:#fff!important;font-weight:900!important;margin:0 0 4px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.body p{color:#91a4b3!important;font-size:11px!important;height:31px!important;overflow:hidden!important;margin:0!important;line-height:1.45!important}.price{font-size:16px!important;color:#00dfff!important;font-weight:900!important;margin-top:5px!important}.old-price{color:#718697!important}.controls{margin-top:5px!important;gap:5px!important}.controls button{width:27px!important;height:27px!important}.plus{background:#00dfff!important;color:#061a2d!important}.minus{background:#031321!important;color:#d8e5ed!important;border:1px solid #16415e!important}.qty{color:#fff!important}
      .add{position:absolute!important;left:7px!important;right:auto!important;bottom:7px!important;width:36px!important;height:36px!important;border:2px solid #00dfff!important;border-radius:50%!important;background:#00dfff!important;color:#061a2d!important;font-size:24px!important;line-height:1!important;box-shadow:0 4px 12px rgba(0,223,255,.18)!important;z-index:3!important}
      .product-offer{top:7px!important;right:124px!important;background:#00dfff!important;color:#061a2d!important;border-radius:6px!important;padding:4px 6px!important;font-size:9px!important;font-weight:900!important;z-index:4!important}

      .offers-section{background:#031321!important;margin-top:18px!important;padding:14px 10px 18px!important;border-top:1px solid #16415e!important}.offers-row{gap:9px!important}.offer-card{flex-basis:205px!important;background:#061a2d!important;border:1px solid #16415e!important;box-shadow:0 4px 14px rgba(0,0,0,.2)!important}.offer-card img{height:110px!important}.offer-card strong{color:#fff!important}.offer-card small{color:#91a4b3!important}.offer-price{color:#00dfff!important}
      .empty{color:#91a4b3!important}

      /* Cart UI is shown only when there is at least one product. */
      .cart-bar,#cartButton,[data-open-cart]{display:none!important}

      @media(max-width:520px){
        .content-wrap{padding:0 8px!important}.hero-cover{height:145px!important;max-height:145px!important}.hero-cover img{height:145px!important;max-height:145px!important}
        .product{height:116px!important;min-height:116px!important;max-height:116px!important}.product-image-wrap{flex-basis:94px!important;width:94px!important;min-width:94px!important;height:114px!important}.product img{width:94px!important;height:114px!important;max-width:94px!important;max-height:114px!important;min-width:94px!important}.body{padding:8px 9px!important}.body h2{font-size:15px!important}.body p{font-size:10px!important;height:29px!important}.price{font-size:15px!important}.controls{margin-top:4px!important}.controls button{width:26px!important;height:26px!important}.add{width:34px!important;height:34px!important;left:6px!important;bottom:6px!important;font-size:22px!important}.product-offer{right:101px!important;top:6px!important;font-size:8px!important}
      }
      @media(max-width:380px){.product{height:108px!important;min-height:108px!important;max-height:108px!important}.product-image-wrap{flex-basis:84px!important;width:84px!important;min-width:84px!important;height:106px!important}.product img{width:84px!important;height:106px!important;max-width:84px!important;max-height:106px!important;min-width:84px!important}.body p{display:none!important}.body h2{font-size:14px!important}.product-offer{right:91px!important}}
      @media(min-width:700px){.product{height:145px!important;min-height:145px!important;max-height:145px!important}.product-image-wrap{flex-basis:135px!important;width:135px!important;height:143px!important}.product img{width:135px!important;height:143px!important;max-width:135px!important;max-height:143px!important;min-width:135px!important}.product-offer{right:143px!important}}
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMenuUI);else installMenuUI();
})();