# 채팅 기능 설정 가이드

## 1. Firebase Realtime Database 설정

### 1.1 Firebase Console에서 Realtime Database 활성화

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **"Realtime Database"** 클릭
4. **"데이터베이스 만들기"** 클릭
5. 위치 선택 (예: us-central1)
6. **테스트 모드**로 시작 (나중에 보안 규칙 변경)
7. **"사용 설정"** 클릭

### 1.2 Database URL 확인

데이터베이스가 생성되면 다음과 같은 URL이 표시됩니다:
```
https://your-project-name-default-rtdb.firebaseio.com
```

이 URL을 복사하여 `.env` 파일에 추가합니다:
```env
VITE_FIREBASE_DATABASE_URL=https://your-project-name-default-rtdb.firebaseio.com
```

---

## 2. 보안 규칙 설정

### 2.1 Firebase Console에서 설정

1. Realtime Database 페이지에서 **"규칙"** 탭 클릭
2. 다음 규칙을 복사하여 붙여넣기:

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

3. **"게시"** 버튼 클릭

### 2.2 규칙 설명

- **chatRooms**: 로그인한 사용자만 읽기/쓰기 가능
- **messages**: 로그인한 사용자만 읽기/쓰기 가능
- **indexOn**: 쿼리 성능 최적화를 위한 인덱스 설정

---

## 3. 로컬 개발 환경 설정

### 3.1 환경 변수 확인

`community-app/.env` 파일에 다음 변수들이 모두 설정되어 있는지 확인:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-your-measurement-id
```

### 3.2 의존성 설치

```bash
cd community-app
npm install
```

### 3.3 개발 서버 실행

```bash
npm run dev
```

---

## 4. 기능 테스트

### 4.1 기본 테스트

1. **회원가입/로그인**
   - 두 개의 브라우저(또는 시크릿 모드)에서 각각 다른 계정으로 로그인

2. **대화 시작**
   - 한 계정에서 게시글/댓글의 닉네임 클릭
   - "대화하기" 버튼 클릭
   - 채팅창이 우측 하단에 팝업으로 열리는지 확인

3. **메시지 전송**
   - 메시지 입력 후 전송
   - 상대방 화면에 실시간으로 메시지가 표시되는지 확인

4. **알림 확인**
   - 상대방 화면의 헤더에서 벨 아이콘에 알림 뱃지가 표시되는지 확인
   - 벨 아이콘 클릭 시 대화 목록 팝업이 열리는지 확인

5. **읽음 처리**
   - 상대방이 채팅창을 열면 알림 뱃지가 사라지는지 확인

### 4.2 고급 테스트

1. **여러 채팅창 열기**
   - 여러 사용자와 동시에 대화
   - 채팅창들이 옆으로 배치되는지 확인

2. **최소화/최대화**
   - 채팅창 헤더의 최소화 버튼 클릭
   - 다시 최대화되는지 확인

3. **새로고침 후 지속성**
   - 페이지 새로고침
   - 대화 목록이 유지되는지 확인
   - 알림 뱃지가 올바르게 표시되는지 확인

---

## 5. Firebase Console에서 데이터 확인

### 5.1 데이터 구조 확인

Firebase Console > Realtime Database > 데이터 탭에서 다음 구조를 확인:

```
├── chatRooms
│   └── userId1_userId2
│       ├── participants
│       ├── participantNames
│       ├── participantPhotos
│       ├── lastMessage
│       ├── lastMessageTime
│       ├── unreadCount
│       └── ...
└── messages
    └── userId1_userId2
        ├── -messageId1
        ├── -messageId2
        └── ...
```

### 5.2 실시간 업데이트 확인

1. Firebase Console에서 데이터 탭 열기
2. 앱에서 메시지 전송
3. Console에 실시간으로 데이터가 추가되는지 확인

---

## 6. 문제 해결

### 문제: 메시지가 전송되지 않음

**원인:**
- Firebase Realtime Database가 활성화되지 않음
- 보안 규칙이 잘못 설정됨
- 환경 변수가 설정되지 않음

**해결:**
1. Firebase Console에서 Realtime Database 활성화 확인
2. 보안 규칙 재확인
3. `.env` 파일에 `VITE_FIREBASE_DATABASE_URL` 확인
4. 개발 서버 재시작

### 문제: 알림 뱃지가 업데이트되지 않음

**원인:**
- ChatContext가 제대로 래핑되지 않음
- Firebase 연결 문제

**해결:**
1. `App.tsx`에서 `<ChatProvider>` 래핑 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. Firebase Console에서 데이터베이스 연결 상태 확인

### 문제: 채팅창이 열리지 않음

**원인:**
- 로그인하지 않음
- ChatContext 초기화 실패

**해결:**
1. 로그인 상태 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. `currentUser`가 null이 아닌지 확인

---

## 7. 배포 시 주의사항

### 7.1 환경 변수 설정

배포 환경(Vercel, Netlify 등)에서 모든 환경 변수를 설정했는지 확인합니다.

### 7.2 보안 규칙 강화

프로덕션 환경에서는 더 엄격한 보안 규칙을 적용하는 것을 권장합니다:

```json
{
  "rules": {
    "chatRooms": {
      "$roomId": {
        ".read": "auth != null && (
          data.child('participants').hasChild(auth.uid)
        )",
        ".write": "auth != null && (
          data.child('participants').hasChild(auth.uid) ||
          !data.exists()
        )"
      }
    },
    "messages": {
      "$roomId": {
        ".read": "auth != null && 
          root.child('chatRooms/' + $roomId + '/participants').hasChild(auth.uid)",
        "$messageId": {
          ".write": "auth != null && 
            root.child('chatRooms/' + $roomId + '/participants').hasChild(auth.uid) &&
            newData.child('senderId').val() === auth.uid"
        }
      }
    }
  }
}
```

### 7.3 인덱스 설정

Firebase Console에서 다음 인덱스를 설정:

```json
{
  "rules": {
    "messages": {
      "$roomId": {
        ".indexOn": ["timestamp", "senderId", "read"]
      }
    }
  }
}
```

---

## 8. 비용 최적화

### 8.1 Realtime Database 요금제

- **Spark (무료)**: 1GB 저장용량, 10GB/월 다운로드
- **Blaze (종량제)**: 사용량에 따라 과금

### 8.2 비용 절감 팁

1. **메시지 제한**: 오래된 메시지 자동 삭제 (Cloud Functions)
2. **페이지네이션**: 한 번에 모든 메시지를 가져오지 않음 (현재 구현됨)
3. **리스너 최소화**: 불필요한 실시간 리스너 제거
4. **오프라인 캐시**: 네트워크 사용 최소화

---

## 9. 다음 단계

### 권장 개선 사항

1. **메시지 삭제 기능** 추가
2. **이미지/파일 전송** 기능 추가
3. **타이핑 표시** 기능 추가
4. **온라인 상태 표시** 기능 추가
5. **메시지 검색** 기능 추가

### Cloud Functions 활용

다음 기능은 Cloud Functions로 구현하는 것을 권장:

- 오래된 메시지 자동 삭제
- 프로필 변경 시 채팅 데이터 업데이트
- 푸시 알림 전송
- 스팸 필터링

---

## 10. 참고 자료

- [Firebase Realtime Database 문서](https://firebase.google.com/docs/database)
- [Firebase 보안 규칙](https://firebase.google.com/docs/database/security)
- [Firebase 가격 정책](https://firebase.google.com/pricing)
- [React + Firebase 베스트 프랙티스](https://firebase.google.com/docs/database/web/read-and-write)

---

## 문의

문제가 발생하거나 추가 지원이 필요한 경우 다음을 확인하세요:

1. 브라우저 콘솔의 에러 메시지
2. Firebase Console의 데이터 구조
3. 네트워크 탭에서 Firebase 요청/응답
4. 보안 규칙이 올바르게 설정되었는지 확인

