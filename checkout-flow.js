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

  /* Menu UI: loaded on restaurant-menu.html and harmless everywhere else. */
  function installMenuUI(){
    if(!document.querySelector('.menu-main')||document.getElementById('mandoubMenuModernUI'))return;
    const style=document.createElement('style');
    style.id='mandoubMenuModernUI';
    style.textContent=`
      body:has(.menu-main){background:#f7f8fa!important;color:#17202a!important}
      .menu-main{width:100%!important;max-width:920px!important;margin:auto!important;background:#fff!important;box-shadow:0 0 35px rgba(17,38,52,.06)!important}
      .menu-top{height:66px!important;padding:9px 12px!important;background:rgba(255,255,255,.96)!important;border-bottom:1px solid #e4eaee!important;box-shadow:0 2px 12px rgba(17,38,52,.05)!important}
      .menu-top a,.menu-top button{width:43px!important;height:43px!important;border:1px solid #dfe6ea!important;box-shadow:0 3px 10px rgba(17,38,52,.06)!important}
      .menu-top .logo{width:45px!important;height:45px!important;border-radius:13px!important}
      .restaurant-hero{background:#fff!important}
      .hero-cover{height:190px!important;position:relative!important}
      .hero-cover:after{content:'';position:absolute;inset:auto 0 0;height:70px;background:linear-gradient(transparent,rgba(0,0,0,.35));pointer-events:none}
      .hero-info{padding:15px 15px 12px!important}
      .hero-info h1{font-size:25px!important;color:#111b23!important;font-weight:950!important}
      .hero-info p{color:#6c7b85!important;font-size:13px!important}
      .meta{gap:6px!important}.meta span{background:#f2f6f8!important;border:1px solid #e5ebee!important;color:#53636d!important;padding:6px 9px!important}.meta .delivery{background:#e8fbff!important;color:#008ba6!important}
      .menu-pills{top:66px!important;padding:9px 12px!important;background:rgba(255,255,255,.97)!important;border-bottom:1px solid #e4eaee!important;box-shadow:0 2px 10px rgba(17,38,52,.04)!important}
      .menu-pill{background:#fff!important;border:1px solid transparent!important;border-radius:999px!important;color:#64747e!important;padding:8px 14px!important}
      .menu-pill.active{background:#00dfff!important;color:#00131e!important;border-color:#00dfff!important;box-shadow:0 4px 12px rgba(0,210,235,.2)!important}
      .content-wrap{padding:0 11px!important}.section-title{font-size:22px!important;color:#17202a!important;margin:18px 0 12px!important}
      .products{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:11px!important}
      .product{background:#fff!important;border:1px solid #e1e7eb!important;border-radius:18px!important;box-shadow:0 5px 18px rgba(17,38,52,.07)!important;overflow:hidden!important;transition:transform .15s ease,box-shadow .15s ease!important}
      .product:active{transform:scale(.985)!important}.product-image-wrap{height:auto!important;background:#f0f3f5!important}
      .product img{height:145px!important;width:100%!important;object-fit:cover!important;background:#eef2f4!important}
      .add{bottom:-16px!important;right:10px!important;width:46px!important;height:46px!important;border:2px solid #fff!important;background:#fff!important;color:#e85d24!important;font-size:29px!important;box-shadow:0 5px 14px rgba(17,38,52,.18)!important}
      .body{padding:22px 10px 11px!important}.body h2{font-size:16px!important;color:#17202a!important;font-weight:900!important}.body p{color:#7a8891!important;font-size:11px!important;height:35px!important}.price{font-size:17px!important;color:#17202a!important}.old-price{color:#a7b0b5!important}.controls{margin-top:9px!important}.controls button{width:31px!important;height:31px!important}.plus{background:#00dfff!important}.minus{background:#edf2f4!important}.qty{color:#17202a!important}.product-offer{top:8px!important;right:8px!important;background:#dfff00!important;border-radius:7px!important;padding:4px 7px!important;font-size:10px!important}
      .offers-section{background:#f5f3ee!important;margin-top:24px!important;padding:15px 11px 22px!important}.offers-row{gap:10px!important}.offer-card{flex-basis:205px!important;border:1px solid #e4e1d8!important;box-shadow:0 4px 13px rgba(17,38,52,.06)!important}.offer-card img{height:112px!important}.offer-card .offer-body{padding:10px!important}.offer-card strong{font-size:14px!important}.offer-price{color:#17202a!important}
      .cart-bar{left:9px!important;right:9px!important;bottom:8px!important;background:linear-gradient(90deg,#00dfff,#00bdd8)!important;border-radius:18px!important;padding:9px 10px!important;box-shadow:0 10px 30px rgba(0,0,0,.22)!important}.cart-open{background:#00131e!important}
      @media(max-width:420px){.hero-cover{height:155px!important}.hero-info h1{font-size:22px!important}.products{gap:9px!important}.product img{height:128px!important}.body{padding-left:9px!important;padding-right:9px!important}.body h2{font-size:15px!important}.body p{font-size:10.5px!important}.price{font-size:16px!important}.add{width:44px!important;height:44px!important}}
      @media(max-width:360px){.products{grid-template-columns:1fr 1fr!important;gap:7px!important}.product img{height:115px!important}.body h2{font-size:14px!important}.body p{height:32px!important}.controls{gap:5px!important}}
      @media(min-width:700px){.products{grid-template-columns:repeat(3,minmax(0,1fr))!important}.hero-cover{height:235px!important}}
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMenuUI);else installMenuUI();
})();