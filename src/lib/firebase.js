import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Solo inicializamos Firebase si hay configuración real. Sin VITE_FIREBASE_*
// definidas (despliegue sin backend, modo localStorage puro), exportamos null
// y los call-sites caen al modo offline. Esto evita el clásico error
// "FirebaseError: auth/invalid-api-key" al cargar el módulo en producción.
export const isFirebaseEnabled = !!(cfg.apiKey && cfg.projectId);

export const app     = isFirebaseEnabled ? initializeApp(cfg) : null;
export const auth    = isFirebaseEnabled ? getAuth(app)       : null;
export const db      = isFirebaseEnabled ? getFirestore(app)  : null;
export const storage = isFirebaseEnabled ? getStorage(app)    : null;
