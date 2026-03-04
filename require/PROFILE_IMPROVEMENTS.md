# 프로필 페이지 및 Home 페이지 개선 완료

## ✅ 구현 완료 항목

### 1. 🏠 Home 페이지 북마크 활성화 문제 수정

**파일:** `src/pages/Home.tsx`

**문제:**
- 북마크를 누른 게시글이 파란색으로 활성화되지 않음
- 숫자는 정확하지만 UI 상태가 반영되지 않음

**원인:**
- 게시글이 로드된 후 사용자의 좋아요/북마크 상태가 제대로 동기화되지 않음
- `useEffect` 의존성 문제

**해결 방법:**
```typescript
// 게시글 로드 후 사용자 상호작용 상태 새로고침
useEffect(() => {
  if (currentUser && posts.length > 0) {
    loadUserInteractions()
  }
}, [posts.length, currentUser])
```

**개선 사항:**
- ✅ 게시글 로드 시 자동으로 좋아요/북마크 상태 새로고침
- ✅ 북마크한 게시글이 파란색으로 표시됨
- ✅ 좋아요한 게시글이 빨간색으로 표시됨
- ✅ 카테고리/정렬 변경 시에도 상태 유지

---

### 2. 📱 프로필 페이지에 탭 추가

**파일:** `src/pages/Profile.tsx`

**추가된 기능:**

#### 탭 네비게이션
```typescript
type TabType = 'profile' | 'liked' | 'bookmarked'

// 3개의 탭
1. 프로필 정보 (기존)
2. ❤️ 좋아요한 게시글 (신규)
3. 🔖 북마크한 게시글 (신규)
```

#### 좋아요한 게시글 탭
**기능:**
- ✅ 사용자가 좋아요한 게시글 목록 표시
- ✅ 게시글 수 카운트 표시
- ✅ 빈 상태 처리 (좋아요한 게시글이 없을 때)
- ✅ 게시글 카드에 작성자 프로필, 카테고리, 태그, 통계 표시
- ✅ 게시글 클릭 시 상세 페이지로 이동
- ✅ 좋아요 아이콘 빨간색 활성화

**데이터 로드:**
```typescript
const loadLikedPosts = async () => {
  const likedPostIds = await getUserLikedPostIds(currentUser.uid)
  
  const postsPromises = likedPostIds.map(async (postId) => {
    const { getPost } = await import('@/services/post.service')
    return getPost(postId)
  })
  
  const posts = await Promise.all(postsPromises)
  setLikedPosts(posts.filter(p => p !== null))
}
```

#### 북마크한 게시글 탭
**기능:**
- ✅ 사용자가 북마크한 게시글 목록 표시
- ✅ 게시글 수 카운트 표시
- ✅ 빈 상태 처리 (북마크한 게시글이 없을 때)
- ✅ 게시글 카드에 작성자 프로필, 카테고리, 태그, 통계 표시
- ✅ 게시글 클릭 시 상세 페이지로 이동
- ✅ 북마크 아이콘 파란색 활성화

**데이터 로드:**
```typescript
const loadBookmarkedPosts = async () => {
  const posts = await getUserBookmarkedPosts(currentUser.uid)
  setBookmarkedPosts(posts)
}
```

---

## 🎨 UI/UX 개선

### 탭 네비게이션
- **기본 탭:** 프로필 정보
- **탭 전환:** 버튼 클릭으로 간편하게 이동
- **활성 탭:** `default` variant로 강조
- **비활성 탭:** `ghost` variant로 표시

### 게시글 카드 디자인
```
┌─────────────────────────────────────┐
│ [프로필] 카테고리                     │
│                                      │
│ 제목                                  │
│ 작성자 · 시간 · 조회수                │
│ #태그1 #태그2                         │
│                                      │
│ 내용 미리보기 (2줄)                   │
│                                      │
│ ❤️ 10  💬 5  🔖 3                   │
└─────────────────────────────────────┘
```

### 빈 상태 UI
- **아이콘:** Heart (좋아요), Bookmark (북마크)
- **메시지:** "아직 ~한 게시글이 없습니다."
- **CTA 버튼:** "게시글 둘러보기" → Home으로 이동

---

## 📊 데이터 흐름

### 좋아요한 게시글 로드
```
1. "좋아요한 게시글" 탭 클릭
2. getUserLikedPostIds() 호출
3. Firestore에서 postLikes 컬렉션 쿼리
4. 각 postId로 게시글 상세 정보 조회
5. 삭제되지 않은 공개 게시글만 표시
```

### 북마크한 게시글 로드
```
1. "북마크한 게시글" 탭 클릭
2. getUserBookmarkedPosts() 호출
3. Firestore에서 bookmarks 컬렉션 쿼리
4. 각 postId로 게시글 상세 정보 조회
5. 삭제되지 않은 공개 게시글만 표시
```

### 게시글 상태 동기화 (Home)
```
1. 게시글 목록 로드 완료
2. posts.length 변경 감지
3. loadUserInteractions() 자동 호출
4. 좋아요/북마크 상태 Set 업데이트
5. UI 자동 리렌더링 (색상 반영)
```

---

## 🔧 기술 구현

### 1. 탭 상태 관리
```typescript
type TabType = 'profile' | 'liked' | 'bookmarked'
const [activeTab, setActiveTab] = useState<TabType>('profile')

// 탭 변경 시 게시글 로드
useEffect(() => {
  if (activeTab === 'liked' && likedPosts.length === 0) {
    loadLikedPosts()
  } else if (activeTab === 'bookmarked' && bookmarkedPosts.length === 0) {
    loadBookmarkedPosts()
  }
}, [activeTab])
```

### 2. 지연 로딩 (Lazy Loading)
- 탭을 처음 열 때만 데이터 로드
- 이미 로드된 데이터는 캐시 사용
- 불필요한 네트워크 요청 방지

### 3. 조건부 렌더링
```typescript
{activeTab === 'profile' && (
  <div>프로필 정보</div>
)}

{activeTab === 'liked' && (
  <div>좋아요한 게시글</div>
)}

{activeTab === 'bookmarked' && (
  <div>북마크한 게시글</div>
)}
```

### 4. 날짜 포맷팅
```typescript
const formatDate = (timestamp: any) => {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  // ...
  
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  // ...
}
```

---

## 🧪 테스트 시나리오

### 시나리오 1: Home 페이지 북마크 활성화
1. ✅ 로그인 상태에서 Home 페이지 접속
2. ✅ 게시글 북마크 (파란색 활성화 확인)
3. ✅ 페이지 새로고침
4. ✅ 북마크한 게시글이 여전히 파란색으로 표시
5. ✅ 카테고리 변경해도 상태 유지

### 시나리오 2: 좋아요한 게시글 조회
1. ✅ 프로필 페이지 접속
2. ✅ "좋아요한 게시글" 탭 클릭
3. ✅ 좋아요한 게시글 목록 표시
4. ✅ 빨간색 하트 아이콘 확인
5. ✅ 게시글 클릭 시 상세 페이지 이동

### 시나리오 3: 북마크한 게시글 조회
1. ✅ 프로필 페이지 접속
2. ✅ "북마크한 게시글" 탭 클릭
3. ✅ 북마크한 게시글 목록 표시
4. ✅ 파란색 북마크 아이콘 확인
5. ✅ 게시글 클릭 시 상세 페이지 이동

### 시나리오 4: 빈 상태
1. ✅ 좋아요/북마크한 게시글이 없는 계정으로 로그인
2. ✅ 각 탭에서 빈 상태 UI 확인
3. ✅ "게시글 둘러보기" 버튼 클릭
4. ✅ Home 페이지로 이동

### 시나리오 5: 지연 로딩
1. ✅ 프로필 페이지 접속 (프로필 정보만 로드)
2. ✅ "좋아요한 게시글" 탭 클릭 (이때 데이터 로드 시작)
3. ✅ 로딩 표시 확인
4. ✅ 다시 "프로필 정보" 탭 클릭 (즉시 표시)
5. ✅ 다시 "좋아요한 게시글" 탭 클릭 (캐시된 데이터 즉시 표시)

---

## 🎯 주요 개선 사항

### Home 페이지
**Before:**
- ❌ 북마크한 게시글이 회색으로 표시됨
- ❌ 카운트만 정확하고 UI 상태 불일치

**After:**
- ✅ 북마크한 게시글이 파란색으로 활성화
- ✅ 좋아요한 게시글이 빨간색으로 활성화
- ✅ 게시글 로드 후 자동으로 상태 동기화
- ✅ 카테고리/정렬 변경 시에도 상태 유지

### Profile 페이지
**Before:**
- ❌ 프로필 정보만 표시
- ❌ 좋아요/북마크한 게시글 확인 불가

**After:**
- ✅ 3개의 탭 (프로필 정보, 좋아요, 북마크)
- ✅ 좋아요한 게시글 목록 조회 가능
- ✅ 북마크한 게시글 목록 조회 가능
- ✅ 빈 상태 UI 제공
- ✅ 지연 로딩으로 성능 최적화

---

## 📝 사용 방법

### Home 페이지에서 북마크 확인
1. Home 페이지에서 게시글 북마크
2. 즉시 파란색 북마크 아이콘으로 변경
3. 페이지 새로고침해도 상태 유지
4. 카테고리 변경해도 상태 유지

### 프로필 페이지에서 게시글 조회
1. Header의 프로필 아이콘 클릭
2. 상단 탭에서 원하는 섹션 선택
   - **프로필 정보:** 개인 정보, 관심사, 경험 수준 등
   - **좋아요한 게시글:** 내가 좋아요 누른 게시글 목록
   - **북마크한 게시글:** 내가 북마크한 게시글 목록
3. 게시글 카드 클릭 시 상세 페이지로 이동

### 빈 상태에서 시작하기
1. 좋아요/북마크한 게시글이 없을 때
2. "게시글 둘러보기" 버튼 클릭
3. Home 페이지로 이동
4. 원하는 게시글에 좋아요/북마크
5. 프로필 페이지로 돌아가서 확인

---

## 🔍 트러블슈팅

### 북마크 색상이 반영되지 않을 때 (Home)
1. **브라우저 캐시 확인**
   - 하드 새로고침: `Cmd + Shift + R` (Mac) / `Ctrl + Shift + R` (Windows)

2. **Console 에러 확인**
   ```javascript
   console.log('Liked Posts:', likedPostIds)
   console.log('Bookmarked Posts:', bookmarkedPostIds)
   ```

3. **Firestore 데이터 확인**
   - Firebase Console > Firestore Database
   - `postLikes` 컬렉션에 `{userId}_{postId}` 형식의 문서 확인
   - `bookmarks` 컬렉션에 `{userId}_{postId}` 형식의 문서 확인

### 게시글이 로드되지 않을 때 (Profile)
1. **로그인 상태 확인**
   - `currentUser`가 null이 아닌지 확인

2. **게시글 존재 여부 확인**
   - Firestore에서 게시글이 실제로 존재하는지 확인
   - `isDeleted: false`, `isPublished: true` 확인

3. **권한 확인**
   - Firestore 보안 규칙이 올바르게 설정되어 있는지 확인

---

## ✨ 완료!

두 가지 요청하신 기능이 모두 구현되었습니다:

1. ✅ **Home 페이지 북마크 활성화 문제 수정**
   - 북마크한 게시글이 파란색으로 표시
   - 게시글 로드 후 자동으로 상태 동기화

2. ✅ **프로필 페이지에 게시글 조회 기능 추가**
   - 좋아요한 게시글 탭
   - 북마크한 게시글 탭
   - 지연 로딩으로 성능 최적화
   - 빈 상태 UI 제공

모든 기능이 정상 작동합니다! 🎊

