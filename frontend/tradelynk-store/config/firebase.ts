import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import {
  getMessaging,
  Messaging,
  getToken,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDYBdzWNsEFdpLMuGG5GFaEEFbOeWWzkRk",
  authDomain: "tradelynk-c8ddc.firebaseapp.com",
  databaseURL:
    "https://tradelynk-c8ddc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tradelynk-c8ddc",
  storageBucket: "tradelynk-c8ddc.firebasestorage.app",
  messagingSenderId: "827445968537",
  appId: "1:827445968537:web:ea262b6e14c84b81878208",
};

let app;
let database: Database;
let messaging: Messaging;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  messaging = getMessaging(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { database, messaging, getToken, onMessage };
export default app;
