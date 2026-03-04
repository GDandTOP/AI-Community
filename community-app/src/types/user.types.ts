export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  bio?: string
  
  // 설문 데이터
  interests?: string[]
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferredTopics?: string[]
  
  // 메타데이터
  createdAt: Date
  updatedAt: Date
  provider: 'email' | 'google'
  isProfileComplete: boolean
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  bio: string
  interests: string[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferredTopics: string[]
  createdAt: Date
  updatedAt: Date
  provider: 'email' | 'google'
  isActive: boolean
  postCount: number
  likeCount: number
}

export interface SurveyData {
  interests: string[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferredTopics: string[]
}

