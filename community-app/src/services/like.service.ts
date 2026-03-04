import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

type Unsubscribe = () => void

/**
 * 좋아요 추가
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 */
export const addLike = async (userId: string, postId: string): Promise<void> => {
  try {
    const likeId = `${userId}_${postId}`
    const likeRef = doc(db, 'postLikes', likeId)
    const postRef = doc(db, 'posts', postId)

    await runTransaction(db, async (transaction) => {
      // 이미 좋아요가 있는지 확인
      const likeDoc = await transaction.get(likeRef)
      if (likeDoc.exists()) {
        throw new Error('이미 좋아요를 눌렀습니다.')
      }

      // 게시글 존재 확인
      const postDoc = await transaction.get(postRef)
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.')
      }

      // 좋아요 추가
      transaction.set(likeRef, {
        id: likeId,
        userId,
        postId,
        createdAt: serverTimestamp(),
      })

      // 게시글의 좋아요 수 증가
      const currentLikeCount = postDoc.data().likeCount || 0
      transaction.update(postRef, {
        likeCount: currentLikeCount + 1,
      })
    })
  } catch (error: any) {
    console.error('좋아요 추가 실패:', error)
    throw new Error(error.message || '좋아요 추가에 실패했습니다.')
  }
}

/**
 * 좋아요 삭제
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 */
export const removeLike = async (userId: string, postId: string): Promise<void> => {
  try {
    const likeId = `${userId}_${postId}`
    const likeRef = doc(db, 'postLikes', likeId)
    const postRef = doc(db, 'posts', postId)

    await runTransaction(db, async (transaction) => {
      // 좋아요 존재 확인
      const likeDoc = await transaction.get(likeRef)
      if (!likeDoc.exists()) {
        throw new Error('좋아요가 존재하지 않습니다.')
      }

      // 게시글 존재 확인
      const postDoc = await transaction.get(postRef)
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.')
      }

      // 좋아요 삭제
      transaction.delete(likeRef)

      // 게시글의 좋아요 수 감소
      const currentLikeCount = postDoc.data().likeCount || 0
      transaction.update(postRef, {
        likeCount: Math.max(0, currentLikeCount - 1),
      })
    })
  } catch (error: any) {
    console.error('좋아요 삭제 실패:', error)
    throw new Error(error.message || '좋아요 삭제에 실패했습니다.')
  }
}

/**
 * 좋아요 토글 (추가/삭제)
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 * @returns 좋아요 상태 (true: 추가됨, false: 삭제됨)
 */
export const toggleLike = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const isLiked = await checkLikeStatus(userId, postId)
    
    if (isLiked) {
      await removeLike(userId, postId)
      return false
    } else {
      await addLike(userId, postId)
      return true
    }
  } catch (error: any) {
    console.error('좋아요 토글 실패:', error)
    throw new Error(error.message || '좋아요 처리에 실패했습니다.')
  }
}

/**
 * 좋아요 상태 확인
 * @param userId 사용자 ID
 * @param postId 게시글 ID
 * @returns 좋아요 여부
 */
export const checkLikeStatus = async (
  userId: string,
  postId: string
): Promise<boolean> => {
  try {
    const likeId = `${userId}_${postId}`
    const likeRef = doc(db, 'postLikes', likeId)
    const likeDoc = await getDoc(likeRef)
    
    return likeDoc.exists()
  } catch (error) {
    console.error('좋아요 상태 확인 실패:', error)
    return false
  }
}

/**
 * 사용자가 좋아요한 게시글 ID 목록 조회
 * @param userId 사용자 ID
 * @returns 게시글 ID 배열
 */
export const getUserLikedPostIds = async (userId: string): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'postLikes'),
      where('userId', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data().postId)
  } catch (error) {
    console.error('좋아요 게시글 목록 조회 실패:', error)
    return []
  }
}

/**
 * 게시글에 좋아요를 누른 사용자 수 조회
 * @param postId 게시글 ID
 * @returns 좋아요 수
 */
export const getPostLikeCount = async (postId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'postLikes'),
      where('postId', '==', postId)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('좋아요 수 조회 실패:', error)
    return 0
  }
}

/**
 * 게시글의 실시간 좋아요 수 구독
 * @param postId 게시글 ID
 * @param callback 좋아요 수 변경 시 호출될 콜백
 * @returns 구독 해제 함수
 */
export const subscribeToPostLikes = (
  postId: string,
  callback: (likeCount: number) => void
): Unsubscribe => {
  const postRef = doc(db, 'posts', postId)
  
  return onSnapshot(
    postRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        callback(data.likeCount || 0)
      }
    },
    (error) => {
      console.error('좋아요 수 실시간 구독 실패:', error)
    }
  )
}

/**
 * 사용자가 좋아요한 게시글 목록 조회
 * @param userId 사용자 ID
 * @returns 게시글 배열
 */
export const getUserLikedPosts = async (userId: string): Promise<any[]> => {
  try {
    // 1. 사용자가 좋아요한 게시글 ID 목록 조회
    const likedPostIds = await getUserLikedPostIds(userId)

    if (likedPostIds.length === 0) {
      return []
    }

    // 2. 게시글 정보 조회 (최대 10개씩 배치 처리)
    const posts: any[] = []
    const batchSize = 10

    for (let i = 0; i < likedPostIds.length; i += batchSize) {
      const batch = likedPostIds.slice(i, i + batchSize)
      const q = query(collection(db, 'posts'), where('__name__', 'in', batch))
      const snapshot = await getDocs(q)

      snapshot.docs.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data(),
        })
      })
    }

    // 3. 생성 시간 기준 내림차순 정렬
    return posts.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('좋아요 게시글 목록 조회 실패:', error)
    throw new Error('좋아요 게시글 목록을 불러오는데 실패했습니다.')
  }
}

