# Firestore 데이터베이스 구조 설계

## 1. 개요

Cloud Firestore는 NoSQL 문서 기반 데이터베이스로, 컬렉션과 문서의 계층 구조를 사용합니다.

---

## 2. 데이터베이스 구조

### 2.1 전체 구조 개요

```
firestore/
├── users/                    # 사용자 컬렉션
│   └── {userId}/            # 사용자 문서
│
├── posts/                    # 게시글 컬렉션
│   └── {postId}/            # 게시글 문서
│       └── comments/        # 댓글 서브컬렉션
│           └── {commentId}/ # 댓글 문서
│
├── likes/                    # 좋아요 컬렉션
│   └── {likeId}/            # 좋아요 문서
│
└── bookmarks/                # 북마크 컬렉션
    └── {bookmarkId}/        # 북마크 문서
```

---

## 3. 컬렉션별 상세 설계

### 3.1 users 컬렉션

**경로:** `users/{userId}`

**용도:** 사용자 프로필 정보 저장

**문서 구조:**
```typescript
interface User {
  uid: string;                    // Firebase Auth UID (문서 ID와 동일)
  email: string;                  // 이메일
  displayName: string;            // 닉네임
  photoURL: string | null;        // 프로필 이미지 URL (Storage)
  bio?: string;                   // 자기소개
  createdAt: Timestamp;           // 가입일
  updatedAt: Timestamp;           // 수정일
  
  // 통계
  postCount: number;              // 작성한 게시글 수
  likeCount: number;              // 받은 좋아요 수
  
  // 메타데이터
  provider: 'email' | 'google';   // 로그인 방식
  isActive: boolean;              // 활성 상태
}
```

**예시:**
```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "displayName": "홍길동",
  "photoURL": "https://storage.googleapis.com/...",
  "bio": "AI에 관심이 많은 개발자입니다.",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "postCount": 5,
  "likeCount": 42,
  "provider": "google",
  "isActive": true
}
```

**인덱스:**
- `displayName` (ASC) - 사용자 검색
- `createdAt` (DESC) - 신규 가입자 조회

---

### 3.2 posts 컬렉션

**경로:** `posts/{postId}`

**용도:** 게시글 정보 저장

**문서 구조:**
```typescript
interface Post {
  id: string;                     // 게시글 ID (문서 ID)
  title: string;                  // 제목
  content: string;                // 내용 (마크다운 지원)
  
  // 작성자 정보
  authorId: string;               // 작성자 UID
  authorName: string;             // 작성자 닉네임 (비정규화)
  authorPhotoURL: string | null;  // 작성자 프로필 이미지 (비정규화)
  
  // 메타데이터
  createdAt: Timestamp;           // 작성일
  updatedAt: Timestamp;           // 수정일
  
  // 통계
  likeCount: number;              // 좋아요 수
  commentCount: number;           // 댓글 수
  bookmarkCount: number;          // 북마크 수
  viewCount: number;              // 조회수
  
  // 태그 및 카테고리
  tags?: string[];                // 태그 배열
  category?: string;              // 카테고리
  
  // 상태
  isPublished: boolean;           // 공개 여부
  isDeleted: boolean;             // 삭제 여부 (소프트 삭제)
}
```

**예시:**
```json
{
  "id": "post_123",
  "title": "ChatGPT 활용법",
  "content": "## ChatGPT란?\n\n인공지능...",
  "authorId": "abc123",
  "authorName": "홍길동",
  "authorPhotoURL": "https://storage.googleapis.com/...",
  "createdAt": "2024-01-10T14:30:00Z",
  "updatedAt": "2024-01-10T14:30:00Z",
  "likeCount": 15,
  "commentCount": 3,
  "bookmarkCount": 8,
  "viewCount": 120,
  "tags": ["ChatGPT", "AI", "프롬프트"],
  "category": "AI 도구",
  "isPublished": true,
  "isDeleted": false
}
```

**인덱스:**
- `createdAt` (DESC) - 최신순 정렬
- `likeCount` (DESC), `createdAt` (DESC) - 인기순 정렬
- `authorId` (ASC), `createdAt` (DESC) - 작성자별 게시글
- `tags` (ARRAY), `createdAt` (DESC) - 태그별 게시글
- `isPublished` (ASC), `isDeleted` (ASC), `createdAt` (DESC) - 공개 게시글

---

### 3.3 comments 서브컬렉션

**경로:** `posts/{postId}/comments/{commentId}`

**용도:** 게시글별 댓글 저장

**문서 구조:**
```typescript
interface Comment {
  id: string;                     // 댓글 ID (문서 ID)
  postId: string;                 // 게시글 ID
  content: string;                // 댓글 내용
  
  // 작성자 정보
  authorId: string;               // 작성자 UID
  authorName: string;             // 작성자 닉네임 (비정규화)
  authorPhotoURL: string | null;  // 작성자 프로필 이미지 (비정규화)
  
  // 메타데이터
  createdAt: Timestamp;           // 작성일
  updatedAt: Timestamp;           // 수정일
  
  // 상태
  isDeleted: boolean;             // 삭제 여부
}
```

**예시:**
```json
{
  "id": "comment_456",
  "postId": "post_123",
  "content": "유용한 정보 감사합니다!",
  "authorId": "def456",
  "authorName": "김철수",
  "authorPhotoURL": "https://storage.googleapis.com/...",
  "createdAt": "2024-01-10T15:00:00Z",
  "updatedAt": "2024-01-10T15:00:00Z",
  "isDeleted": false
}
```

**인덱스:**
- `createdAt` (ASC) - 시간순 정렬
- `authorId` (ASC), `createdAt` (DESC) - 작성자별 댓글

**서브컬렉션 사용 이유:**
- 게시글과 댓글의 명확한 계층 구조
- 게시글 삭제 시 댓글도 함께 삭제 가능
- 게시글별 댓글 쿼리 최적화

---

### 3.4 likes 컬렉션

**경로:** `likes/{likeId}`

**용도:** 좋아요 기록 저장 (중복 방지)

**문서 ID 형식:** `{userId}_{postId}` (복합 키)

**문서 구조:**
```typescript
interface Like {
  id: string;                     // 좋아요 ID (문서 ID)
  userId: string;                 // 사용자 UID
  postId: string;                 // 게시글 ID
  createdAt: Timestamp;           // 좋아요 누른 시간
}
```

**예시:**
```json
{
  "id": "abc123_post_123",
  "userId": "abc123",
  "postId": "post_123",
  "createdAt": "2024-01-10T16:00:00Z"
}
```

**인덱스:**
- `userId` (ASC), `createdAt` (DESC) - 사용자별 좋아요 목록
- `postId` (ASC), `createdAt` (DESC) - 게시글별 좋아요 목록

**좋아요 로직:**
1. 좋아요 추가: 문서 생성 + `posts/{postId}`의 `likeCount` 증가
2. 좋아요 취소: 문서 삭제 + `posts/{postId}`의 `likeCount` 감소
3. 중복 방지: 문서 ID가 `{userId}_{postId}` 형태로 고유

---

### 3.5 bookmarks 컬렉션

**경로:** `bookmarks/{bookmarkId}`

**용도:** 북마크 기록 저장

**문서 ID 형식:** `{userId}_{postId}` (복합 키)

**문서 구조:**
```typescript
interface Bookmark {
  id: string;                     // 북마크 ID (문서 ID)
  userId: string;                 // 사용자 UID
  postId: string;                 // 게시글 ID
  createdAt: Timestamp;           // 북마크한 시간
  
  // 비정규화 (북마크 목록 표시용)
  postTitle: string;              // 게시글 제목
  postAuthorName: string;         // 게시글 작성자
}
```

**예시:**
```json
{
  "id": "abc123_post_123",
  "userId": "abc123",
  "postId": "post_123",
  "createdAt": "2024-01-10T17:00:00Z",
  "postTitle": "ChatGPT 활용법",
  "postAuthorName": "홍길동"
}
```

**인덱스:**
- `userId` (ASC), `createdAt` (DESC) - 사용자별 북마크 목록
- `postId` (ASC) - 게시글별 북마크 수 조회

---

## 4. 데이터 비정규화 전략

### 4.1 비정규화하는 데이터

**posts 컬렉션:**
- `authorName`, `authorPhotoURL` - 게시글 목록에서 작성자 정보 표시

**comments 서브컬렉션:**
- `authorName`, `authorPhotoURL` - 댓글에서 작성자 정보 표시

**bookmarks 컬렉션:**
- `postTitle`, `postAuthorName` - 북마크 목록에서 게시글 정보 표시

### 4.2 비정규화 이유

- **읽기 성능 향상**: JOIN이 없으므로 단일 쿼리로 필요한 정보 조회
- **비용 절감**: Firestore는 읽기 횟수로 과금
- **실시간 업데이트**: 중첩 쿼리 없이 즉시 데이터 표시

### 4.3 비정규화 업데이트 전략

사용자 프로필 변경 시:
1. `users/{userId}` 업데이트
2. 해당 사용자의 모든 게시글 업데이트 (Batch Write)
3. 해당 사용자의 모든 댓글 업데이트 (Batch Write)

---

## 5. 쿼리 예시

### 5.1 게시글 목록 (최신순, 페이지네이션)

```typescript
const q = query(
  collection(db, 'posts'),
  where('isPublished', '==', true),
  where('isDeleted', '==', false),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### 5.2 게시글 목록 (인기순)

```typescript
const q = query(
  collection(db, 'posts'),
  where('isPublished', '==', true),
  where('isDeleted', '==', false),
  orderBy('likeCount', 'desc'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### 5.3 특정 사용자의 게시글

```typescript
const q = query(
  collection(db, 'posts'),
  where('authorId', '==', userId),
  where('isDeleted', '==', false),
  orderBy('createdAt', 'desc')
);
```

### 5.4 특정 게시글의 댓글 (실시간)

```typescript
const q = query(
  collection(db, `posts/${postId}/comments`),
  where('isDeleted', '==', false),
  orderBy('createdAt', 'asc')
);

// 실시간 리스너
const unsubscribe = onSnapshot(q, (snapshot) => {
  const comments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  // 댓글 업데이트
});
```

### 5.5 사용자가 좋아요한 게시글 확인

```typescript
const likeId = `${userId}_${postId}`;
const likeRef = doc(db, 'likes', likeId);
const likeSnap = await getDoc(likeRef);
const isLiked = likeSnap.exists();
```

### 5.6 사용자의 북마크 목록

```typescript
const q = query(
  collection(db, 'bookmarks'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
);
```

---

## 6. 트랜잭션 및 배치 작업

### 6.1 좋아요 추가 (트랜잭션)

```typescript
const likePost = async (userId: string, postId: string) => {
  const likeId = `${userId}_${postId}`;
  const likeRef = doc(db, 'likes', likeId);
  const postRef = doc(db, 'posts', postId);
  
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error('Post not found');
    
    const newLikeCount = (postDoc.data().likeCount || 0) + 1;
    
    transaction.set(likeRef, {
      id: likeId,
      userId,
      postId,
      createdAt: serverTimestamp()
    });
    
    transaction.update(postRef, {
      likeCount: newLikeCount
    });
  });
};
```

### 6.2 게시글 작성 (배치)

```typescript
const createPost = async (userId: string, postData: Partial<Post>) => {
  const batch = writeBatch(db);
  
  const postRef = doc(collection(db, 'posts'));
  const userRef = doc(db, 'users', userId);
  
  batch.set(postRef, {
    ...postData,
    id: postRef.id,
    authorId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
    bookmarkCount: 0,
    viewCount: 0,
    isPublished: true,
    isDeleted: false
  });
  
  batch.update(userRef, {
    postCount: increment(1)
  });
  
  await batch.commit();
  return postRef.id;
};
```

### 6.3 댓글 작성 (트랜잭션)

```typescript
const createComment = async (
  postId: string,
  userId: string,
  content: string
) => {
  const commentRef = doc(collection(db, `posts/${postId}/comments`));
  const postRef = doc(db, 'posts', postId);
  
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error('Post not found');
    
    const newCommentCount = (postDoc.data().commentCount || 0) + 1;
    
    transaction.set(commentRef, {
      id: commentRef.id,
      postId,
      content,
      authorId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false
    });
    
    transaction.update(postRef, {
      commentCount: newCommentCount
    });
  });
};
```

---

## 7. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 헬퍼 함수
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // users 컬렉션
    match /users/{userId} {
      allow read: if true;  // 모든 사용자 프로필 읽기 가능
      allow create: if isOwner(userId);  // 본인 프로필만 생성
      allow update: if isOwner(userId);  // 본인 프로필만 수정
      allow delete: if false;  // 삭제 불가
    }
    
    // posts 컬렉션
    match /posts/{postId} {
      allow read: if resource.data.isPublished == true && 
                     resource.data.isDeleted == false;
      allow create: if isSignedIn() && 
                       request.resource.data.authorId == request.auth.uid;
      allow update: if isOwner(resource.data.authorId);
      allow delete: if isOwner(resource.data.authorId);
      
      // comments 서브컬렉션
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isSignedIn() && 
                         request.resource.data.authorId == request.auth.uid;
        allow update: if isOwner(resource.data.authorId);
        allow delete: if isOwner(resource.data.authorId);
      }
    }
    
    // likes 컬렉션
    match /likes/{likeId} {
      allow read: if true;
      allow create: if isSignedIn() && 
                       likeId == request.auth.uid + '_' + request.resource.data.postId;
      allow delete: if isSignedIn() && 
                       likeId.matches(request.auth.uid + '_.*');
    }
    
    // bookmarks 컬렉션
    match /bookmarks/{bookmarkId} {
      allow read: if isSignedIn() && 
                     resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && 
                       bookmarkId == request.auth.uid + '_' + request.resource.data.postId;
      allow delete: if isSignedIn() && 
                       bookmarkId.matches(request.auth.uid + '_.*');
    }
  }
}
```

---

## 8. 인덱스 설정

Firebase Console에서 생성해야 할 복합 인덱스:

```
컬렉션: posts
- isPublished (ASC) + isDeleted (ASC) + createdAt (DESC)
- isPublished (ASC) + isDeleted (ASC) + likeCount (DESC) + createdAt (DESC)
- authorId (ASC) + isDeleted (ASC) + createdAt (DESC)
- tags (ARRAY) + isPublished (ASC) + createdAt (DESC)

컬렉션: likes
- userId (ASC) + createdAt (DESC)
- postId (ASC) + createdAt (DESC)

컬렉션: bookmarks
- userId (ASC) + createdAt (DESC)
```

---

## 9. 데이터 마이그레이션 고려사항

### 9.1 프로필 사진 변경 시

```typescript
const updateUserProfile = async (
  userId: string,
  displayName: string,
  photoURL: string
) => {
  const batch = writeBatch(db);
  
  // 1. 사용자 프로필 업데이트
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, { displayName, photoURL, updatedAt: serverTimestamp() });
  
  // 2. 모든 게시글 업데이트
  const postsQuery = query(
    collection(db, 'posts'),
    where('authorId', '==', userId)
  );
  const postsDocs = await getDocs(postsQuery);
  postsDocs.forEach(postDoc => {
    batch.update(postDoc.ref, {
      authorName: displayName,
      authorPhotoURL: photoURL
    });
  });
  
  // 3. 모든 댓글 업데이트 (주의: 서브컬렉션은 별도 처리 필요)
  // Cloud Functions 사용 권장
  
  await batch.commit();
};
```

### 9.2 게시글 삭제 (소프트 삭제)

```typescript
const deletePost = async (postId: string, userId: string) => {
  const postRef = doc(db, 'posts', postId);
  
  await updateDoc(postRef, {
    isDeleted: true,
    updatedAt: serverTimestamp()
  });
  
  // 댓글은 유지 (서브컬렉션)
  // 필요시 Cloud Functions로 cascade 삭제
};
```

---

## 10. 성능 최적화 팁

1. **페이지네이션 사용**: `limit()` + `startAfter()`
2. **필요한 필드만 조회**: `select()` (클라이언트에서는 불가능, Functions에서만)
3. **캐싱 활용**: React Query로 클라이언트 캐싱
4. **오프라인 지원**: Firestore의 기본 오프라인 캐시 활용
5. **배치 작업**: 여러 업데이트를 하나의 배치로 처리
6. **비정규화**: 읽기가 많은 데이터는 비정규화하여 JOIN 방지

---

## 11. 비용 최적화

- 읽기 횟수 최소화 (캐싱, 페이지네이션)
- 불필요한 실시간 리스너 제거
- 문서 크기 최적화 (1MB 제한)
- 인덱스 최소화 (필요한 것만)

