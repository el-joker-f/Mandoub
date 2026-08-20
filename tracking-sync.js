import { db } from './auth.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

async function syncPublicOrder(orderId, fields={}) {
  try {
    const snap = await getDoc(doc(db,'orders',orderId));
    if(!snap.exists()) return;
    const trackingCode = snap.data()?.trackingCode;
    if(!trackingCode) return;
    await updateDoc(doc(db,'publicOrders',trackingCode),fields);
  } catch(e) {
    console.warn('Public tracking sync skipped:',e);
  }
}

function installWrappers(){
  if(window.__trackingSyncInstalled) return true;
  if(typeof window.changeOrderStatus !== 'function' || typeof window.assignDriver !== 'function') return false;
  const originalStatus=window.changeOrderStatus;
  window.changeOrderStatus=async(id,status)=>{
    const result=await originalStatus(id,status);
    if(status) await syncPublicOrder(id,{status});
    return result;
  };
  const originalAssign=window.assignDriver;
  window.assignDriver=async(id,driverId)=>{
    const result=await originalAssign(id,driverId);
    const snap=await getDoc(doc(db,'orders',id));
    if(snap.exists()){
      const o=snap.data();
      await syncPublicOrder(id,{assignedDriverName:o.assignedDriverName||null,updatedAt:new Date()});
    }
    return result;
  };
  window.__trackingSyncInstalled=true;
  return true;
}

let tries=0;
const timer=setInterval(()=>{
  if(installWrappers()||++tries>50) clearInterval(timer);
},100);
