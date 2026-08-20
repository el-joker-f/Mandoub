import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

export const SUPER_ADMIN_EMAIL = "fmdyh6636@gmail.com";
export const firebaseConfig = {apiKey:"AIzaSyBN-MtgWLi0lwBPTzEPYrpwxNe6BCn_3KQ",authDomain:"mandoub-dv.firebaseapp.com",projectId:"mandoub-dv",storageBucket:"mandoub-dv.firebasestorage.app",messagingSenderId:"311140400335",appId:"1:311140400335:web:db198b7c53259c53594bba",measurementId:"G-7V1LJQYYXD"};
const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const authReady=setPersistence(auth,browserLocalPersistence).catch(e=>{console.error("Auth persistence error:",e);return null;});
export const db=getFirestore(app);
const norm=e=>(e||"").trim().toLowerCase();
export const normalizePhone=p=>{let s=(p||"").replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^0-9+]/g,"");if(s.startsWith("+20"))s="0"+s.slice(3);else if(s.startsWith("20"))s="0"+s.slice(2);return s;};

export async function getUserRole(user=auth.currentUser){
  if(!user)return null;
  if(norm(user.email)===norm(SUPER_ADMIN_EMAIL))return "superadmin";
  const s=await getDoc(doc(db,"roles",user.uid));
  const r=s.exists()?s.data()?.role:null;
  return ["admin","highadmin","superadmin"].includes(r)?r:"customer";
}
export async function ensureCustomerRole(user){
  if(!user)return;
  const email=norm(user.email),ref=doc(db,"roles",user.uid),snap=await getDoc(ref);
  if(email===norm(SUPER_ADMIN_EMAIL)){
    await setDoc(ref,{uid:user.uid,email:user.email,role:"superadmin",updatedAt:serverTimestamp()},{merge:true});
    return;
  }
  if(!snap.exists())await setDoc(ref,{uid:user.uid,email:user.email,role:"customer",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function isAdmin(user=auth.currentUser){const r=await getUserRole(user);return ["admin","highadmin","superadmin"].includes(r);}
export async function isHighAdmin(user=auth.currentUser){const r=await getUserRole(user);return r==="highadmin"||r==="superadmin";}
export async function isSuperAdmin(user=auth.currentUser){return (await getUserRole(user))==="superadmin";}
export async function requireAdmin({redirect="login.html"}={}){return new Promise(resolve=>{const unsub=onAuthStateChanged(auth,async user=>{unsub();if(!user){location.replace(redirect);return resolve(false);}try{if(!(await isAdmin(user))){await signOut(auth);location.replace(redirect);return resolve(false);}resolve(true);}catch(e){console.error(e);await signOut(auth).catch(()=>{});location.replace(redirect);resolve(false);}});});}
export async function routeAfterLogin(user){await authReady;await ensureCustomerRole(user);const r=await getUserRole(user);location.replace(["admin","highadmin","superadmin"].includes(r)?"admin.html":"index.html");}

export async function setAdminRole(targetEmail,role){
  if(!(await isSuperAdmin()))throw new Error("SUPER_ADMIN_REQUIRED");
  const email=norm(targetEmail);
  if(!email)throw new Error("INVALID_EMAIL");
  if(email===norm(SUPER_ADMIN_EMAIL))throw new Error("CANNOT_CHANGE_SUPER_ADMIN");
  if(!["admin","highadmin","customer"].includes(role))throw new Error("INVALID_ROLE");
  const snap=await getDocs(collection(db,"roles"));let target=null;
  snap.forEach(d=>{const x=d.data();if(norm(x.email)===email)target={uid:d.id,...x};});
  if(!target)throw new Error("USER_NOT_FOUND");
  await setDoc(doc(db,"roles",target.uid),{uid:target.uid,email:target.email||targetEmail.trim(),role,updatedAt:serverTimestamp()},{merge:true});
  return target;
}
export async function addAdminByEmail(targetEmail,role="admin"){return setAdminRole(targetEmail,role);}
export async function removeAdmin(targetUid,targetEmail){
  if(!(await isSuperAdmin()))throw new Error("SUPER_ADMIN_REQUIRED");
  if(!targetUid)throw new Error("INVALID_ADMIN");
  if(norm(targetEmail)===norm(SUPER_ADMIN_EMAIL))throw new Error("CANNOT_REMOVE_SUPER_ADMIN");
  await setDoc(doc(db,"roles",targetUid),{role:"customer",updatedAt:serverTimestamp()},{merge:true});
}
export async function addAdmin(targetUid,targetEmail){return addAdminByEmail(targetEmail,"admin");}
export async function emailForPhone(phone){const p=normalizePhone(phone);if(!p)throw new Error("INVALID_PHONE");const s=await getDoc(doc(db,"phoneIndex",p));if(!s.exists())throw new Error("PHONE_NOT_FOUND");return s.data()?.email||null;}

// العنتيل فقط يدير الصلاحيات. إعدادات الدفع متاحة للعنتيل وإدارة عالية فقط.
if(location.pathname.endsWith("/admin.html")||location.pathname.endsWith("admin.html")){
  window.addEventListener("DOMContentLoaded",()=>{
    setTimeout(async()=>{
      const high=await isHighAdmin();
      const root=await isSuperAdmin();
      const paymentButton=document.getElementById("paymentSettingsButton");
      if(paymentButton&&!high)paymentButton.remove();
      if(!root)return;
      const input=document.getElementById("adminEmail");
      const oldButton=document.querySelector("#admins button.primary");
      if(input&&oldButton&&!document.getElementById("adminRole")){
        const select=document.createElement("select");select.id="adminRole";select.style.cssText="width:100%;background:#031321;border:2px solid #21445f;color:#fff;padding:11px;border-radius:11px;margin-top:10px";
        select.innerHTML='<option value="admin">Admin</option><option value="highadmin">إدارة عالية</option>';
        input.insertAdjacentElement("afterend",select);
        oldButton.textContent="➕ حفظ الصلاحية";
        oldButton.onclick=async()=>{try{await setAdminRole(input.value.trim(),select.value);input.value="";alert("تم حفظ الصلاحية ✅");location.reload()}catch(e){alert(({USER_NOT_FOUND:"الإيميل غير مسجل في الموقع ❌",SUPER_ADMIN_REQUIRED:"العنتيل فقط يقدر يغير الصلاحيات ❌",CANNOT_CHANGE_SUPER_ADMIN:"لا يمكن تغيير صلاحيات العنتيل ❌",INVALID_EMAIL:"الإيميل غير صحيح ❌"}[e.message]||"تعذر حفظ الصلاحية ❌"))}};
      }
    },500);
  });
}
