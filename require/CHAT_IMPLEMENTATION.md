# 1대1 채팅 기능 구현 완료

## 구현 개요

Firebase Realtime Database를 활용한 실시간 1대1 채팅 기능이 성공적으로 구현되었습니다.

---

## 구현된 기능

### 1. 팝업 형태의 채팅창
- ✅ 화면 우측 하단에 표시되는 팝업 채팅창
- ✅ 최소화/최대화 기능
- ✅ 여러 채팅창을 동시에 열 수 있음 (옆으로 배치)
- ✅ 실시간 메시지 송수신
- ✅ 날짜 구분선 표시
- ✅ 읽음 처리 자동화

### 2. 메시지 알림 아이콘
- ✅ 헤더에 메시지 알림 벨 아이콘 추가
- ✅ 읽지 않은 메시지 개수 뱃지 표시
- ✅ 실시간 알림 업데이트

### 3. 대화 목록 팝업
- ✅ 알림 아이콘 클릭 시 대화 목록 표시
- ✅ 최근 대화 순으로 정렬
- ✅ 각 대화의 마지막 메시지 미리보기
- ✅ 읽지 않은 메시지 개수 표시
- ✅ 대화 선택 시 채팅창 자동 오픈

### 4. 닉네임 클릭 시 대화하기
- ✅ 게시글/댓글의 닉네임을 클릭하면 드랍다운 메뉴 표시
- ✅ "대화하기" 버튼으로 즉시 채팅 시작
- ✅ "프로필 보기" 옵션 (추후 확장 가능)
- ✅ 자기 자신의 닉네임은 클릭 불가

---

## 파일 구조

```
community-app/src/
├── types/
│   └── chat.types.ts                 # 채팅 관련 타입 정의
├── services/
│   └── chat.service.ts               # 채팅 서비스 (Firebase RTDB)
├── contexts/
│   └── ChatContext.tsx               # 채팅 전역 상태 관리
├── components/
│   ├── chat/기능 구현 목표

Firebase realtime database를 활용한 1대1 채팅 기능을 구현하고자 합니다. 

1대1 채팅 UI 구현
- 유저 간 개인 채팅이 가능한 UI를 구현해주세요.
ㄴㅇㄹㅁㅇㄹ
│   │   ├── ChatWindow.tsx            # 팝업 채팅창
│   │   ├── ChatListPopup.tsx         # 대화 목록 팝업
│   │   ├── MessageNotification.tsx   # 메시지 알림 아이콘
│   │   └── ChatManager.tsx           # 채팅 매니저 (사용 안함)
│   └── common/
│       └── UserNameButton.tsx        # 닉네임 클릭 컴포넌트
└── ...

database.rules.json                    # Realtime Database 보안 규칙
```

---

## 주요 컴포넌트 설명

### 1. ChatContext
전역 채팅 상태를 관리하는 Context입니다.

**주요 기능:**
- `openChat()`: 채팅방 생성 및 채팅창 열기
- `openChatFromPreview()`: 기존 채팅 미리보기에서 채팅창 열기
- `closeChat()`: 채팅창 닫기
- `showChatList`: 대화 목록 팝업 표시 여부

### 2. ChatWindow
팝업 형태의 채팅창 컴포넌트입니다.

**주요 기능:**
- 실시간 메시지 수신 (Firebase onValue)
- 메시지 전송
- 자동 스크롤
- 최소화/최대화
- 날짜 구분선
- 읽음 처리 자동화

### 3. MessageNotification
헤더에 표시되는 메시지 알림 아이콘입니다.

**주요 기능:**
- 실시간 읽지 않은 메시지 개수 표시
- 9개 이상은 "9+" 표시
- 클릭 시 대화 목록 팝업 토글

### 4. ChatListPopup
최근 대화 목록을 보여주는 팝업입니다.

**주요 기능:**
- 최근 대화 순으로 정렬
- 마지막 메시지 미리보기
- 읽지 않은 메시지 개수 뱃지
- 대화 선택 시 채팅창 자동 오픈

### 5. UserNameButton
닉네임을 클릭 가능한 버튼으로 만들어주는 컴포넌트입니다.

**주요 기능:**
- 닉네임 클릭 시 드랍다운 메뉴
- "대화하기" 버튼
- "프로필 보기" 버튼
- 자기 자신의 닉네임은 일반 텍스트로 표시

---

## Firebase Realtime Database 구조

```json
{
  "chatRooms": {
    "userId1_userId2": {
      "participants": ["userId1", "userId2"],
      "participantNames": {
        "userId1": "홍길동",
        "userId2": "김철수"
      },
      "participantPhotos": {
        "userId1": "photoURL",
        "userId2": null
      },
      "lastMessage": "마지막 메시지",
      "lastMessageTime": 1234567890,
      "lastMessageSenderId": "userId1",
      "unreadCount": {
        "userId1": 0,
        "userId2": 1
      },
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  },
  "messages": {
    "userId1_userId2": {
      "-messageId1": {
        "chatRoomId": "userId1_userId2",
        "senderId": "userId1",
        "senderName": "홍길동",
        "senderPhotoURL": "photoURL",
        "text": "안녕하세요",
        "timestamp": 1234567890,
        "read": false
      }
    }
  }
}
```

---

## 사용 방법

### 1. 채팅 시작하기
게시글이나 댓글에서 닉네임을 클릭하고 "대화하기" 버튼을 누릅니다.

### 2. 채팅 목록 확인
헤더의 벨 아이콘을 클릭하여 대화 목록을 확인합니다.

### 3. 메시지 보내기
채팅창 하단의 입력창에 메시지를 입력하고 전송 버튼을 누릅니다.

### 4. 채팅창 관리
- 최소화: 채팅창 헤더의 최소화 버튼 클릭
- 닫기: 채팅창 헤더의 X 버튼 클릭
- 여러 채팅창 열기: 다른 사용자와의 대화를 추가로 열 수 있습니다

---

## 통합 위치

### Header.tsx
```tsx
// 메시지 알림 아이콘
<MessageNotification onClick={() => setShowChatList(!showChatList)} />

// 채팅 목록 팝업
{showChatList && (
  <ChatListPopup
    onClose={() => setShowChatList(false)}
    onSelectChat={openChatFromPreview}
    position={{ top: 64, right: 16 }}
  />
)}

// 열린 채팅창들
{openChats.map((chat, index) => (
  <ChatWindow
    key={chat.chatRoomId}
    chatRoomId={chat.chatRoomId}
    otherUserId={chat.otherUserId}
    otherUserName={chat.otherUserName}
    otherUserPhotoURL={chat.otherUserPhotoURL}
    onClose={() => closeChat(chat.chatRoomId)}
    position={{ bottom: 16, right: 16 + index * 400 }}
  />
))}
```

### App.tsx
```tsx
<ChatProvider>
  <BrowserRouter>
    {/* ... */}
  </BrowserRouter>
</ChatProvider>
```

### Home.tsx, PostDetail.tsx, CommentSection.tsx
```tsx
<UserNameButton
  userId={authorId}
  userName={authorName}
  userPhotoURL={authorPhotoURL}
  className="font-medium"
/>
```

---

## Firebase 설정

### 1. Realtime Database 활성화
Firebase Console에서 Realtime Database를 활성화합니다.

### 2. 보안 규칙 설정
`database.rules.json` 파일의 내용을 Firebase Console의 Realtime Database Rules에 복사합니다.

```json
{
  "rules": {
    "chatRooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "messages": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".indexOn": ["timestamp", "senderId"]
      }
    }
  }
}
```

### 3. 환경 변수 확인
`.env` 파일에 `VITE_FIREBASE_DATABASE_URL`이 설정되어 있는지 확인합니다.

```
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

---

## 향후 개선 가능 사항

### 기능 추가
- [ ] 메시지 삭제 기능
- [ ] 이미지/파일 전송
- [ ] 타이핑 표시 (누가 입력 중인지)
- [ ] 온라인 상태 표시
- [ ] 메시지 검색
- [ ] 대화 고정 (Pin)
- [ ] 대화 음소거
- [ ] 읽음 확인 (더블 체크)

### UI/UX 개선
- [ ] 메시지 그룹핑 (같은 사용자의 연속 메시지)
- [ ] 링크 미리보기
- [ ] 이모지 추가
- [ ] 다크모드 최적화
- [ ] 모바일 반응형 개선

### 성능 최적화
- [ ] 메시지 페이지네이션 (무한 스크롤)
- [ ] 이미지 레이지 로딩
- [ ] 채팅 목록 가상화

---

## 테스트 체크리스트

- [x] 채팅방 생성
- [x] 메시지 전송/수신
- [x] 실시간 업데이트
- [x] 읽음 처리
- [x] 알림 뱃지 표시
- [x] 여러 채팅창 동시 열기
- [x] 최소화/최대화
- [x] 닉네임 클릭 -> 대화하기
- [x] 대화 목록 표시
- [ ] 오프라인 동작 (추후 테스트 필요)
- [ ] 로그인/로그아웃 시 동작

---

## 문제 해결

### 메시지가 전송되지 않는 경우
1. Firebase Realtime Database가 활성화되어 있는지 확인
2. 보안 규칙이 올바르게 설정되어 있는지 확인
3. 환경 변수 `VITE_FIREBASE_DATABASE_URL`이 설정되어 있는지 확인

### 알림 뱃지가 업데이트되지 않는 경우
1. ChatContext가 App.tsx에 정상적으로 래핑되어 있는지 확인
2. Firebase 연결 상태 확인

### 채팅창이 열리지 않는 경우
1. 콘솔에 에러 메시지가 있는지 확인
2. currentUser가 null이 아닌지 확인
3. ChatContext가 정상적으로 초기화되었는지 확인

---

## 마무리

Firebase Realtime Database를 활용한 1대1 채팅 기능이 성공적으로 구현되었습니다.
모든 필수 기능이 동작하며, 향후 추가 기능 확장이 용이한 구조로 설계되었습니다.

