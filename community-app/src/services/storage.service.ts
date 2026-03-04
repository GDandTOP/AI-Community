import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'
import { updateUserProfile } from './user.service'

// 지원하는 이미지 형식
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * 파일 유효성 검사
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // 파일 형식 검사
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다. (jpeg, png, webp, gif만 가능)',
    }
  }

  // 파일 크기 검사
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: '파일 크기는 10MB를 초과할 수 없습니다.',
    }
  }

  return { valid: true }
}

/**
 * 프로필 이미지 업로드
 * @param userId 사용자 ID
 * @param file 업로드할 이미지 파일
 * @param oldPhotoURL 기존 프로필 이미지 URL (삭제용)
 * @returns 업로드된 이미지의 다운로드 URL
 */
export const uploadProfileImage = async (
  userId: string,
  file: File,
  oldPhotoURL?: string | null
): Promise<string> => {
  try {
    // 파일 유효성 검사
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 기존 이미지 삭제 (구글 프로필 이미지가 아닌 경우)
    if (oldPhotoURL && !oldPhotoURL.includes('googleusercontent.com')) {
      try {
        await deleteProfileImage(oldPhotoURL)
      } catch (error) {
        console.warn('기존 이미지 삭제 실패:', error)
        // 삭제 실패해도 계속 진행
      }
    }

    // 파일명 생성 (userId_timestamp.extension)
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${userId}_${timestamp}.${extension}`

    // Storage 경로: profile-images/{userId}/{fileName}
    const storageRef = ref(storage, `profile-images/${userId}/${fileName}`)

    // 파일 업로드
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
    })

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(uploadResult.ref)

    // Firestore 사용자 프로필 업데이트
    await updateUserProfile(userId, {
      photoURL: downloadURL,
    })

    return downloadURL
  } catch (error: any) {
    console.error('프로필 이미지 업로드 실패:', error)
    throw new Error(error.message || '이미지 업로드에 실패했습니다.')
  }
}

/**
 * 프로필 이미지 삭제
 * @param photoURL 삭제할 이미지 URL
 */
export const deleteProfileImage = async (photoURL: string): Promise<void> => {
  try {
    // 구글 프로필 이미지는 삭제하지 않음
    if (photoURL.includes('googleusercontent.com')) {
      console.warn('구글 프로필 이미지는 삭제할 수 없습니다.')
      return
    }

    // Storage URL에서 파일 경로 추출
    // URL 형식: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(photoURL)
    const pathMatch = url.pathname.match(/\/o\/(.+)/)
    
    if (!pathMatch) {
      throw new Error('유효하지 않은 이미지 URL입니다.')
    }

    const filePath = decodeURIComponent(pathMatch[1])
    const fileRef = ref(storage, filePath)

    // 파일 삭제
    await deleteObject(fileRef)
  } catch (error: any) {
    console.error('프로필 이미지 삭제 실패:', error)
    throw new Error('이미지 삭제에 실패했습니다.')
  }
}

/**
 * 이미지 파일을 Base64 데이터 URL로 변환 (미리보기용)
 */
export const readImageAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('파일을 읽을 수 없습니다.'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 게시글 이미지 업로드
 * @param postId 게시글 ID
 * @param file 업로드할 이미지 파일
 * @returns 업로드된 이미지의 다운로드 URL
 */
export const uploadPostImage = async (
  postId: string,
  file: File
): Promise<string> => {
  try {
    // 파일 유효성 검사
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 파일명 생성 (postId_timestamp_random.extension)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `${postId}_${timestamp}_${random}.${extension}`

    // Storage 경로: post-images/{postId}/{fileName}
    const storageRef = ref(storage, `post-images/${postId}/${fileName}`)

    // 파일 업로드
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
    })

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(uploadResult.ref)

    return downloadURL
  } catch (error: any) {
    console.error('게시글 이미지 업로드 실패:', error)
    throw new Error(error.message || '이미지 업로드에 실패했습니다.')
  }
}

/**
 * 게시글 이미지 삭제
 * @param imageURL 삭제할 이미지 URL
 */
export const deletePostImage = async (imageURL: string): Promise<void> => {
  try {
    // Storage URL에서 파일 경로 추출
    const url = new URL(imageURL)
    const pathMatch = url.pathname.match(/\/o\/(.+)/)
    
    if (!pathMatch) {
      throw new Error('유효하지 않은 이미지 URL입니다.')
    }

    const filePath = decodeURIComponent(pathMatch[1])
    const fileRef = ref(storage, filePath)

    // 파일 삭제
    await deleteObject(fileRef)
  } catch (error: any) {
    console.error('게시글 이미지 삭제 실패:', error)
    throw new Error('이미지 삭제에 실패했습니다.')
  }
}

/**
 * 여러 게시글 이미지 삭제
 * @param imageURLs 삭제할 이미지 URL 배열
 */
export const deletePostImages = async (imageURLs: string[]): Promise<void> => {
  try {
    await Promise.all(imageURLs.map(url => deletePostImage(url)))
  } catch (error: any) {
    console.error('게시글 이미지 일괄 삭제 실패:', error)
    throw new Error('이미지 삭제에 실패했습니다.')
  }
}

