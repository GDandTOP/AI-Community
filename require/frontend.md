# 프론트엔드 개발 계획

## 1. 기술 스택

### Core
- **React 18+** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구 (빠른 개발 환경)

### 스타일링
- **TailwindCSS** - 유틸리티 기반 CSS
- **shadcn/ui** - 재사용 가능한 컴포넌트
- **lucide-react** - 아이콘 라이브러리

### 상태 관리
- **React Context API** - 전역 상태 관리 (Auth, Theme)
- **React Query (TanStack Query)** - 서버 상태 관리 (Firestore 데이터)

### 라우팅
- **React Router v6** - 클라이언트 사이드 라우팅

### Firebase SDK
- **firebase** - Firebase 서비스 연동
- **@firebase/auth** - 인증
- **@firebase/firestore** - 데이터베이스
- **@firebase/storage** - 파일 저장소
- **@firebase/database** - Realtime Database

### 폼 관리
- **react-hook-form** - 폼 상태 관리
- **zod** - 스키마 검증

---

## 2. 프로젝트 구조

```
src/
├── app/                      # 앱 진입점
│   ├── App.tsx              # 메인 앱 컴포넌트
│   └── main.tsx             # 진입점
│
├── components/              # 재사용 가능한 컴포넌트
│   ├── ui/                  # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   └── ...
│   │
│   ├── layout/              # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   │
│   ├── auth/                # 인증 관련 컴포넌트
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── GoogleLoginButton.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── post/                # 게시글 관련 컴포넌트
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   ├── PostDetail.tsx
│   │   ├── PostForm.tsx
│   │   └── PostActions.tsx
│   │
│   ├── comment/             # 댓글 관련 컴포넌트
│   │   ├── CommentList.tsx
│   │   ├── CommentItem.tsx
│   │   └── CommentForm.tsx
│   │
│   ├── profile/             # 프로필 관련 컴포넌트
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileEdit.tsx
│   │   └── ImageUpload.tsx
│   │
│   ├── chat/                # 채팅 관련 컴포넌트
│   │   ├── ChatList.tsx
│   │   ├── ChatRoom.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageBubble.tsx
│   │
│   └── common/              # 공통 컴포넌트
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       ├── ErrorMessage.tsx
│       └── ThemeToggle.tsx
│
├── pages/                   # 페이지 컴포넌트
│   ├── Home.tsx            # 메인 페이지 (게시글 목록)
│   ├── Login.tsx           # 로그인 페이지
│   ├── Signup.tsx          # 회원가입 페이지
│   ├── PostDetail.tsx      # 게시글 상세 페이지
│   ├── PostCreate.tsx      # 게시글 작성 페이지
│   ├── PostEdit.tsx        # 게시글 수정 페이지
│   ├── Profile.tsx         # 프로필 페이지
│   ├── ProfileEdit.tsx     # 프로필 수정 페이지
│   ├── Chat.tsx            # 채팅 목록 페이지
│   ├── ChatRoom.tsx        # 채팅방 페이지
│   └── NotFound.tsx        # 404 페이지
│
├── hooks/                   # 커스텀 훅
│   ├── useAuth.ts          # 인증 관련 훅
│   ├── usePosts.ts         # 게시글 관련 훅
│   ├── useComments.ts      # 댓글 관련 훅
│   ├── useChat.ts          # 채팅 관련 훅
│   ├── useProfile.ts       # 프로필 관련 훅
│   ├── useLike.ts          # 좋아요 관련 훅
│   ├── useBookmark.ts      # 북마크 관련 훅
│   └── useTheme.ts         # 테마 관련 훅
│
├── contexts/                # Context API
│   ├── AuthContext.tsx     # 인증 컨텍스트
│   └── ThemeContext.tsx    # 테마 컨텍스트
│
├── services/                # Firebase 서비스 로직
│   ├── firebase.ts         # Firebase 초기화
│   ├── auth.service.ts     # 인증 서비스
│   ├── post.service.ts     # 게시글 서비스
│   ├── comment.service.ts  # 댓글 서비스
│   ├── chat.service.ts     # 채팅 서비스
│   ├── storage.service.ts  # 스토리지 서비스
│   └── user.service.ts     # 사용자 서비스
│
├── types/                   # TypeScript 타입 정의
│   ├── user.types.ts
│   ├── post.types.ts
│   ├── comment.types.ts
│   ├── chat.types.ts
│   └── common.types.ts
│
├── lib/                     # 유틸리티 함수
│   ├── utils.ts            # shadcn/ui 유틸리티
│   ├── date.ts             # 날짜 포맷팅
│   └── validation.ts       # 검증 스키마
│
├── config/                  # 설정 파일
│   ├── routes.ts           # 라우트 경로 상수
│   └── constants.ts        # 전역 상수
│
└── styles/                  # 전역 스타일
    ├── globals.css         # Tailwind 및 전역 스타일
    └── themes.css          # 다크/라이트 모드 변수
```

---

## 3. 라우팅 구조

```typescript
// 라우트 경로 정의
/ - 홈 (게시글 목록)
/login - 로그인
/signup - 회원가입
/posts/:id - 게시글 상세
/posts/new - 게시글 작성 (인증 필요)
/posts/:id/edit - 게시글 수정 (작성자만)
/profile/:userId - 사용자 프로필
/profile/edit - 프로필 수정 (본인만)
/chat - 채팅 목록 (인증 필요)
/chat/:roomId - 채팅방 (인증 필요)
/bookmarks - 내 북마크 (인증 필요)
```

---

## 4. 주요 기능별 구현 계획

### 4.1 인증 시스템

**컴포넌트:**
- `LoginForm` - 이메일/비밀번호 로그인
- `SignupForm` - 회원가입
- `GoogleLoginButton` - 구글 소셜 로그인
- `ProtectedRoute` - 인증 필요 라우트 보호

**흐름:**
1. 로그인 → Firebase Auth → Context 업데이트 → 홈으로 리다이렉트
2. 회원가입 → Firebase Auth + Firestore 프로필 생성
3. 로그아웃 → Firebase Auth 로그아웃 → Context 초기화

---

### 4.2 게시글 시스템

**컴포넌트:**
- `PostList` - 게시글 목록 (무한 스크롤 or 페이지네이션)
- `PostCard` - 게시글 카드 (제목, 작성자, 좋아요 수 등)
- `PostDetail` - 게시글 상세 (내용 전체 + 댓글)
- `PostForm` - 게시글 작성/수정 폼

**기능:**
- 정렬: 최신순, 인기순(좋아요순)
- 검색: 제목/내용 검색
- 필터: 작성자별, 태그별

**상태 관리:**
- React Query로 캐싱 및 낙관적 업데이트
- 무한 스크롤: `useInfiniteQuery`

---

### 4.3 댓글 시스템

**컴포넌트:**
- `CommentList` - 댓글 목록
- `CommentItem` - 개별 댓글
- `CommentForm` - 댓글 작성 폼

**기능:**
- 실시간 업데이트: Firestore `onSnapshot`
- 댓글 수정/삭제 (작성자만)
- 댓글 개수 표시

---

### 4.4 좋아요/북마크

**컴포넌트:**
- `LikeButton` - 좋아요 버튼
- `BookmarkButton` - 북마크 버튼

**기능:**
- 토글 기능
- 낙관적 UI 업데이트
- 로그인 필요 체크

---

### 4.5 프로필 시스템

**컴포넌트:**
- `ProfileCard` - 프로필 정보 표시
- `ProfileEdit` - 프로필 수정 폼
- `ImageUpload` - 이미지 업로드 컴포넌트

**기능:**
- 프로필 이미지 업로드 (Firebase Storage)
- 닉네임, 자기소개 수정
- 작성한 글 목록

---

### 4.6 1:1 채팅

**컴포넌트:**
- `ChatList` - 채팅방 목록
- `ChatRoom` - 채팅방
- `MessageList` - 메시지 목록
- `MessageInput` - 메시지 입력
- `MessageBubble` - 메시지 버블

**기능:**
- 실시간 메시지 수신 (Realtime Database)
- 읽음 상태 표시
- 타임스탬프 표시
- 자동 스크롤 (최신 메시지)

---

### 4.7 반응형 디자인

**브레이크포인트 (TailwindCSS 기본):**
- `sm`: 640px (모바일 가로)
- `md`: 768px (태블릿)
- `lg`: 1024px (데스크탑)
- `xl`: 1280px (대형 데스크탑)

**레이아웃 전략:**
- 모바일: 싱글 컬럼, 하단 네비게이션
- 태블릿: 2컬럼 그리드
- 데스크탑: 사이드바 + 메인 컨텐츠

---

### 4.8 다크 모드

**구현:**
- TailwindCSS `dark:` 클래스 사용
- Context로 테마 상태 관리
- localStorage에 테마 저장
- 시스템 설정 자동 감지 (`prefers-color-scheme`)

---

## 5. 성능 최적화 전략

### 5.1 코드 스플리팅
```typescript
// 라우트 기반 코드 스플리팅
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Chat = lazy(() => import('./pages/Chat'))
```

### 5.2 이미지 최적화
- 업로드 시 리사이징
- WebP 포맷 사용
- Lazy loading (Intersection Observer)

### 5.3 Firestore 쿼리 최적화
- 필요한 필드만 가져오기
- 페이지네이션 구현
- 인덱스 활용

### 5.4 React 최적화
- `React.memo` - 불필요한 리렌더링 방지
- `useMemo`, `useCallback` - 값/함수 메모이제이션
- Virtual scrolling - 긴 목록 최적화

---

## 6. 개발 단계

### Phase 1: 기본 설정 및 인증 (Week 1)
- [ ] 프로젝트 초기화 (Vite + React + TypeScript)
- [ ] TailwindCSS, shadcn/ui 설정
- [ ] Firebase 초기화
- [ ] 인증 시스템 구현 (이메일, 구글)
- [ ] Context API 설정 (Auth, Theme)
- [ ] 기본 레이아웃 컴포넌트

### Phase 2: 게시글 시스템 (Week 2)
- [ ] 게시글 CRUD 구현
- [ ] 게시글 목록 페이지
- [ ] 게시글 상세 페이지
- [ ] 정렬 및 검색 기능

### Phase 3: 댓글 및 상호작용 (Week 3)
- [ ] 댓글 시스템 구현
- [ ] 좋아요 기능
- [ ] 북마크 기능
- [ ] 실시간 업데이트

### Phase 4: 프로필 시스템 (Week 4)
- [ ] 프로필 페이지
- [ ] 프로필 수정 기능
- [ ] 이미지 업로드 기능

### Phase 5: 채팅 시스템 (Week 5)
- [ ] 채팅 목록 페이지
- [ ] 1:1 채팅방 구현
- [ ] 실시간 메시지 송수신

### Phase 6: UI/UX 개선 및 최적화 (Week 6)
- [ ] 반응형 디자인 완성
- [ ] 다크 모드 구현
- [ ] 성능 최적화
- [ ] 에러 처리 개선
- [ ] 로딩 상태 개선

### Phase 7: 테스트 및 배포 (Week 7)
- [ ] 단위 테스트 (선택)
- [ ] 통합 테스트 (선택)
- [ ] Firebase Hosting 배포
- [ ] 버그 수정

---

## 7. UI/UX 가이드라인

### 7.1 컬러 팔레트
```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 221.2 83.2% 53.3%;
--secondary: 210 40% 96.1%;

/* Dark Mode */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 217.2 91.2% 59.8%;
--secondary: 217.2 32.6% 17.5%;
```

### 7.2 타이포그래피
- 제목: `font-bold text-2xl md:text-3xl`
- 본문: `text-base leading-relaxed`
- 캡션: `text-sm text-muted-foreground`

### 7.3 간격
- 섹션 간: `space-y-8`
- 컴포넌트 간: `space-y-4`
- 요소 간: `gap-2`

### 7.4 애니메이션
- 페이지 전환: Fade in/out
- 버튼 호버: Scale + 색상 변경
- 모달: Slide up + Fade in

---

## 8. 에러 처리 및 로딩 상태

### 8.1 에러 처리
- `ErrorBoundary` - 컴포넌트 레벨 에러
- `toast` 알림 - 사용자 액션 에러
- 404 페이지 - 없는 페이지

### 8.2 로딩 상태
- Skeleton UI - 데이터 로딩 중
- Spinner - 액션 처리 중
- Suspense - 코드 스플리팅 로딩

---

## 9. 보안 고려사항

- XSS 방지: 사용자 입력 sanitize
- CSRF 방지: Firebase 토큰 검증
- 민감 정보 보호: 환경 변수 사용
- 권한 체크: 프론트엔드 + Firestore Rules

---

## 10. 환경 변수

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 11. 패키지 의존성

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "firebase": "^10.7.0",
    "@tanstack/react-query": "^5.17.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

