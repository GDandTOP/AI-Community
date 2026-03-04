import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

// Google Provider
const googleProvider = new GoogleAuthProvider()

// 에러 메시지 변환
const getErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.'
    case 'auth/invalid-email':
      return '올바르지 않은 이메일 형식입니다.'
    case 'auth/operation-not-allowed':
      return '허용되지 않은 작업입니다.'
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다. (최소 6자 이상)'
    case 'auth/user-disabled':
      return '비활성화된 계정입니다.'
    case 'auth/user-not-found':
      return '존재하지 않는 계정입니다.'
    case 'auth/wrong-password':
      return '잘못된 비밀번호입니다.'
    case 'auth/popup-closed-by-user':
      return '로그인 팝업이 닫혔습니다.'
    case 'auth/network-request-failed':
      return '네트워크 오류가 발생했습니다.'
    default:
      return error.message || '알 수 없는 오류가 발생했습니다.'
  }
}

// 이메일/비밀번호 회원가입
export const signupWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    // 1. Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // 2. 프로필 업데이트 (displayName)
    await updateProfile(user, { displayName })

    // 3. Firestore에 기본 사용자 프로필 생성
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      bio: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      provider: 'email',
      isActive: true,
      isProfileComplete: false, // 설문 미완료
      postCount: 0,
      likeCount: 0,
    })

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

// 이메일/비밀번호 로그인
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      },
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

// Google 소셜 로그인
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Firestore에 사용자 프로필 확인/생성
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // 최초 로그인 시 프로필 생성
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        provider: 'google',
        isActive: true,
        isProfileComplete: false, // 설문 미완료
        postCount: 0,
        likeCount: 0,
      })
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

// 로그아웃
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

// 비밀번호 재설정
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return {
      success: true,
      message: '비밀번호 재설정 이메일이 발송되었습니다.',
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

// Firestore에서 사용자 프로필 가져오기
export const getUserProfile = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    console.error('프로필 로드 실패:', error)
    return null
  }
}

