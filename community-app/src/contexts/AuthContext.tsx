import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { getUserProfile } from '@/services/auth.service'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isProfileComplete?: boolean
}

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userProfile = await getUserProfile(firebaseUser.uid)
      
      if (userProfile) {
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
          isProfileComplete: userProfile.isProfileComplete,
        })
      } else {
        // Firestore에 프로필이 없으면 Firebase Auth 정보 사용
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isProfileComplete: false,
        })
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error)
      setCurrentUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isProfileComplete: false,
      })
    }
  }

  const refreshUser = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser)
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

