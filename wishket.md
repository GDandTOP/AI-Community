## 포트폴리오 제목

AI 커뮤니티 앱 - Firebase 기반 실시간 AI 정보 공유 커뮤니티 풀스택 개발

---

## 프로젝트 상세

1) 포트폴리오 소개 :
ChatGPT, Claude, Midjourney 등 AI 도구에 관심 있는 사용자들이 모여 정보를 공유하고 소통하는 커뮤니티 웹 앱입니다. 게시글 작성, 댓글, 좋아요/북마크, 실시간 1:1 채팅 등 SNS형 커뮤니티 기능 전반을 Firebase를 BaaS(Backend as a Service)로 활용하여 구현하였습니다. 회원가입 시 AI 관심사 설문을 통해 맞춤형 콘텐츠 경험을 제공하며, 다크모드를 포함한 접근성 높은 UI를 제공합니다.

2) 작업 범위 :
- Full-Stack 개발 (Frontend + Firebase Backend 전담)
- 사용자 인증 및 회원 관리 시스템 구축
- 커뮤니티 게시판 및 소셜 인터랙션 기능 개발
- 실시간 1:1 채팅 시스템 구축
- Firebase Hosting을 통한 배포 및 운영 환경 구성

3) 주요 업무 :
- Firebase Authentication을 활용한 이메일/비밀번호 회원가입 및 Google 소셜 로그인 구현
- Firestore 기반 게시글 CRUD (카테고리, 태그, 이미지 첨부, 유튜브 영상 링크 기능 포함)
- Firebase Storage를 활용한 프로필 이미지 및 게시글 이미지 업로드/삭제 처리
- Firestore Realtime 구독(onSnapshot)을 이용한 댓글 실시간 반영 구현
- Firebase Realtime Database 기반 실시간 1:1 채팅 (읽음 처리, 타이핑 인디케이터, 안 읽은 메시지 수 표시)
- Firestore 트랜잭션(runTransaction)을 활용한 좋아요/북마크 원자적 처리 및 카운트 동기화
- React Context API(AuthContext, ChatContext, ThemeContext)를 이용한 전역 상태 관리
- 다크모드/라이트모드/시스템 설정 테마 토글 및 localStorage 영속화 구현
- 신규 회원 온보딩 설문 (AI 관심사, 경험 수준, 선호 주제 수집)
- 소프트 삭제(isDeleted 플래그) 패턴으로 데이터 보존 및 관리자 복구 가능성 확보

4) 주안점 :
- Firebase 보안 규칙(Firestore Rules, Storage Rules, Database Rules)으로 작성자 본인만 수정/삭제 가능하도록 서버 레벨 권한 제어
- Firestore 복합 인덱스 불필요 설계: 단일 필드 orderBy 후 클라이언트 필터링으로 인덱스 비용 최소화
- Firestore와 Realtime Database를 역할에 맞게 분리 사용 (구조화된 데이터 ↔ 저지연 실시간 메시지)
- 모든 카운트(좋아요 수, 댓글 수) 변경 시 트랜잭션/배치로 원자적 처리하여 데이터 정합성 보장

---

## 프로젝트 배경

1) 문제점
- AI 도구(ChatGPT, Claude, Midjourney 등)의 폭발적 증가로 정보가 분산되어 있어, AI 관련 정보를 한 곳에서 공유하고 소통할 수 있는 전문 커뮤니티가 부재함
- 기존 커뮤니티 플랫폼은 AI 특화 카테고리나 경험 수준별 사용자 세그멘테이션 기능이 없어 초보자와 전문가가 같은 공간에서 정보 교류에 어려움을 겪음
- 별도 서버 인프라 없이 빠르게 실시간 커뮤니티 서비스를 구축할 수 있는 방법이 필요함

2) 프로젝트 목표
- Firebase를 활용한 서버리스(Serverless) 아키텍처로, 별도 백엔드 서버 없이 확장 가능한 AI 전문 커뮤니티 플랫폼 구축
- 게시글, 댓글, 좋아요, 채팅 등 현대적 SNS 커뮤니티 기능 전반을 단일 SPA(Single Page Application)로 구현
- 신규 회원 온보딩 설문을 통해 사용자 관심사 데이터를 수집하고 맞춤형 커뮤니티 경험 기반 마련

3) 주안점
- 사용자 경험: 다크모드 지원, 카테고리/정렬 필터, 실시간 댓글 반영으로 쾌적한 커뮤니티 환경 제공
- 보안: Firebase 보안 규칙으로 인증된 사용자만 콘텐츠를 작성하고, 본인 콘텐츠만 수정/삭제 가능하도록 제한
- 확장성: Firestore 컬렉션 구조와 서비스 레이어 분리(service.ts) 설계로 기능 추가 및 유지보수 용이

---

## 프로젝트 성과

1) 성과명 : Firebase 단일 플랫폼으로 실시간 커뮤니티 풀스택 서비스 완성
2) 설명 :
별도 백엔드 서버 구축 없이 Firebase Auth, Firestore, Realtime Database, Storage, Hosting을 조합하여 회원 인증부터 실시간 채팅, 이미지 업로드, 배포까지 커뮤니티 서비스 전체 사이클을 완성하였습니다. 게시글 작성·수정·삭제, 댓글 실시간 반영, 좋아요/북마크, 1:1 채팅(타이핑 인디케이터·읽음 처리 포함), 프로필 관리, 테마 설정 등 SNS형 커뮤니티의 핵심 기능을 모두 구현하였습니다. TypeScript와 서비스 레이어 분리 설계를 통해 코드 품질과 유지보수성을 확보하였습니다.

---

## 진행 단계

요구사항 정의 > Firebase 프로젝트 설정 및 보안 규칙 작성 > 인증 시스템 구현 > 게시판 CRUD 구현 > 소셜 기능 구현 (좋아요/북마크/댓글) > 실시간 채팅 구현 > UI/UX 완성 (다크모드/온보딩) > Firebase Hosting 배포

- 커뮤니티 서비스 요구사항 정의 및 Firebase 서비스 아키텍처 설계
- Firebase 프로젝트 생성, 환경 변수 설정, Firestore/Storage/Realtime Database 보안 규칙 작성
- Firebase Authentication 기반 이메일 회원가입·로그인 및 Google 소셜 로그인 구현, AuthContext 전역 상태 관리
- Firestore 기반 게시글 CRUD (카테고리·태그·이미지·유튜브 링크 첨부), Firebase Storage 이미지 업로드 연동
- 댓글 실시간 구독(onSnapshot), 좋아요/북마크 트랜잭션 처리, 사용자 프로필 관리 구현
- Firebase Realtime Database 기반 실시간 1:1 채팅 (채팅방 생성, 메시지 전송, 읽음 처리, 타이핑 인디케이터)
- 다크모드 테마 시스템, 신규 회원 AI 관심사 온보딩 설문, 채팅 알림(MessageNotification) 구현
- Firebase Hosting 배포 및 최종 QA

---

## 핵심 기능

**실시간 1:1 채팅 시스템 (Firebase Realtime Database)**
두 사용자의 UID를 정렬하여 결합한 일관된 채팅방 ID를 자동 생성하며, Firebase Realtime Database의 `onValue` 리스너로 메시지를 실시간 구독합니다. 메시지 전송 시 채팅방의 `unreadCount`를 원자적으로 증가시키고, 채팅방 입장 시 `unreadCount`를 0으로 초기화하는 읽음 처리를 구현하였습니다. 타이핑 인디케이터는 5초 이내 타이핑 타임스탬프를 Realtime Database에 기록/삭제하는 방식으로 상대방의 입력 상태를 실시간으로 표시합니다.

**Firestore 트랜잭션 기반 좋아요/댓글 카운트 동기화**
좋아요 추가/삭제 시 `postLikes` 컬렉션과 `posts` 컬렉션의 `likeCount` 필드를 Firestore `runTransaction`으로 원자적으로 처리하여 동시 요청 시에도 카운트 정합성을 보장합니다. 댓글 작성·삭제 시에도 동일한 트랜잭션 패턴으로 `commentCount`를 항상 실제 댓글 수와 일치하도록 유지합니다. 소프트 삭제(`isDeleted: true`) 방식을 채택하여 데이터를 보존하면서 사용자에게는 삭제된 것처럼 표시합니다.

**Firebase Storage 이미지 관리 및 온보딩 설문**
게시글 이미지와 프로필 이미지를 Firebase Storage에 업로드하며, 파일 형식(jpeg/png/webp/gif)과 크기(10MB 이하)를 클라이언트에서 사전 검증합니다. 프로필 이미지 교체 시 기존 Storage 파일을 자동 삭제하여 스토리지 낭비를 방지하며, Google 소셜 로그인 이미지는 외부 URL이므로 삭제 로직에서 예외 처리합니다. 신규 회원 가입 후 AI 관심 도구, 경험 수준, 선호 주제를 수집하는 온보딩 설문을 통해 Firestore `users` 컬렉션에 사용자 데이터를 저장하고 `isProfileComplete` 플래그로 설문 완료 여부를 관리합니다.

---

## 기술 스택

- **Frontend**: React 19, TypeScript 5.9, Vite 7, TailwindCSS 3, React Router DOM v7, lucide-react, class-variance-authority, tailwind-merge
- **Backend/DB**: Firebase Firestore (게시글/댓글/사용자/좋아요/북마크), Firebase Realtime Database (실시간 채팅), Firebase Authentication (이메일·Google 소셜 로그인), Firebase Storage (이미지 업로드), Firebase Analytics
- **결제**: 해당 없음
- **배포**: Firebase Hosting
- **기타**: React Context API (AuthContext, ChatContext, ThemeContext), Firestore 보안 규칙, Storage 보안 규칙, Realtime Database 보안 규칙
