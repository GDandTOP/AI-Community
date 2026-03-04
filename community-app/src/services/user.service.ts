import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { SurveyData } from '@/types/user.types'

// 사용자 설문 데이터 저장
export const saveSurveyData = async (uid: string, surveyData: SurveyData) => {
  try {
    const userRef = doc(db, 'users', uid)
    
    await updateDoc(userRef, {
      interests: surveyData.interests,
      experienceLevel: surveyData.experienceLevel,
      preferredTopics: surveyData.preferredTopics,
      isProfileComplete: true,
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error('설문 데이터 저장 실패:', error)
    throw new Error('설문 데이터 저장에 실패했습니다.')
  }
}

// 사용자 프로필 업데이트
export const updateUserProfile = async (
  uid: string,
  data: {
    displayName?: string
    bio?: string
    photoURL?: string
  }
) => {
  try {
    const userRef = doc(db, 'users', uid)
    
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error('프로필 업데이트 실패:', error)
    throw new Error('프로필 업데이트에 실패했습니다.')
  }
}

