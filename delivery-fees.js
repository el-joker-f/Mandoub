/* MANDOUB - Dynamic delivery fees */
const MANDOUB_FIREBASE_CONFIG={apiKey:"AIzaSyB6-RVH7-8NrN-AaOOv6Qj9APDeyj7oIU",authDomain:"mandoub-dv.firebaseapp.com",projectId:"mandoub-dv",storageBucket:"mandoub-dv.firebasestorage.app",messagingSenderId:"311140400335",appId:"1:311140400335:web:db198b7c53259c53594bba"};

function mandoubDeliveryFee(km){
  if(!Number.isFinite(km)||km<0)return null;
  if(km<=3)return 25;
  if(km<=5)return 30;
  if(km<=7)return 35;
  if(km<=9)return 45;
  if(km<=15)return 55;
  return null;
}
function mandoubDistanceKm(a,b){
  const R=6371,lat1=a.lat*Math.PI/180,lat2=b.lat*Math.PI/180,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function mandoubCoords(){
  try{const raw=localStorage.getItem("mandoub_location_coords");if(raw){const p=JSON.parse(raw);if(Number.isFinite(p.lat)&&Number.isFinite(p.lng))return p;}}catch(e){}
  const raw=localStorage.getItem("mandoub_location")||"";const m=raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  return m?{lat:Number(m[1]),lng:Number(m[2])}:null;
}
function saveMandoubCoords(p){if(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng))localStorage.setItem("mandoub_location_coords",JSON.stringify(p));}

async function initDeliveryFees(){
  const isRestaurant=!!document.querySelector("#products")&&location.pathname.toLowerCase().endsWith("restaurant.html");
  const isHome=!!document.querySelector("#cartButton")&&location.pathname.toLowerCase().endsWith("index.html");

  if(isRestaurant){
    const params=new URLSearchParams(location.search),restaurantId=params.get("id");
    let restaurantCoords=null;
    try{
      const {initializeApp,getApps}=await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js");
      const {getFirestore,doc,getDoc}=await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js");
      const app=getApps().length?getApps()[0]:initializeApp(MANDOUB_FIREBASE_CONFIG);
      const db=getFirestore(app);
      if(restaurantId){const s=await getDoc(doc(db,"restaurants",restaurantId));if(s.exists()){const d=s.data();const lat=Number(d.latitude??d.lat),lng=Number(d.longitude??d.lng);if(Number.isFinite(lat)&&Number.isFinite(lng))restaurantCoords={lat,lng};}}
    }catch(e){console.warn("Delivery fee restaurant lookup failed",e)}

    const wrap=()=>{
      if(typeof window.addProduct!=="function"||window.__deliveryAddWrapped)return;
      const originalAdd=window.addProduct;window.__deliveryAddWrapped=true;
      window.addProduct=async function(name,price){
        const pending=JSON.parse(localStorage.getItem("mandoub_pending_cart")||"[]");
        const found=pending.find(x=>x.name===name&&x.restaurantId===restaurantId);
        if(found)found.quantity=(found.quantity||1)+1;else pending.push({name,price:Number(price)||0,quantity:1,restaurantId,restaurantCoords});
        localStorage.setItem("mandoub_pending_cart",JSON.stringify(pending));
        return originalAdd(name,price);
      };
      if(typeof window.goHome==="function"&&!window.__deliveryGoWrapped){const oldGo=window.goHome;window.__deliveryGoWrapped=true;window.goHome=function(){localStorage.setItem("mandoub_pending_cart",JSON.stringify(JSON.parse(localStorage.getItem("mandoub_pending_cart")||"[]")));oldGo();};}
    };
    wrap();setTimeout(wrap,500);setTimeout(wrap,1500);
  }

  if(isHome){
    const pending=JSON.parse(localStorage.getItem("mandoub_pending_cart")||"[]");
    if(pending.length&&typeof window.addToCart==="function"){
      pending.forEach(x=>{for(let i=0;i<(x.quantity||1);i++)window.addToCart(x.name,x.price);});
      localStorage.removeItem("mandoub_pending_cart");
    }

    const oldSet=window.setLocation;
    if(typeof oldSet==="function"&&!window.__deliveryLocationWrapped){
      window.__deliveryLocationWrapped=true;
      window.setLocation=function(){
        oldSet();
        navigator.geolocation?.getCurrentPosition(p=>saveMandoubCoords({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{}, {enableHighAccuracy:true,maximumAge:30000,timeout:15000});
      };
    }

    const originalAddDoc=window.firebaseAddDoc;
    if(typeof originalAddDoc==="function"&&!window.__deliveryAddDocWrapped){
      window.__deliveryAddDocWrapped=true;
      window.firebaseAddDoc=async function(ref,data){
        try{
          const pendingMeta=JSON.parse(localStorage.getItem("mandoub_last_order_meta")||"[]");
          if(pendingMeta.length){
            const customer=mandoubCoords();
            const rc=pendingMeta[0].restaurantCoords;
            if(customer&&rc){
              const distance=mandoubDistanceKm(customer,rc),fee=mandoubDeliveryFee(distance);
              if(fee===null)throw new Error("هذا المطعم خارج نطاق التوصيل (أكثر من 15 كم).");
              data.deliveryDistanceKm=Number(distance.toFixed(2));data.deliveryFee=fee;data.subtotal=Number(data.total||0);data.total=Number(data.total||0)+fee;
            }
          }
        }catch(e){if(e.message.includes("خارج نطاق"))throw e;console.warn("Delivery fee calculation failed",e)}
        return originalAddDoc(ref,data);
      };
    }
  }
}

document.addEventListener("DOMContentLoaded",()=>setTimeout(initDeliveryFees,0));
if(document.readyState!=="loading")setTimeout(initDeliveryFees,0);
window.mandoubDeliveryFee=mandoubDeliveryFee;
window.mandoubDistanceKm=mandoubDistanceKm;
