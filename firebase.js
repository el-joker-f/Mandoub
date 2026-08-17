import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


const firebaseConfig = {

  apiKey: "AIzaSyB6-RVH7-8NrN-AaOOv6QjL9APDeyj7oIU",

  authDomain: "mandoub-dv.firebaseapp.com",

  projectId: "mandoub-dv",

  storageBucket: "mandoub-dv.firebasestorage.app",

  messagingSenderId: "311140400335",

  appId: "1:311140400335:web:db198b7c53259c53594bba",

  measurementId: "G-7V1LJQYYXD"

};


const app =
  initializeApp(firebaseConfig);


const db =
  getFirestore(app);


// نخلي Firebase متاح للموقع

window.firebaseDB = db;

window.firebaseCollection = collection;

window.firebaseAddDoc = addDoc;

window.firebaseServerTimestamp =
  serverTimestamp;

window.firebaseDoc = doc;

window.firebaseGetDoc = getDoc;

window.firebaseReady = true;


console.log("Firebase متصل بنجاح ✅");
