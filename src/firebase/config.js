// src/firebase/config.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, updateEmail, updatePassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

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
const storage = getStorage(app)

// Login com email e senha
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

// Registrar novo usuário
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

// Atualizar nome do usuário
export const updateUserName = async (user, newName) => {
  try {
    await updateProfile(user, {
      displayName: newName
    })
    
    await setDoc(doc(db, 'empresas', user.uid), {
      nome: newName
    }, { merge: true })
    
    return {
      success: true,
      message: 'Nome atualizado com sucesso!'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Atualizar email do usuário
export const updateUserEmail = async (user, newEmail) => {
  try {
    await updateEmail(user, newEmail)
    
    await setDoc(doc(db, 'empresas', user.uid), {
      email: newEmail
    }, { merge: true })
    
    return {
      success: true,
      message: 'E-mail atualizado com sucesso!'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Atualizar telefone do usuário
export const updateUserPhone = async (user, newPhone) => {
  try {
    await setDoc(doc(db, 'empresas', user.uid), {
      telefone: newPhone
    }, { merge: true })
    
    return {
      success: true,
      message: 'Telefone atualizado com sucesso!'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Atualizar senha do usuário
export const updateUserPassword = async (user, newPassword, confirmPassword) => {
  try {
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: 'As senhas não coincidem!'
      }
    }
    
    if (newPassword.length < 6) {
      return {
        success: false,
        error: 'A senha deve ter pelo menos 6 caracteres!'
      }
    }
    
    await updatePassword(user, newPassword)
    
    return {
      success: true,
      message: 'Senha atualizada com sucesso!'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Atualizar foto de perfil
export const updateUserPhoto = async (user, photoFile) => {
  try {
    const storageRef = ref(storage, `profile-photos/${user.uid}`)
    await uploadBytes(storageRef, photoFile)
    const photoURL = await getDownloadURL(storageRef)
    
    await updateProfile(user, {
      photoURL: photoURL
    })
    
    return {
      success: true,
      message: 'Foto atualizada com sucesso!',
      photoURL: photoURL
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

export { auth, db, storage }