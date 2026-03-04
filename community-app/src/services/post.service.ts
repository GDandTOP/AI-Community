import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Post, PostFormData } from '@/types/post.types'

// 게시글 생성
export const createPost = async (
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  postData: PostFormData
) => {
  try {
    const batch = writeBatch(db)
    
    // 새 게시글 문서 생성
    const postRef = doc(collection(db, 'posts'))
    const userRef = doc(db, 'users', userId)
    
    batch.set(postRef, {
      id: postRef.id,
      title: postData.title,
      content: postData.content,
      authorId: userId,
      authorName: userName,
      authorPhotoURL: userPhotoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      tags: postData.tags || [],
      category: postData.category || '자유 주제',
      images: postData.images || [],
      youtubeUrl: postData.youtubeUrl || '',
      isPublished: true,
      isDeleted: false,
    })
    
    // 사용자의 게시글 수 증가
    batch.update(userRef, {
      postCount: increment(1),
    })
    
    await batch.commit()
    return { success: true, postId: postRef.id }
  } catch (error) {
    console.error('게시글 작성 실패:', error)
    throw new Error('게시글 작성에 실패했습니다.')
  }
}

// 게시글 목록 조회 (최신순)
// 복합 인덱스 대신 createdAt 단일 인덱스로 조회 후 클라이언트에서 필터링
export const getPosts = async (categoryFilter?: string, limitCount = 20) => {
  try {
    // 단일 필드 orderBy만 사용 → 복합 인덱스 불필요
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 3) // 필터링 후 충분한 수가 남도록 여유 있게 조회
    )
    
    const snapshot = await getDocs(q)
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[]
    
    // 클라이언트에서 공개 게시글, 삭제되지 않은 게시글 필터링
    posts = posts.filter(p => p.isPublished === true && p.isDeleted === false)
    
    // 카테고리 필터 적용
    if (categoryFilter && categoryFilter !== '전체') {
      posts = posts.filter(p => p.category === categoryFilter)
    }
    
    // limitCount 적용
    return posts.slice(0, limitCount)
  } catch (error: any) {
    console.error('게시글 목록 조회 실패:', error)
    throw new Error('게시글을 불러오는데 실패했습니다.')
  }
}

// 게시글 목록 조회 (인기순)
// 복합 인덱스 대신 likeCount 단일 인덱스로 조회 후 클라이언트에서 필터링
export const getPopularPosts = async (categoryFilter?: string, limitCount = 20) => {
  try {
    // 단일 필드 orderBy만 사용 → 복합 인덱스 불필요
    const q = query(
      collection(db, 'posts'),
      orderBy('likeCount', 'desc'),
      limit(limitCount * 3) // 필터링 후 충분한 수가 남도록 여유 있게 조회
    )
    
    const snapshot = await getDocs(q)
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[]
    
    // 클라이언트에서 공개 게시글, 삭제되지 않은 게시글 필터링
    posts = posts.filter(p => p.isPublished === true && p.isDeleted === false)
    
    // 카테고리 필터 적용
    if (categoryFilter && categoryFilter !== '전체') {
      posts = posts.filter(p => p.category === categoryFilter)
    }
    
    // limitCount 적용
    return posts.slice(0, limitCount)
  } catch (error: any) {
    console.error('인기 게시글 조회 실패:', error)
    throw new Error('게시글을 불러오는데 실패했습니다.')
  }
}

// 게시글 상세 조회
export const getPost = async (postId: string) => {
  try {
    const postRef = doc(db, 'posts', postId)
    const postSnap = await getDoc(postRef)
    
    if (!postSnap.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.')
    }
    
    const post = { id: postSnap.id, ...postSnap.data() } as Post
    
    // 조회수 증가 - 보안 규칙상 작성자만 update 가능하므로 실패해도 무시
    updateDoc(postRef, { viewCount: increment(1) }).catch(() => {})
    
    return post
  } catch (error) {
    console.error('게시글 조회 실패:', error)
    throw error
  }
}

// 게시글 수정
export const updatePost = async (
  postId: string,
  userId: string,
  postData: Partial<PostFormData>
) => {
  try {
    const postRef = doc(db, 'posts', postId)
    const postSnap = await getDoc(postRef)
    
    if (!postSnap.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.')
    }
    
    const post = postSnap.data()
    if (post.authorId !== userId) {
      throw new Error('수정 권한이 없습니다.')
    }
    
    await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp(),
    })
    
    return { success: true }
  } catch (error) {
    console.error('게시글 수정 실패:', error)
    throw error
  }
}

// 게시글 삭제 (소프트 삭제)
export const deletePost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'posts', postId)
    const postSnap = await getDoc(postRef)
    
    if (!postSnap.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.')
    }
    
    const post = postSnap.data()
    if (post.authorId !== userId) {
      throw new Error('삭제 권한이 없습니다.')
    }
    
    const batch = writeBatch(db)
    const userRef = doc(db, 'users', userId)
    
    // 게시글 소프트 삭제
    batch.update(postRef, {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    })
    
    // 사용자의 게시글 수 감소
    batch.update(userRef, {
      postCount: increment(-1),
    })
    
    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error('게시글 삭제 실패:', error)
    throw error
  }
}

// 특정 사용자의 게시글 조회
export const getUserPosts = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[]
    
    return posts
  } catch (error) {
    console.error('사용자 게시글 조회 실패:', error)
    throw new Error('게시글을 불러오는데 실패했습니다.')
  }
}

