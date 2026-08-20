import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

export const SUPER_ADMIN_EMAIL = "fmdyh6636@gmail.com";
export const firebaseConfig = {apiKey:"AIzaSyB6-RVH7-8NrN-AaOOv6Qj9APDeyj7oIU",authDomain:"mandoub-dv.firebaseapp.com",projectId:"mandoub-dv",storageBucket:"mandoub-dv.firebasestorage.app",messagingSenderId:"311140400335",appId:"1:311140400335:web:db198b7c53259c53594bba",measurementId:"G-7V1LJQYYXD"};
const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const authReady=setPersistence(auth,browserLocalPersistence).catch(e=>{console.error("Auth persistence error:",e);return null;});
export const db=getFirestore(app);
const norm=e=>(e||"").trim().toLowerCase();
export const normalizePhone=p=>{let s=(p||"").replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^0-9+]/g,"");if(s.startsWith("+20"))s="0"+s.slice(3);else if(s.startsWith("20"))s="0"+s.slice(2);return s;};
export async function getUserRole(user=auth.currentUser){if(!user)return null;if(norm(user.email)===norm(SUPER_ADMIN_EMAIL))return "superadmin";const s=await getDoc(doc(db,"roles",user.uid));const r=s.exists()?s.data()?.role:null;return r==="admin"||r==="superadmin"?r:"customer";}
export async function ensureCustomerRole(user){if(!user)return;const email=norm(user.email);const ref=doc(db,"roles",user.uid);const snap=await getDoc(ref);if(email===norm(SUPER_ADMIN_EMAIL)){await setDoc(ref,{uid:user.uid,email:user.email,role:"superadmin",updatedAt:serverTimestamp()},{merge:true});return;}if(!snap.exists())await setDoc(ref,{uid:user.uid,email:user.email,role:"customer",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});}
export async function isAdmin(user=auth.currentUser){const r=await getUserRole(user);return r==="admin"||r==="superadmin";}
export async function isSuperAdmin(user=auth.currentUser){return (await getUserRole(user))==="superadmin";}
export async function requireAdmin({redirect="login.html"}={}){return new Promise(resolve=>{const unsub=onAuthStateChanged(auth,async user=>{unsub();if(!user){location.replace(redirect);return resolve(false);}try{if(!(await isAdmin(user))){await signOut(auth);location.replace(redirect);return resolve(false);}resolve(true);}catch(e){console.error(e);await signOut(auth).catch(()=>{});location.replace(redirect);resolve(false);}});});}
export async function routeAfterLogin(user){await authReady;await ensureCustomerRole(user);const r=await getUserRole(user);location.replace(r==="admin"||r==="superadmin"?"admin.html":"index.html");}
export async function addAdminByEmail(targetEmail){if(!(await isSuperAdmin()))throw new Error("SUPER_ADMIN_REQUIRED");const email=norm(targetEmail);if(!email)throw new Error("INVALID_EMAIL");if(email===norm(SUPER_ADMIN_EMAIL))throw new Error("SUPER_ADMIN_ALREADY_EXISTS");const snap=await getDocs(collection(db,"roles"));let target=null;snap.forEach(d=>{const x=d.data();if(norm(x.email)===email)target={uid:d.id,...x};});if(!target)throw new Error("USER_NOT_FOUND");if(target.role==="superadmin")throw new Error("SUPER_ADMIN_ALREADY_EXISTS");await setDoc(doc(db,"roles",target.uid),{uid:target.uid,email:target.email||targetEmail.trim(),role:"admin",updatedAt:serverTimestamp()},{merge:true});return target;}
export async function removeAdmin(targetUid,targetEmail){if(!(await isSuperAdmin()))throw new Error("SUPER_ADMIN_REQUIRED");if(!targetUid)throw new Error("INVALID_ADMIN");if(norm(targetEmail)===norm(SUPER_ADMIN_EMAIL))throw new Error("CANNOT_REMOVE_SUPER_ADMIN");await setDoc(doc(db,"roles",targetUid),{role:"customer",updatedAt:serverTimestamp()},{merge:true});}
export async function addAdmin(targetUid,targetEmail){return addAdminByEmail(targetEmail);}
export async function emailForPhone(phone){const p=normalizePhone(phone);if(!p)throw new Error("INVALID_PHONE");const s=await getDoc(doc(db,"phoneIndex",p));if(!s.exists())throw new Error("PHONE_NOT_FOUND");return s.data()?.email||null;}
