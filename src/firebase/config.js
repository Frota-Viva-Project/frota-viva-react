import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Inicializa o Firebase apenas se ainda não foi inicializado
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)

export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return {
      success: true,
      user: userCredential.user
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    await updateProfile(user, {
      displayName: userData.nome
    })
    
    await setDoc(doc(db, 'empresas', user.uid), {
      nome: userData.nome,
      razaoSocial: userData.razaoSocial,
      cnpj: userData.cnpj,
      endereco: userData.endereco,
      complemento: userData.complemento || '',
      telefone: userData.telefone,
      email: email,
      criadoEm: new Date().toISOString()
    })
    
    return {
      success: true,
      user: user
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

export { auth, db }