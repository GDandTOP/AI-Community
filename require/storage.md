# Firebase Storage 구조 설계

## 1. 개요

Firebase Storage는 사용자 생성 컨텐츠(이미지, 동영상 등)를 저장하는 Google Cloud Storage 기반 파일 저장 서비스입니다.

---

## 2. 프로젝트에서의 사용 목적

### 2.1 저장할 파일 종류
- **프로필 이미지**: 사용자 프로필 사진
- **게시글 이미지** (선택): 게시글 내 이미지 첨부

---

## 3. Storage 폴더 구조

```
gs://{project-id}.appspot.com/
├── profiles/                    # 프로필 이미지
│   ├── {userId}/
│   │   └── avatar.jpg          # 프로필 이미지 (고정 파일명)
│   │   └── avatar_thumb.jpg    # 썸네일 (선택)
│
└── posts/                       # 게시글 이미지 (선택)
    └── {postId}/
        ├── image_1.jpg
        ├── image_2.jpg
        └── ...
```

---

## 4. 상세 설계

### 4.1 프로필 이미지

**경로 규칙:**
```
profiles/{userId}/avatar.{extension}
```

**예시:**
```
profiles/abc123/avatar.jpg
profiles/def456/avatar.png
```

**파일 규칙:**
- 허용 확장자: `.jpg`, `.jpeg`, `.png`, `.webp`
- 최대 크기: 5MB
- 권장 해상도: 500x500px

**메타데이터:**
```typescript
interface ProfileImageMetadata {
  contentType: string;           // 'image/jpeg', 'image/png' 등
  customMetadata: {
    userId: string;              // 업로드한 사용자 ID
    uploadedAt: string;          // ISO 8601 형식
    originalName: string;        // 원본 파일명
  };
}
```

---

### 4.2 게시글 이미지 (선택 기능)

**경로 규칙:**
```
posts/{postId}/{imageId}.{extension}
```

**예시:**
```
posts/post_123/img_1.jpg
posts/post_123/img_2.jpg
```

**파일 규칙:**
- 허용 확장자: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- 최대 크기: 10MB
- 최대 개수: 게시글당 5개

---

## 5. 주요 기능 구현

### 5.1 프로필 이미지 업로드

```typescript
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { storage } from './firebase';

const uploadProfileImage = async (
  userId: string,
  file: File
): Promise<string> => {
  // 1. 파일 검증
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    throw new Error('파일 크기는 5MB 이하여야 합니다.');
  }
  
  // 2. 파일 확장자 추출
  const extension = file.name.split('.').pop();
  
  // 3. Storage 참조 생성
  const storageRef = ref(storage, `profiles/${userId}/avatar.${extension}`);
  
  // 4. 메타데이터 설정
  const metadata = {
    contentType: file.type,
    customMetadata: {
      userId,
      uploadedAt: new Date().toISOString(),
      originalName: file.name
    }
  };
  
  // 5. 업로드
  const snapshot = await uploadBytes(storageRef, file, metadata);
  
  // 6. 다운로드 URL 가져오기
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // 7. Firestore 사용자 프로필 업데이트
  await updateUserProfile(userId, { photoURL: downloadURL });
  
  return downloadURL;
};
```

---

### 5.2 이미지 리사이징 (클라이언트)

```typescript
const resizeImage = (
  file: File,
  maxWidth: number = 500,
  maxHeight: number = 500
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // 비율 유지하며 리사이징
      if (width > height) {
        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 리사이징 실패'));
          }
        },
        'image/jpeg',
        0.9
      );
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// 사용 예시
const uploadResizedImage = async (userId: string, file: File) => {
  const resizedBlob = await resizeImage(file);
  const resizedFile = new File([resizedBlob], file.name, {
    type: 'image/jpeg'
  });
  
  return uploadProfileImage(userId, resizedFile);
};
```

---

### 5.3 이전 프로필 이미지 삭제

```typescript
const deleteOldProfileImage = async (userId: string) => {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  for (const ext of extensions) {
    try {
      const oldImageRef = ref(storage, `profiles/${userId}/avatar.${ext}`);
      await deleteObject(oldImageRef);
      console.log(`삭제됨: avatar.${ext}`);
    } catch (error: any) {
      // 파일이 없으면 에러 무시
      if (error.code !== 'storage/object-not-found') {
        console.error(`삭제 실패: avatar.${ext}`, error);
      }
    }
  }
};

// 프로필 이미지 업데이트 시 사용
const updateProfileImage = async (userId: string, newFile: File) => {
  // 1. 이전 이미지 삭제
  await deleteOldProfileImage(userId);
  
  // 2. 새 이미지 업로드
  const downloadURL = await uploadProfileImage(userId, newFile);
  
  return downloadURL;
};
```

---

### 5.4 이미지 다운로드 URL 가져오기

```typescript
const getProfileImageURL = async (userId: string): Promise<string | null> => {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  for (const ext of extensions) {
    try {
      const imageRef = ref(storage, `profiles/${userId}/avatar.${ext}`);
      const url = await getDownloadURL(imageRef);
      return url;
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        console.error('이미지 URL 가져오기 실패:', error);
      }
    }
  }
  
  return null; // 프로필 이미지 없음
};
```

---

### 5.5 업로드 진행률 표시

```typescript
import { uploadBytesResumable } from 'firebase/storage';

const uploadWithProgress = (
  userId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop();
    const storageRef = ref(storage, `profiles/${userId}/avatar.${extension}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // 진행률 계산
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        // 업로드 완료
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

// 사용 예시 (React)
const [uploadProgress, setUploadProgress] = useState(0);

const handleUpload = async (file: File) => {
  try {
    const url = await uploadWithProgress(
      currentUser.uid,
      file,
      (progress) => setUploadProgress(progress)
    );
    console.log('업로드 완료:', url);
  } catch (error) {
    console.error('업로드 실패:', error);
  }
};
```

---

## 6. Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // 헬퍼 함수
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isValidSize(maxSizeMB) {
      return request.resource.size < maxSizeMB * 1024 * 1024;
    }
    
    // 프로필 이미지
    match /profiles/{userId}/{fileName} {
      // 읽기: 모두 가능
      allow read: if true;
      
      // 쓰기: 본인만 가능, 이미지 파일, 5MB 이하
      allow write: if isOwner(userId) && 
                      isImage() && 
                      isValidSize(5);
      
      // 삭제: 본인만 가능
      allow delete: if isOwner(userId);
    }
    
    // 게시글 이미지 (선택)
    match /posts/{postId}/{fileName} {
      // 읽기: 모두 가능
      allow read: if true;
      
      // 쓰기: 로그인한 사용자, 이미지 파일, 10MB 이하
      allow write: if isSignedIn() && 
                      isImage() && 
                      isValidSize(10);
      
      // 삭제: 로그인한 사용자 (게시글 작성자 확인은 Firestore에서)
      allow delete: if isSignedIn();
    }
  }
}
```

---

## 7. 게시글 이미지 업로드 (선택 기능)

### 7.1 여러 이미지 업로드

```typescript
const uploadPostImages = async (
  postId: string,
  files: File[]
): Promise<string[]> => {
  if (files.length > 5) {
    throw new Error('최대 5개까지 업로드 가능합니다.');
  }
  
  const uploadPromises = files.map(async (file, index) => {
    const extension = file.name.split('.').pop();
    const storageRef = ref(
      storage,
      `posts/${postId}/img_${index + 1}.${extension}`
    );
    
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        postId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    return getDownloadURL(storageRef);
  });
  
  return Promise.all(uploadPromises);
};
```

### 7.2 게시글 삭제 시 이미지도 삭제

```typescript
const deletePostImages = async (postId: string) => {
  const postFolderRef = ref(storage, `posts/${postId}`);
  
  try {
    const listResult = await listAll(postFolderRef);
    
    const deletePromises = listResult.items.map((itemRef) =>
      deleteObject(itemRef)
    );
    
    await Promise.all(deletePromises);
    console.log('게시글 이미지 모두 삭제됨');
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
  }
};
```

---

## 8. 이미지 최적화 전략

### 8.1 클라이언트 측 최적화

**업로드 전:**
1. 이미지 리사이징 (Canvas API)
2. WebP 변환 (지원되는 경우)
3. EXIF 데이터 제거

```typescript
const optimizeImage = async (file: File): Promise<File> => {
  // 1. 리사이징
  const resizedBlob = await resizeImage(file, 1200, 1200);
  
  // 2. WebP 변환 (브라우저 지원 확인)
  const supportsWebP = await checkWebPSupport();
  const format = supportsWebP ? 'image/webp' : 'image/jpeg';
  
  // 3. Canvas로 재압축
  const optimizedBlob = await compressImage(resizedBlob, format, 0.85);
  
  return new File([optimizedBlob], file.name, { type: format });
};
```

### 8.2 서버 측 최적화 (Cloud Functions)

```typescript
// Cloud Functions로 업로드된 이미지 자동 리사이징
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sharp from 'sharp';

export const generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath?.startsWith('profiles/')) return;
    
    const bucket = admin.storage().bucket(object.bucket);
    const fileName = filePath.split('/').pop();
    const thumbPath = filePath.replace(fileName!, `thumb_${fileName}`);
    
    // 원본 이미지 다운로드
    const [originalImage] = await bucket.file(filePath).download();
    
    // 썸네일 생성 (150x150)
    const thumbnail = await sharp(originalImage)
      .resize(150, 150, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // 썸네일 업로드
    await bucket.file(thumbPath).save(thumbnail, {
      metadata: {
        contentType: 'image/jpeg'
      }
    });
    
    console.log('썸네일 생성 완료:', thumbPath);
  });
```

---

## 9. 에러 처리

### 9.1 일반적인 에러

```typescript
const handleStorageError = (error: any) => {
  switch (error.code) {
    case 'storage/unauthorized':
      return '권한이 없습니다.';
    case 'storage/canceled':
      return '업로드가 취소되었습니다.';
    case 'storage/unknown':
      return '알 수 없는 오류가 발생했습니다.';
    case 'storage/object-not-found':
      return '파일을 찾을 수 없습니다.';
    case 'storage/quota-exceeded':
      return '저장 공간이 부족합니다.';
    case 'storage/unauthenticated':
      return '로그인이 필요합니다.';
    default:
      return '파일 처리 중 오류가 발생했습니다.';
  }
};

// 사용 예시
try {
  await uploadProfileImage(userId, file);
} catch (error: any) {
  const message = handleStorageError(error);
  alert(message);
}
```

---

## 10. React 컴포넌트 예시

### 10.1 프로필 이미지 업로드 컴포넌트

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

const ProfileImageUpload = ({ userId, currentPhotoURL }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [photoURL, setPhotoURL] = useState(currentPhotoURL);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      // 이미지 최적화
      const optimizedFile = await optimizeImage(file);
      
      // 업로드
      const url = await uploadWithProgress(
        userId,
        optimizedFile,
        setProgress
      );
      
      setPhotoURL(url);
      alert('프로필 이미지가 업데이트되었습니다.');
    } catch (error) {
      console.error(error);
      alert('업로드 실패');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar src={photoURL} alt="프로필" size="xl" />
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="profile-upload"
      />
      
      <label htmlFor="profile-upload">
        <Button as="span" disabled={uploading}>
          {uploading ? `업로드 중... ${progress.toFixed(0)}%` : '이미지 변경'}
        </Button>
      </label>
    </div>
  );
};
```

---

## 11. 성능 및 비용 최적화

### 11.1 CDN 캐싱
- Storage URL은 자동으로 CDN 캐싱됨
- 캐시 유효기간: 1시간 (기본)

### 11.2 압축 및 리사이징
- 클라이언트에서 업로드 전 압축
- Cloud Functions로 자동 썸네일 생성

### 11.3 불필요한 파일 삭제
- 프로필 이미지 변경 시 이전 이미지 삭제
- 게시글 삭제 시 첨부 이미지 삭제

### 11.4 파일 크기 제한
- 프로필 이미지: 5MB
- 게시글 이미지: 10MB

---

## 12. 모니터링 및 관리

### 12.1 Storage 사용량 확인
- Firebase Console > Storage > Usage
- 월별 다운로드/업로드 트래픽 확인

### 12.2 오래된 파일 정리
```typescript
// Cloud Functions - 매일 실행
export const cleanupOldFiles = functions.pubsub
  .schedule('0 0 * * *') // 매일 자정
  .onRun(async () => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'temp/' });
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const [metadata] = await file.getMetadata();
      const createdTime = new Date(metadata.timeCreated).getTime();
      
      if (now - createdTime > dayInMs * 7) { // 7일 이상
        await file.delete();
        console.log('삭제됨:', file.name);
      }
    }
  });
```

---

## 13. 보안 체크리스트

- [x] Storage Rules 설정 (본인만 업로드)
- [x] 파일 타입 검증 (이미지만)
- [x] 파일 크기 제한 (5MB/10MB)
- [x] 인증된 사용자만 업로드
- [x] 민감한 메타데이터 제거
- [x] CORS 설정 (필요시)

---

## 14. 테스트 시나리오

1. **프로필 이미지 업로드**: 다양한 형식(jpg, png) 테스트
2. **파일 크기 제한**: 5MB 초과 파일 업로드 시 에러 확인
3. **권한 확인**: 다른 사용자 프로필 이미지 업로드 시도 (실패해야 함)
4. **이미지 삭제**: 프로필 이미지 변경 시 이전 이미지 삭제 확인
5. **진행률**: 업로드 진행률 표시 확인
6. **오프라인**: 네트워크 연결 없을 때 에러 처리 확인

