import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Post } from '@/types/post.types'

type Unsubscribe = () => void

/**
 * 북마크 추가
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 */
export const addBookmark = async (userId: string, postId: string): Promise<void> => {
  try {
    const bookmarkId = `${userId}_${postId}`
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId)
    const postRef = doc(db, 'posts', postId)

    await runTransaction(db, async (transaction) => {
      // 이미 북마크가 있는지 확인
      const bookmarkDoc = await transaction.get(bookmarkRef)
      if (bookmarkDoc.exists()) {
        throw new Error('이미 북마크에 추가되었습니다.')
      }

      // 게시글 존재 확인
      const postDoc = await transaction.get(postRef)
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.')
      }

      // 북마크 추가
      transaction.set(bookmarkRef, {
        id: bookmarkId,
        userId,
        postId,
        createdAt: serverTimestamp(),
      })

      // 게시글의 북마크 수 증가
      const currentBookmarkCount = postDoc.data().bookmarkCount || 0
      transaction.update(postRef, {
        bookmarkCount: currentBookmarkCount + 1,
      })
    })
  } catch (error: any) {
    console.error('북마크 추가 실패:', error)
    throw new Error(error.message || '북마크 추가에 실패했습니다.')
  }
}

/**
 * 북마크 삭제
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 */
export const removeBookmark = async (userId: string, postId: string): Promise<void> => {
  try {
    const bookmarkId = `${userId}_${postId}`
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId)
    const postRef = doc(db, 'posts', postId)

    await runTransaction(db, async (transaction) => {
      // 북마크 존재 확인
      const bookmarkDoc = await transaction.get(bookmarkRef)
      if (!bookmarkDoc.exists()) {
        throw new Error('북마크가 존재하지 않습니다.')
      }

      // 게시글 존재 확인
      const postDoc = await transaction.get(postRef)
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.')
      }

      // 북마크 삭제
      transaction.delete(bookmarkRef)

      // 게시글의 북마크 수 감소
      const currentBookmarkCount = postDoc.data().bookmarkCount || 0
      transaction.update(postRef, {
        bookmarkCount: Math.max(0, currentBookmarkCount - 1),
      })
    })
  } catch (error: any) {
    console.error('북마크 삭제 실패:', error)
    throw new Error(error.message || '북마크 삭제에 실패했습니다.')
  }
}

/**
 * 북마크 토글 (추가/삭제)
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 * @returns 북마크 상태 (true: 추가됨, false: 삭제됨)
 */
export const toggleBookmark = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const isBookmarked = await checkBookmarkStatus(userId, postId)
    
    if (isBookmarked) {
      await removeBookmark(userId, postId)
      return false
    } else {
      await addBookmark(userId, postId)
      return true
    }
  } catch (error: any) {
    console.error('북마크 토글 실패:', error)
    throw new Error(error.message || '북마크 처리에 실패했습니다.')
  }
}

/**
 * 북마크 상태 확인
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 * @returns 북마크 여부
 */
export const checkBookmarkStatus = async (
  userId: string,
  postId: string
): Promise<boolean> => {
  try {
    const bookmarkId = `${userId}_${postId}`
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId)
    const bookmarkDoc = await getDoc(bookmarkRef)
    
    return bookmarkDoc.exists()
  } catch (error) {
    console.error('북마크 상태 확인 실패:', error)
    return false
  }
}

/**
 * 사용자가 북마크한 게시글 ID 목록 조회
 * @param userId 사용자 ID
 * @returns 게시글 ID 배열
 */
export const getUserBookmarkedPostIds = async (userId: string): Promise<string[]> => {
  try {
    // orderBy 제거 → 복합 인덱스 불필요, 클라이언트에서 정렬
    const q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    const docs = snapshot.docs.map(doc => doc.data())
    
    // 클라이언트에서 최신순 정렬
    docs.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
    
    return docs.map(d => d.postId)
  } catch (error) {
    console.error('북마크 게시글 목록 조회 실패:', error)
    return []
  }
}

/**
 * 사용자가 북마크한 게시글 목록 조회
 * @param userId 사용자 ID
 * @returns 게시글 배열
 */
export const getUserBookmarkedPosts = async (userId: string): Promise<Post[]> => {
  try {
    const postIds = await getUserBookmarkedPostIds(userId)
    
    if (postIds.length === 0) {
      return []
    }

    // 게시글 정보 조회
    const posts: Post[] = []
    for (const postId of postIds) {
      const postRef = doc(db, 'posts', postId)
      const postDoc = await getDoc(postRef)
      
      if (postDoc.exists()) {
        const postData = postDoc.data() as Post
        // 삭제되지 않고 공개된 게시글만
        if (!postData.isDeleted && postData.isPublished) {
          posts.push({ ...postData, id: postDoc.id })
        }
      }
    }
    
    return posts
  } catch (error) {
    console.error('북마크 게시글 상세 조회 실패:', error)
    return []
  }
}

/**
 * 게시글에 북마크를 누른 사용자 수 조회
 * @param postId 게시글 ID
 * @returns 북마크 수
 */
export const getPostBookmarkCount = async (postId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'bookmarks'),
      where('postId', '==', postId)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('북마크 수 조회 실패:', error)
    return 0
  }
}

/**
 * 게시글의 실시간 북마크 수 구독
 * @param postId 게시글 ID
 * @param callback 북마크 수 변경 시 호출될 콜백
 * @returns 구독 해제 함수
 */
export const subscribeToPostBookmarks = (
  postId: string,
  callback: (bookmarkCount: number) => void
): Unsubscribe => {
  const postRef = doc(db, 'posts', postId)
  
  return onSnapshot(
    postRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        callback(data.bookmarkCount || 0)
      }
    },
    (error) => {
      console.error('북마크 수 실시간 구독 실패:', error)
    }
  )
}

