import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Comment } from '@/types/post.types'

// Unsubscribe 타입 정의
type Unsubscribe = () => void

// 댓글 작성
export const createComment = async (
  postId: string,
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  content: string
) => {
  try {
    const commentRef = collection(db, `posts/${postId}/comments`)
    const postRef = doc(db, 'posts', postId)
    
    // 트랜잭션으로 댓글 추가 + commentCount 증가
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef)
      
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.')
      }
      
      const newCommentCount = (postDoc.data().commentCount || 0) + 1
      
      // 댓글 추가
      const newCommentRef = doc(commentRef)
      transaction.set(newCommentRef, {
        id: newCommentRef.id,
        postId,
        content,
        authorId: userId,
        authorName: userName,
        authorPhotoURL: userPhotoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: 0,
        likedBy: [],
        isDeleted: false,
      })
      
      // 게시글의 댓글 수 증가
      transaction.update(postRef, {
        commentCount: newCommentCount,
      })
    })
    
    return { success: true }
  } catch (error) {
    console.error('댓글 작성 실패:', error)
    throw new Error('댓글 작성에 실패했습니다.')
  }
}

// 댓글 목록 조회 (1회성)
export const getComments = async (postId: string) => {
  try {
    const q = query(
      collection(db, `posts/${postId}/comments`),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const comments = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[]
    
    // 클라이언트 사이드에서 좋아요 순으로 정렬
    const sortedComments = comments
      .filter(comment => !comment.isDeleted)
      .sort((a, b) => {
        const likeDiff = (b.likeCount || 0) - (a.likeCount || 0)
        if (likeDiff !== 0) return likeDiff
        // 좋아요 수가 같으면 최신 댓글 우선
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      })
    
    return sortedComments
  } catch (error) {
    console.error('댓글 목록 조회 실패:', error)
    throw new Error('댓글을 불러오는데 실패했습니다.')
  }
}

// 댓글 실시간 구독
export const subscribeToComments = (
  postId: string,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, `posts/${postId}/comments`),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[]
      
      // 클라이언트 사이드에서 좋아요 순으로 정렬
      const sortedComments = comments
        .filter(comment => !comment.isDeleted)
        .sort((a, b) => {
          const likeDiff = (b.likeCount || 0) - (a.likeCount || 0)
          if (likeDiff !== 0) return likeDiff
          // 좋아요 수가 같으면 최신 댓글 우선
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        })
      
      onUpdate(sortedComments)
    },
    (error) => {
      console.error('댓글 실시간 구독 오류:', error)
      if (onError) {
        onError(new Error('댓글 실시간 업데이트에 실패했습니다.'))
      }
    }
  )
}

// 댓글 수정
export const updateComment = async (
  postId: string,
  commentId: string,
  userId: string,
  content: string
) => {
  try {
    const commentRef = doc(db, `posts/${postId}/comments`, commentId)
    
    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef)
      
      if (!commentDoc.exists()) {
        throw new Error('댓글을 찾을 수 없습니다.')
      }
      
      const comment = commentDoc.data()
      if (comment.authorId !== userId) {
        throw new Error('수정 권한이 없습니다.')
      }
      
      transaction.update(commentRef, {
        content,
        updatedAt: serverTimestamp(),
      })
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('댓글 수정 실패:', error)
    throw error
  }
}

// 댓글 삭제 (소프트 삭제)
export const deleteComment = async (
  postId: string,
  commentId: string,
  userId: string
) => {
  try {
    const commentRef = doc(db, `posts/${postId}/comments`, commentId)
    const postRef = doc(db, 'posts', postId)
    
    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef)
      const postDoc = await transaction.get(postRef)
      
      if (!commentDoc.exists()) {
        throw new Error('댓글을 찾을 수 없습니다.')
      }
      
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.')
      }
      
      const comment = commentDoc.data()
      if (comment.authorId !== userId) {
        throw new Error('삭제 권한이 없습니다.')
      }
      
      const newCommentCount = Math.max((postDoc.data().commentCount || 1) - 1, 0)
      
      // 댓글 소프트 삭제
      transaction.update(commentRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      })
      
      // 게시글의 댓글 수 감소
      transaction.update(postRef, {
        commentCount: newCommentCount,
      })
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('댓글 삭제 실패:', error)
    throw error
  }
}

// 댓글 완전 삭제 (하드 삭제)
export const hardDeleteComment = async (
  postId: string,
  commentId: string,
  userId: string
) => {
  try {
    const commentRef = doc(db, `posts/${postId}/comments`, commentId)
    const postRef = doc(db, 'posts', postId)
    
    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef)
      const postDoc = await transaction.get(postRef)
      
      if (!commentDoc.exists()) {
        throw new Error('댓글을 찾을 수 없습니다.')
      }
      
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.')
      }
      
      const comment = commentDoc.data()
      if (comment.authorId !== userId) {
        throw new Error('삭제 권한이 없습니다.')
      }
      
      const newCommentCount = Math.max((postDoc.data().commentCount || 1) - 1, 0)
      
      // 댓글 완전 삭제
      transaction.delete(commentRef)
      
      // 게시글의 댓글 수 감소
      transaction.update(postRef, {
        commentCount: newCommentCount,
      })
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('댓글 삭제 실패:', error)
    throw error
  }
}

// 댓글 좋아요 토글
export const toggleCommentLike = async (
  postId: string,
  commentId: string,
  userId: string
) => {
  try {
    const commentRef = doc(db, `posts/${postId}/comments`, commentId)
    
    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef)
      
      if (!commentDoc.exists()) {
        throw new Error('댓글을 찾을 수 없습니다.')
      }
      
      const comment = commentDoc.data()
      const likedBy = comment.likedBy || []
      const isLiked = likedBy.includes(userId)
      
      if (isLiked) {
        // 좋아요 취소
        transaction.update(commentRef, {
          likeCount: Math.max((comment.likeCount || 1) - 1, 0),
          likedBy: likedBy.filter((id: string) => id !== userId),
          updatedAt: serverTimestamp(),
        })
      } else {
        // 좋아요 추가
        transaction.update(commentRef, {
          likeCount: (comment.likeCount || 0) + 1,
          likedBy: [...likedBy, userId],
          updatedAt: serverTimestamp(),
        })
      }
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('댓글 좋아요 토글 실패:', error)
    throw error
  }
}

