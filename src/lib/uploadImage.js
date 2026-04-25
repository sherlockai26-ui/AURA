import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase.js';

export async function uploadImage(file, path) {
  const storageRef = ref(storage, path);
  const snapshot   = await uploadBytesResumable(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
