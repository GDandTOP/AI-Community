# 게시글 좋아요 및 북마크 기능 가이드

Firebase Firestore를 활용한 게시글 좋아요 및 북마크 기능 구현 가이드입니다.

## 📊 데이터 모델

### 1. postLikes 컬렉션 (좋아요)

```typescript
interface PostLike {
  id: string           // 문서 ID: {userId}_{postId}
  userId: string       // 좋아요를 누른 사용자 ID
  postId: string       // 게시글 ID
  createdAt: Timestamp // 생성 시간
}
```

**문서 ID 규칙**: `{userId}_{postId}`
- 예: `user123_post456`
- 중복 좋아요 방지 (자동으로 유니크 키 역할)

### 2. bookmarks 컬렉션 (북마크)

```typescript
interface Bookmark {
  id: string           // 문서 ID: {userId}_{postId}
  userId: string       // 북마크한 사용자 ID
  postId: string       // 게시글 ID
  createdAt: Timestamp // 생성 시간
}
```

**문서 ID 규칙**: `{userId}_{postId}`
- 예: `user123_post456`
- 중복 북마크 방지

## 🔧 구현된 기능

### 백엔드 서비스

#### like.service.ts

**주요 함수:**
```typescript
// 좋아요 추가
addLike(userId: string, postId: string): Promise<void>

// 좋아요 삭제
removeLike(userId: string, postId: string): Promise<void>

// 좋아요 토글 (추가/삭제)
toggleLike(userId: string, postId: string): Promise<boolean>

// 좋아요 상태 확인
checkLikeStatus(userId: string, postId: string): Promise<boolean>

// 사용자가 좋아요한 게시글 ID 목록
getUserLikedPostIds(userId: string): Promise<string[]>

// 게시글의 좋아요 수
getPostLikeCount(postId: string): Promise<number>
```

#### bookmark.service.ts

**주요 함수:**
```typescript
// 북마크 추가
addBookmark(userId: string, postId: string): Promise<void>

// 북마크 삭제
removeBookmark(userId: string, postId: string): Promise<void>

// 북마크 토글 (추가/삭제)
toggleBookmark(userId: string, postId: string): Promise<boolean>

// 북마크 상태 확인
checkBookmarkStatus(userId: string, postId: string): Promise<boolean>

// 사용자가 북마크한 게시글 ID 목록
getUserBookmarkedPostIds(userId: string): Promise<string[]>

// 사용자가 북마크한 게시글 목록 (상세 정보)
getUserBookmarkedPosts(userId: string): Promise<Post[]>

// 게시글의 북마크 수
getPostBookmarkCount(postId: string): Promise<number>
```

## 🎨 UI 구현

### PostDetail.tsx

**구현 내용:**
- ❤️ 좋아요 버튼: 클릭 시 토글
- 🔖 북마크 버튼: 클릭 시 토글
- 낙관적 UI 업데이트 (즉시 반영)
- 실패 시 자동 롤백
- 로그인 필요 안내

**UI 상태:**
- 좋아요 상태: 빨간색 하트 (채워짐)
- 북마크 상태: 파란색 북마크 (채워짐)
- 비활성화: 로그인하지 않은 경우

### Home.tsx

현재는 좋아요/북마크 수만 표시되며, 클릭 기능은 PostDetail에서만 구현되어 있습니다.

## 🔐 Firestore 보안 규칙

```javascript
// postLikes 컬렉션
match /postLikes/{likeId} {
  allow read: if true;  // 모든 사용자가 읽기 가능
  allow create: if isSignedIn() && 
                   request.resource.data.userId == request.auth.uid &&
                   likeId == request.auth.uid + '_' + request.resource.data.postId;
  allow delete: if isSignedIn() && 
                   likeId.matches(request.auth.uid + '_.*');
}

// bookmarks 컬렉션
match /bookmarks/{bookmarkId} {
  allow read: if isSignedIn();  // 로그인한 사용자만 읽기 가능
  allow create: if isSignedIn() && 
                   request.resource.data.userId == request.auth.uid &&
                   bookmarkId == request.auth.uid + '_' + request.resource.data.postId;
  allow delete: if isSignedIn() && 
                   bookmarkId.matches(request.auth.uid + '_.*');
}
```

**보안 규칙 배포:**
```bash
firebase deploy --only firestore:rules
```

## 📱 새로운 페이지 및 기능

### Bookmarks 페이지 (`src/pages/Bookmarks.tsx`)

**주요 기능:**
- 북마크한 게시글 목록 조회
- X 버튼으로 북마크 제거
- 빈 상태 처리 (북마크가 없을 때)
- 게시글 클릭 시 상세 페이지로 이동

**접근 방법:**
1. Header의 북마크 아이콘 클릭
2. 직접 URL 입력: `/bookmarks`

### Home 페이지 개선 (`src/pages/Home.tsx`)

**추가된 기능:**
- 각 게시글 카드에서 좋아요/북마크 직접 토글
- 좋아요/북마크 상태 실시간 표시
- 로그인하지 않은 사용자는 클릭 시 로그인 페이지로 이동
- 낙관적 UI 업데이트로 빠른 반응 속도

**개선 사항:**
- 좋아요한 게시글: 빨간색 채워진 하트
- 북마크한 게시글: 파란색 채워진 북마크
- 처리 중 중복 클릭 방지

### PostDetail 페이지 개선

**실시간 업데이트 추가:**
- 좋아요 수 실시간 업데이트
- 북마크 수 실시간 업데이트
- 다른 사용자의 액션 즉시 반영

## 💡 주요 기술

### 1. Transaction 사용

좋아요/북마크 추가/삭제 시 게시글의 카운트도 함께 업데이트하기 위해 Transaction을 사용합니다.

```typescript
await runTransaction(db, async (transaction) => {
  // 1. 데이터 확인
  const likeDoc = await transaction.get(likeRef)
  const postDoc = await transaction.get(postRef)
  
  // 2. 좋아요 추가
  transaction.set(likeRef, { ... })
  
  // 3. 게시글의 좋아요 수 증가
  transaction.update(postRef, {
    likeCount: currentLikeCount + 1
  })
})
```

### 2. 낙관적 UI 업데이트

사용자 경험을 위해 즉시 UI를 업데이트하고, 실패 시 롤백합니다.

```typescript
// 즉시 UI 업데이트
setIsLiked(!isLiked)
setPost(prev => ({ ...prev, likeCount: prev.likeCount + 1 }))

try {
  // 실제 데이터 업데이트
  await toggleLike(userId, postId)
} catch (error) {
  // 실패 시 롤백
  setIsLiked(isLiked)
  setPost(prev => ({ ...prev, likeCount: prev.likeCount - 1 }))
}
```

### 3. 복합 키 패턴

`{userId}_{postId}` 형식의 문서 ID를 사용하여:
- 중복 방지
- 빠른 조회
- 간단한 삭제

### 4. 실시간 업데이트 (onSnapshot)

Firestore의 `onSnapshot`을 사용하여 실시간으로 데이터 변경사항을 반영합니다.

```typescript
// 좋아요 수 실시간 구독
export const subscribeToPostLikes = (
  postId: string,
  callback: (likeCount: number) => void
): Unsubscribe => {
  const postRef = doc(db, 'posts', postId)
  
  return onSnapshot(postRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      callback(data.likeCount || 0)
    }
  })
}

// 컴포넌트에서 사용
useEffect(() => {
  const unsubscribe = subscribeToPostLikes(postId, (likeCount) => {
    setPost(prev => prev ? { ...prev, likeCount } : prev)
  })
  
  return () => unsubscribe() // 클린업
}, [postId])
```

**장점:**
- 다른 사용자의 좋아요/북마크 즉시 반영
- 주기적인 polling 불필요
- 서버 부하 감소
- 실시간 협업 가능

### 5. 중복 처리 방지

`processingIds` Set을 사용하여 동일한 게시글에 대한 중복 클릭을 방지합니다.

```typescript
const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

const handleLikeToggle = async (postId: string) => {
  if (processingIds.has(postId)) return // 중복 방지
  
  setProcessingIds(prev => new Set(prev).add(postId))
  try {
    await toggleLike(userId, postId)
  } finally {
    setProcessingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(postId)
      return newSet
    })
  }
}
```

## 📈 사용 예시

### 1. Home 페이지에서 좋아요 토글

```typescript
import { toggleLike, getUserLikedPostIds } from '@/services/like.service'

// 초기 로드 시 사용자의 좋아요 상태 가져오기
useEffect(() => {
  if (currentUser) {
    const likedIds = await getUserLikedPostIds(currentUser.uid)
    setLikedPostIds(new Set(likedIds))
  }
}, [currentUser])

// 좋아요 토글 (낙관적 UI 업데이트)
const handleLikeToggle = async (e, postId) => {
  e.preventDefault()
  e.stopPropagation()
  
  // 즉시 UI 업데이트
  setLikedPostIds(prev => {
    const newSet = new Set(prev)
    if (newSet.has(postId)) {
      newSet.delete(postId)
    } else {
      newSet.add(postId)
    }
    return newSet
  })
  
  // 실제 데이터 업데이트
  await toggleLike(userId, postId)
}
```

### 2. 북마크 페이지에서 목록 조회

```typescript
import { getUserBookmarkedPosts } from '@/services/bookmark.service'

// 북마크한 게시글 목록 가져오기
const loadBookmarks = async () => {
  const bookmarkedPosts = await getUserBookmarkedPosts(userId)
  setPosts(bookmarkedPosts)
}

// 북마크 제거
const handleRemoveBookmark = async (postId) => {
  await toggleBookmark(userId, postId)
  // 목록에서 제거
  setPosts(prev => prev.filter(post => post.id !== postId))
}
```

### 3. PostDetail에서 실시간 업데이트

```typescript
import { subscribeToPostLikes, subscribeToPostBookmarks } from '@/services/like.service'

// 실시간 좋아요/북마크 수 구독
useEffect(() => {
  const unsubscribeLikes = subscribeToPostLikes(postId, (likeCount) => {
    setPost(prev => prev ? { ...prev, likeCount } : prev)
  })

  const unsubscribeBookmarks = subscribeToPostBookmarks(postId, (bookmarkCount) => {
    setPost(prev => prev ? { ...prev, bookmarkCount } : prev)
  })

  return () => {
    unsubscribeLikes()
    unsubscribeBookmarks()
  }
}, [postId])
```

## 🎉 추가 구현된 기능들

### 1. 북마크 페이지 (`/bookmarks`)
✅ **완료**
- 사용자가 북마크한 게시글 목록 표시
- 북마크 제거 기능 (X 버튼)
- 빈 상태 처리
- 로그인 필요 안내

**사용 방법:**
- Header의 북마크 아이콘 클릭
- `/bookmarks` URL로 직접 이동

### 2. Home 페이지 개선
✅ **완료**
- 각 게시글 카드에서 좋아요/북마크 토글 가능
- 사용자의 좋아요/북마크 상태 표시
- 낙관적 UI 업데이트로 빠른 반응
- 로그인하지 않은 경우 로그인 페이지로 이동

**UI 특징:**
- 좋아요: 빨간색 채워진 하트 ❤️
- 북마크: 파란색 채워진 북마크 📑
- 댓글: 클릭 불가 (표시만)

### 3. 실시간 업데이트
✅ **완료**
- `onSnapshot`을 사용한 실시간 좋아요 수 업데이트
- 다른 사용자의 좋아요/북마크 즉시 반영
- PostDetail 페이지에서 실시간 카운트 업데이트

**작동 방식:**
- 다른 사용자가 좋아요/북마크를 누르면 자동으로 숫자 업데이트
- 게시글을 열어두고 있으면 실시간으로 변경사항 확인 가능

## 🚀 향후 구현 가능한 기능들

1. **좋아요한 게시글 페이지**
   - `/liked-posts` 라우트 생성
   - 좋아요한 게시글 목록 표시

2. **통계 기능**
   - 가장 많이 좋아요받은 게시글
   - 가장 많이 북마크된 게시글
   - 사용자별 좋아요/북마크 통계

3. **알림 기능**
   - 내 게시글에 좋아요가 달렸을 때 알림
   - 특정 게시글의 댓글 알림

## 🔍 트러블슈팅

### 좋아요/북마크가 작동하지 않을 때

1. **Firestore 규칙 확인**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **콘솔 에러 확인**
   - 브라우저 개발자 도구 > Console
   - 에러 메시지 확인

3. **인증 상태 확인**
   - 로그인되어 있는지 확인
   - `currentUser`가 null이 아닌지 확인

4. **네트워크 요청 확인**
   - Network 탭에서 Firestore 요청 확인
   - 400/403 에러가 있는지 확인

### 실시간 업데이트가 작동하지 않을 때

1. **onSnapshot 구독 확인**
   - useEffect의 cleanup 함수가 제대로 호출되는지 확인
   - 컴포넌트 unmount 시 unsubscribe 호출 확인

2. **Firestore 읽기 권한 확인**
   - postLikes: 모든 사용자 읽기 가능
   - bookmarks: 로그인한 사용자만 읽기 가능

3. **메모리 누수 방지**
   ```typescript
   useEffect(() => {
     const unsubscribe = subscribeToPostLikes(postId, callback)
     return () => unsubscribe() // 반드시 cleanup
   }, [postId])
   ```

### Home 페이지에서 상태가 동기화되지 않을 때

1. **초기 로드 확인**
   - `getUserLikedPostIds`가 제대로 호출되는지 확인
   - Set 데이터 구조가 올바르게 사용되는지 확인

2. **이벤트 전파 방지**
   ```typescript
   const handleLikeToggle = async (e, postId) => {
     e.preventDefault()  // Link 이동 방지
     e.stopPropagation() // 이벤트 전파 방지
     // ...
   }
   ```

3. **중복 처리 확인**
   - `processingIds`에 postId가 추가/제거되는지 확인
   - 버튼 disabled 상태 확인

## 📝 참고 사항

### 기본 사항
- 좋아요/북마크는 로그인한 사용자만 가능합니다.
- 중복 좋아요/북마크는 자동으로 방지됩니다.
- 게시글 삭제 시 관련 좋아요/북마크도 함께 처리해야 합니다 (향후 구현).

### 성능 최적화
- **낙관적 UI 업데이트**: 즉시 UI를 업데이트하고 백그라운드에서 Firebase 처리
- **중복 클릭 방지**: `processingIds` Set으로 동시 처리 방지
- **실시간 구독**: polling 대신 `onSnapshot` 사용으로 서버 부하 감소
- **Cleanup 함수**: useEffect cleanup으로 메모리 누수 방지

### 확장성 고려사항
- **대규모 서비스**: 카운터 샤딩(Counter Sharding) 고려
- **읽기 최적화**: 자주 접근하는 데이터는 캐싱 고려
- **Firestore 비용**: 실시간 리스너 사용 시 읽기 비용 모니터링 필요

### 추가 개선 아이디어
1. **좋아요/북마크 애니메이션**
   - 하트가 커지면서 사라지는 애니메이션
   - 북마크 추가 시 bounce 효과

2. **통계 대시보드**
   - 내가 좋아요/북마크한 게시글 통계
   - 인기 게시글 순위

3. **소셜 기능**
   - 누가 좋아요를 눌렀는지 확인
   - 좋아요 기반 추천 시스템

4. **알림 시스템**
   - 내 게시글에 좋아요가 달렸을 때 알림
   - 북마크한 게시글에 새 댓글이 달렸을 때 알림

