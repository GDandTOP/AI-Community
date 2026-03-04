import { Timestamp } from 'firebase/firestore'

export interface Post {
  id: string
  title: string
  content: string
  
  // 작성자 정보
  authorId: string
  authorName: string
  authorPhotoURL: string | null
  
  // 메타데이터
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // 통계
  likeCount: number
  commentCount: number
  bookmarkCount: number
  viewCount: number
  
  // 태그 및 카테고리
  tags?: string[]
  category?: string
  
  // 미디어
  images?: string[] // 이미지 URL 배열
  youtubeUrl?: string // YouTube 링크
  
  // 상태
  isPublished: boolean
  isDeleted: boolean
}

export interface PostFormData {
  title: string
  content: string
  tags?: string[]
  category?: string
  images?: string[] // 이미지 URL 배열
  youtubeUrl?: string // YouTube 링크
}

export interface Comment {
  id: string
  postId: string
  content: string
  
  // 작성자 정보
  authorId: string
  authorName: string
  authorPhotoURL: string | null
  
  // 메타데이터
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // 좋아요
  likeCount: number
  likedBy: string[] // 좋아요를 누른 사용자 UID 배열
  
  // 상태
  isDeleted: boolean
}

export const CATEGORIES = [
  'AI 도구',
  '프롬프트 엔지니어링',
  'AI 뉴스',
  'AI 연구',
  '개발',
  '자유 주제',
] as const

export type Category = typeof CATEGORIES[number]

