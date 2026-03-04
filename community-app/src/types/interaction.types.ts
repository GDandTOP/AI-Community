import { Timestamp } from 'firebase/firestore'

/**
 * 좋아요 타입
 */
export interface PostLike {
  id: string // 문서 ID
  userId: string // 좋아요를 누른 사용자 ID
  postId: string // 게시글 ID
  createdAt: Timestamp // 생성 시간
}

/**
 * 북마크 타입
 */
export interface Bookmark {
  id: string // 문서 ID
  userId: string // 북마크한 사용자 ID
  postId: string // 게시글 ID
  createdAt: Timestamp // 생성 시간
}

