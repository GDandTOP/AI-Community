## 1. 프로젝트 개요 (Project Overview)

AI 정보 공유를 중심으로 한 커뮤니티 플랫폼을 구축합니다. 
사용자들이 자유롭게 AI 관련 글을 작성하고 댓글을 남기며, 
프로필을 설정하고 1:1로 소통할 수 있는 기능을 제공합니다. 
Firebase 기반으로 백엔드를 구성하며, 
프론트엔드는 React 및 shadcn/ui 라이브러리를 활용하여 현대적이고 깔끔한 UI/UX를 제공합니다.

---

## 2. 핵심 기능 (Core Functionalities)

### 2.1 사용자 인증 (Authentication)
- Firebase Authentication 사용
- 이메일/비밀번호 로그인 기능 구현
- Google 계정 로그인 연동

### 2.2 사용자 프로필
- Firebase Storage를 활용한 프로필 이미지 업로드 및 수정 기능
- Firestore에 사용자 정보 저장 (이메일, 닉네임, 이미지 URL 등)

### 2.3 게시글 시스템
- 글 작성, 수정, 삭제 기능
- 전체 글 목록 조회 및 정렬 (최신순, 인기순 등)
- 게시글 상세 페이지 구성
- Firestore를 활용한 데이터 저장 및 쿼리

### 2.4 댓글 시스템
- Firestore 서브컬렉션을 활용하여 게시글별 댓글 저장
- 댓글 작성, 수정, 삭제 기능
- 실시간 댓글 업데이트 기능 (onSnapshot)

### 2.5 좋아요 및 북마크 기능
- Firestore에 유저 ID 기반 좋아요 및 북마크 기록 저장
- 좋아요/북마크 토글 기능
- 각 게시글의 좋아요 수, 북마크 수 표시

### 2.6 1:1 채팅 기능
- Firebase Realtime Database 사용
- 유저 간 1:1 대화방 생성 및 실시간 메시지 송수신
- 채팅 UI 구성 (최근 메시지 미리보기, 타임스탬프 등)

### 2.7 반응형 UI 및 디자인 시스템
- shadcn/ui 컴포넌트 활용
- TailwindCSS 기반 커스터마이징
- 다크 모드 및 라이트 모드 지원
- 모바일/태블릿/데스크탑 반응형 최적화

### 2.8 배포 및 운영
- Firebase Hosting을 통한 배포

---

## 3. 기술 스택 (Tech Stack)
- **프론트엔드:** React, TypeScript, TailwindCSS, shadcn/ui
- **백엔드 (BaaS):** Firebase (Auth, Firestore, Realtime DB, Storage, Hosting)
- **배포:** Firebase Hosting

---

## 4. 프로젝트 파일 구조 (Project Structure)

```
firebase_community/
├── require/                          # 개발 문서
│   ├── prd.md                       # 프로젝트 요구사항 정의서 (본 문서)
│   ├── frontend.md                  # 프론트엔드 개발 계획
│   ├── database.md                  # Firestore 데이터베이스 구조 설계
│   ├── realtimeDB.md                # Realtime Database 구조 (채팅)
│   ├── storage.md                   # Firebase Storage 구조 설계
│   └── auth.md                      # 인증 구현 가이드
│
├── src/                              # 소스 코드
│   ├── app/                         # 앱 진입점
│   │   ├── App.tsx                  # 메인 앱 컴포넌트
│   │   └── main.tsx                 # 진입점
│   │
│   ├── components/                  # 재사용 가능한 컴포넌트
│   │   ├── ui/                      # shadcn/ui 컴포넌트
│   │   ├── layout/                  # 레이아웃 컴포넌트
│   │   ├── auth/                    # 인증 관련 컴포넌트
│   │   ├── post/                    # 게시글 관련 컴포넌트
│   │   ├── comment/                 # 댓글 관련 컴포넌트
│   │   ├── profile/                 # 프로필 관련 컴포넌트
│   │   ├── chat/                    # 채팅 관련 컴포넌트
│   │   └── common/                  # 공통 컴포넌트
│   │
│   ├── pages/                       # 페이지 컴포넌트
│   │   ├── Home.tsx                 # 메인 페이지
│   │   ├── Login.tsx                # 로그인 페이지
│   │   ├── Signup.tsx               # 회원가입 페이지
│   │   ├── PostDetail.tsx           # 게시글 상세
│   │   ├── PostCreate.tsx           # 게시글 작성
│   │   ├── Profile.tsx              # 프로필 페이지
│   │   ├── Chat.tsx                 # 채팅 목록
│   │   └── ChatRoom.tsx             # 채팅방
│   │
│   ├── hooks/                       # 커스텀 훅
│   │   ├── useAuth.ts               # 인증 관련 훅
│   │   ├── usePosts.ts              # 게시글 관련 훅
│   │   ├── useComments.ts           # 댓글 관련 훅
│   │   ├── useChat.ts               # 채팅 관련 훅
│   │   └── useProfile.ts            # 프로필 관련 훅
│   │
│   ├── contexts/                    # Context API
│   │   ├── AuthContext.tsx          # 인증 컨텍스트
│   │   └── ThemeContext.tsx         # 테마 컨텍스트
│   │
│   ├── services/                    # Firebase 서비스 로직
│   │   ├── firebase.ts              # Firebase 초기화
│   │   ├── auth.service.ts          # 인증 서비스
│   │   ├── post.service.ts          # 게시글 서비스
│   │   ├── comment.service.ts       # 댓글 서비스
│   │   ├── chat.service.ts          # 채팅 서비스
│   │   ├── storage.service.ts       # 스토리지 서비스
│   │   └── user.service.ts          # 사용자 서비스
│   │
│   ├── types/                       # TypeScript 타입 정의
│   │   ├── user.types.ts
│   │   ├── post.types.ts
│   │   ├── comment.types.ts
│   │   └── chat.types.ts
│   │
│   ├── lib/                         # 유틸리티 함수
│   │   ├── utils.ts                 # shadcn/ui 유틸리티
│   │   ├── date.ts                  # 날짜 포맷팅
│   │   └── validation.ts            # 검증 스키마
│   │
│   ├── config/                      # 설정 파일
│   │   ├── routes.ts                # 라우트 경로 상수
│   │   └── constants.ts             # 전역 상수
│   │
│   └── styles/                      # 전역 스타일
│       ├── globals.css              # Tailwind 및 전역 스타일
│       └── themes.css               # 다크/라이트 모드
│
├── public/                           # 정적 파일
│   └── images/                      # 이미지 파일
│
├── .env                              # 환경 변수 (Git 제외)
├── .env.example                      # 환경 변수 예시
├── .gitignore                        # Git 제외 파일
├── package.json                      # 의존성 관리
├── tsconfig.json                     # TypeScript 설정
├── vite.config.ts                    # Vite 설정
├── tailwind.config.js                # TailwindCSS 설정
├── postcss.config.js                 # PostCSS 설정
├── components.json                   # shadcn/ui 설정
├── firebase.json                     # Firebase 배포 설정
├── .firebaserc                       # Firebase 프로젝트 설정
└── README.md                         # 프로젝트 설명서
```

---

## 5. Firebase 구조

### 5.1 Firestore Collections

```
firestore/
├── users/                            # 사용자 컬렉션
│   └── {userId}/                    # 사용자 문서
│
├── posts/                            # 게시글 컬렉션
│   └── {postId}/                    # 게시글 문서
│       └── comments/                # 댓글 서브컬렉션
│           └── {commentId}/         # 댓글 문서
│
├── likes/                            # 좋아요 컬렉션
│   └── {userId}_{postId}/           # 좋아요 문서
│
└── bookmarks/                        # 북마크 컬렉션
    └── {userId}_{postId}/           # 북마크 문서
```

### 5.2 Realtime Database Structure

```
realtimeDB/
├── chatRooms/                        # 채팅방 메타데이터
│   └── {roomId}/                    # 채팅방 정보
│
├── messages/                         # 메시지
│   └── {roomId}/                    # 채팅방별 메시지
│       └── {messageId}/             # 개별 메시지
│
└── userChats/                        # 사용자별 채팅 목록
    └── {userId}/                    # 사용자 ID
        └── {roomId}/                # 채팅방 인덱스
```

### 5.3 Storage Structure

```
storage/
├── profiles/                         # 프로필 이미지
│   └── {userId}/
│       └── avatar.{ext}             # 프로필 이미지
│
└── posts/                            # 게시글 이미지 (선택)
    └── {postId}/
        └── image_{n}.{ext}          # 게시글 이미지
```

---

## 6. 개발 단계별 계획

### Phase 1: 기본 설정 (Week 1)
- [ ] 프로젝트 초기화 (Vite + React + TypeScript)
- [ ] TailwindCSS 설정
- [ ] shadcn/ui 설치 및 설정
- [ ] Firebase 프로젝트 생성 및 초기화
- [ ] 환경 변수 설정
- [ ] 기본 레이아웃 구성

### Phase 2: 인증 시스템 (Week 1-2)
- [ ] Firebase Authentication 설정
- [ ] 이메일/비밀번호 인증 구현
- [ ] Google 소셜 로그인 구현
- [ ] Auth Context 구현
- [ ] 보호된 라우트 구현
- [ ] 로그인/회원가입 UI

### Phase 3: 게시글 시스템 (Week 2-3)
- [ ] Firestore 데이터베이스 구조 설계
- [ ] 게시글 CRUD 구현
- [ ] 게시글 목록 페이지 (페이지네이션)
- [ ] 게시글 상세 페이지
- [ ] 정렬 기능 (최신순, 인기순)
- [ ] 검색 기능

### Phase 4: 댓글 시스템 (Week 3)
- [ ] 댓글 서브컬렉션 구조 설계
- [ ] 댓글 CRUD 구현
- [ ] 실시간 댓글 업데이트
- [ ] 댓글 UI 구현

### Phase 5: 좋아요/북마크 (Week 4)
- [ ] 좋아요 기능 구현
- [ ] 북마크 기능 구현
- [ ] 낙관적 UI 업데이트
- [ ] 내 북마크 페이지

### Phase 6: 프로필 시스템 (Week 4-5)
- [ ] Firebase Storage 설정
- [ ] 프로필 이미지 업로드 구현
- [ ] 프로필 페이지 구현
- [ ] 프로필 수정 기능
- [ ] 사용자별 게시글 목록

### Phase 7: 채팅 시스템 (Week 5-6)
- [ ] Realtime Database 설정
- [ ] 채팅방 생성 로직
- [ ] 1:1 메시지 송수신
- [ ] 채팅 목록 페이지
- [ ] 채팅방 UI
- [ ] 읽음 상태 표시

### Phase 8: UI/UX 개선 (Week 6-7)
- [ ] 반응형 디자인 완성
- [ ] 다크 모드 구현
- [ ] 애니메이션 추가
- [ ] 로딩 상태 개선
- [ ] 에러 처리 개선

### Phase 9: 최적화 및 테스트 (Week 7)
- [ ] 코드 스플리팅
- [ ] 이미지 최적화
- [ ] Firestore 쿼리 최적화
- [ ] 성능 테스트
- [ ] 크로스 브라우저 테스트

### Phase 10: 배포 (Week 8)
- [ ] Firebase Hosting 설정
- [ ] Security Rules 검증
- [ ] 프로덕션 빌드
- [ ] 배포 및 모니터링
- [ ] 버그 수정

---

## 7. 참고 문서

각 기능별 상세 설계 및 구현 가이드는 다음 문서를 참조하세요:

- **프론트엔드 개발**: [frontend.md](./frontend.md)
- **데이터베이스 설계**: [database.md](./database.md)
- **채팅 시스템**: [realtimeDB.md](./realtimeDB.md)
- **파일 저장소**: [storage.md](./storage.md)
- **인증 시스템**: [auth.md](./auth.md)

---

## 8. 주요 기술 선택 이유

### React
- 컴포넌트 기반 개발로 재사용성 높음
- 풍부한 생태계와 커뮤니티
- Firebase와 원활한 통합

### TypeScript
- 타입 안정성으로 오류 사전 방지
- 코드 가독성 및 유지보수성 향상
- IDE 자동완성 지원

### Firebase
- 서버 없이 빠른 백엔드 구축
- 실시간 기능 제공 (채팅, 댓글)
- 자동 확장 및 무료 플랜

### TailwindCSS + shadcn/ui
- 빠른 UI 개발
- 일관된 디자인 시스템
- 높은 커스터마이징 자유도

---

## 9. 예상 일정

- **총 개발 기간**: 약 8주
- **주당 작업 시간**: 20-30시간 (개인 프로젝트 기준)
- **MVP 완성**: 6주차
- **최적화 및 배포**: 7-8주차

---

## 10. 성공 지표

- [ ] 사용자 인증 및 프로필 관리 기능 완성
- [ ] 게시글 작성/조회/수정/삭제 기능 작동
- [ ] 댓글 실시간 업데이트 작동
- [ ] 1:1 채팅 실시간 송수신 작동
- [ ] 모바일/태블릿/데스크탑 반응형 지원
- [ ] 다크/라이트 모드 작동
- [ ] Firebase Hosting 배포 완료
- [ ] 페이지 로딩 속도 3초 이내

---

## 11. 향후 확장 가능성

프로젝트 완성 후 추가할 수 있는 기능:

- 알림 시스템 (새 댓글, 좋아요 알림)
- 게시글 태그 필터링
- 사용자 팔로우 기능
- 게시글 공유 기능
- 관리자 대시보드
- 게시글 신고 기능
- 이미지 갤러리
- 마크다운 에디터
- SEO 최적화

---

## 12. 현재 구현 상태 (Current Implementation Status)

### 12.1 완료된 항목 ✅

#### Phase 1: 기본 설정
- ✅ 프로젝트 초기화 (Vite + React + TypeScript)
- ✅ TailwindCSS 설정 (v3.4.0)
- ✅ shadcn/ui 기본 컴포넌트 설치
- ✅ 기본 레이아웃 구성
- ✅ React Router v6 설정
- ✅ 다크/라이트 모드 구현

#### 구현된 컴포넌트
**UI 컴포넌트:**
- Button (variants: default, destructive, outline, secondary, ghost, link)
- Card (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- Input

**레이아웃 컴포넌트:**
- Header (로고, 검색바, 네비게이션, 테마 토글)
- Footer (링크, 저작권)
- MainLayout (헤더 + 메인 + 푸터)

**공통 컴포넌트:**
- ThemeToggle (다크/라이트 모드 전환)

**페이지 컴포넌트:**
- Home (게시글 목록 UI, 사이드바, 더미 데이터)
- Login (로그인 폼 UI)
- Signup (회원가입 폼 UI)
- NotFound (404 페이지)

**Context:**
- ThemeContext (테마 상태 관리)

**라우팅:**
- / → Home
- /login → Login
- /signup → Signup
- /* → NotFound

---

### 12.2 현재 파일 구조

```
firebase_community/
├── require/                          # ✅ 개발 문서
│   ├── prd.md                       # 프로젝트 요구사항 정의서
│   ├── frontend.md                  # 프론트엔드 개발 계획
│   ├── database.md                  # Firestore 구조 설계
│   ├── realtimeDB.md                # Realtime DB 구조 (채팅)
│   ├── storage.md                   # Storage 구조 설계
│   └── auth.md                      # 인증 구현 가이드
│
└── community-app/                    # ✅ React 프로젝트
    ├── src/
    │   ├── App.tsx                  # ✅ 메인 앱 (Router + ThemeProvider)
    │   ├── main.tsx                 # ✅ 진입점
    │   ├── index.css                # ✅ TailwindCSS + 다크모드 변수
    │   │
    │   ├── components/
    │   │   ├── ui/                  # ✅ shadcn/ui 컴포넌트
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   └── input.tsx
    │   │   │
    │   │   ├── layout/              # ✅ 레이아웃
    │   │   │   ├── Header.tsx
    │   │   │   ├── Footer.tsx
    │   │   │   └── MainLayout.tsx
    │   │   │
    │   │   ├── common/              # ✅ 공통 컴포넌트
    │   │   │   └── ThemeToggle.tsx
    │   │   │
    │   │   ├── auth/                # 📝 예정
    │   │   ├── post/                # 📝 예정
    │   │   ├── comment/             # 📝 예정
    │   │   ├── profile/             # 📝 예정
    │   │   └── chat/                # 📝 예정
    │   │
    │   ├── pages/                   # ✅ 페이지
    │   │   ├── Home.tsx
    │   │   ├── Login.tsx
    │   │   ├── Signup.tsx
    │   │   └── NotFound.tsx
    │   │
    │   ├── contexts/                # ✅ Context
    │   │   └── ThemeContext.tsx
    │   │
    │   ├── lib/                     # ✅ 유틸리티
    │   │   └── utils.ts             # shadcn/ui 유틸
    │   │
    │   ├── hooks/                   # 📝 예정
    │   ├── services/                # 📝 예정 (Firebase)
    │   ├── types/                   # 📝 예정
    │   ├── config/                  # 📝 예정
    │   └── styles/                  # 📝 예정
    │
    ├── public/
    │   └── vite.svg
    │
    ├── .gitignore
    ├── package.json                 # ✅ 의존성
    ├── tsconfig.json                # ✅ TS 설정 + path alias
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── vite.config.ts               # ✅ Vite 설정 + path alias
    ├── tailwind.config.js           # ✅ TailwindCSS 설정
    ├── postcss.config.js            # ✅ PostCSS 설정
    └── index.html
```

---

### 12.3 설치된 패키지

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1",
    "lucide-react": "^0.468.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.2",
    "typescript": "~5.7.2",
    "vite": "^7.3.0",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20"
  }
}
```

---

### 12.4 다음 단계 (Next Steps)

#### 즉시 구현 가능:
1. **Firebase 설정**
   - Firebase 프로젝트 생성
   - Firebase SDK 설치
   - 환경 변수 설정
   - Firebase 초기화 파일 생성

2. **인증 시스템 (Phase 2)**
   - Firebase Authentication 연동
   - AuthContext 구현
   - 로그인/회원가입 기능 구현
   - ProtectedRoute 구현

3. **게시글 시스템 (Phase 3)**
   - Firestore 연동
   - 게시글 CRUD 서비스
   - 실제 데이터 연동

4. **추가 UI 컴포넌트**
   - Avatar, Badge, Dialog, Dropdown
   - Textarea, Skeleton, Toast

---

### 12.5 개발 서버 실행

```bash
cd community-app
npm run dev
```

**접속:** http://localhost:5173

**확인 가능한 페이지:**
- 홈 페이지 (더미 게시글 목록)
- 로그인 페이지 (UI만)
- 회원가입 페이지 (UI만)
- 다크/라이트 모드 토글
- 반응형 디자인
