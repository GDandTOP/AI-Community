# Firebase Realtime Database 구조 설계 (1:1 채팅)

## 1. 개요

Firebase Realtime Database는 실시간 동기화에 최적화된 NoSQL 데이터베이스입니다.
JSON 트리 구조를 사용하며, 채팅과 같은 실시간 기능에 적합합니다.

---

## 2. Firestore vs Realtime Database

### 왜 채팅에는 Realtime Database를 사용하나?

| 특징 | Firestore | Realtime Database |
|------|-----------|-------------------|
| 실시간 성능 | 좋음 | 매우 좋음 ⭐ |
| 레이턴시 | ~100ms | ~50ms ⭐ |
| 오프라인 지원 | 제한적 | 우수 ⭐ |
| 쿼리 | 복잡한 쿼리 가능 | 제한적 |
| 가격 | 읽기/쓰기 횟수 기반 | 데이터 전송량 기반 |

**채팅은 Realtime Database가 더 적합:**
- 매우 낮은 레이턴시 필요
- 단순한 데이터 구조
- 실시간 동기화가 핵심

---

## 3. 데이터베이스 구조

### 3.1 전체 구조 개요

```json
{
  "chatRooms": {
    "{roomId}": {
      "participants": {},
      "lastMessage": {},
      "createdAt": 0,
      "updatedAt": 0
    }
  },
  "messages": {
    "{roomId}": {
      "{messageId}": {}
    }
  },
  "userChats": {
    "{userId}": {
      "{roomId}": {}
    }
  }
}
```

---

## 4. 노드별 상세 설계

### 4.1 chatRooms 노드

**경로:** `/chatRooms/{roomId}`

**용도:** 채팅방 메타데이터 및 참여자 정보

**Room ID 형식:** `{user1Id}__{user2Id}` (알파벳 순으로 정렬)
- 예: `abc123__def456`
- 항상 동일한 두 사용자 간 같은 Room ID 생성

**구조:**
```typescript
interface ChatRoom {
  id: string;                          // 채팅방 ID
  participants: {
    [userId: string]: {
      uid: string;                     // 사용자 UID
      displayName: string;             // 닉네임
      photoURL: string | null;         // 프로필 이미지
      joinedAt: number;                // 참여 시간 (timestamp)
    }
  };
  lastMessage: {
    text: string;                      // 마지막 메시지 내용
    senderId: string;                  // 보낸 사람 UID
    senderName: string;                // 보낸 사람 닉네임
    timestamp: number;                 // 전송 시간
    isRead: boolean;                   // 읽음 여부
  };
  createdAt: number;                   // 생성 시간 (timestamp)
  updatedAt: number;                   // 마지막 업데이트 시간
}
```

**예시:**
```json
{
  "chatRooms": {
    "abc123__def456": {
      "id": "abc123__def456",
      "participants": {
        "abc123": {
          "uid": "abc123",
          "displayName": "홍길동",
          "photoURL": "https://storage.googleapis.com/...",
          "joinedAt": 1704902400000
        },
        "def456": {
          "uid": "def456",
          "displayName": "김철수",
          "photoURL": "https://storage.googleapis.com/...",
          "joinedAt": 1704902400000
        }
      },
      "lastMessage": {
        "text": "안녕하세요!",
        "senderId": "abc123",
        "senderName": "홍길동",
        "timestamp": 1704902400000,
        "isRead": false
      },
      "createdAt": 1704902400000,
      "updatedAt": 1704902400000
    }
  }
}
```

---

### 4.2 messages 노드

**경로:** `/messages/{roomId}/{messageId}`

**용도:** 채팅방별 메시지 저장

**Message ID:** Firebase의 `push()` 자동 생성 ID 사용
- 시간 기반으로 정렬됨

**구조:**
```typescript
interface Message {
  id: string;                          // 메시지 ID
  roomId: string;                      // 채팅방 ID
  senderId: string;                    // 보낸 사람 UID
  senderName: string;                  // 보낸 사람 닉네임 (비정규화)
  senderPhotoURL: string | null;       // 보낸 사람 프로필 이미지
  text: string;                        // 메시지 내용
  timestamp: number;                   // 전송 시간 (ServerValue.TIMESTAMP)
  isRead: boolean;                     // 읽음 여부
  readAt?: number;                     // 읽은 시간
}
```

**예시:**
```json
{
  "messages": {
    "abc123__def456": {
      "-NxAbCd123": {
        "id": "-NxAbCd123",
        "roomId": "abc123__def456",
        "senderId": "abc123",
        "senderName": "홍길동",
        "senderPhotoURL": "https://storage.googleapis.com/...",
        "text": "안녕하세요!",
        "timestamp": 1704902400000,
        "isRead": false
      },
      "-NxAbCd124": {
        "id": "-NxAbCd124",
        "roomId": "abc123__def456",
        "senderId": "def456",
        "senderName": "김철수",
        "senderPhotoURL": "https://storage.googleapis.com/...",
        "text": "반갑습니다!",
        "timestamp": 1704902460000,
        "isRead": true,
        "readAt": 1704902470000
      }
    }
  }
}
```

---

### 4.3 userChats 노드

**경로:** `/userChats/{userId}/{roomId}`

**용도:** 사용자별 채팅방 목록 (인덱싱)

**구조:**
```typescript
interface UserChatIndex {
  roomId: string;                      // 채팅방 ID
  otherUserId: string;                 // 상대방 UID
  otherUserName: string;               // 상대방 닉네임
  otherUserPhotoURL: string | null;    // 상대방 프로필 이미지
  lastMessageText: string;             // 마지막 메시지
  lastMessageTimestamp: number;        // 마지막 메시지 시간
  unreadCount: number;                 // 읽지 않은 메시지 수
  updatedAt: number;                   // 마지막 업데이트 시간
}
```

**예시:**
```json
{
  "userChats": {
    "abc123": {
      "abc123__def456": {
        "roomId": "abc123__def456",
        "otherUserId": "def456",
        "otherUserName": "김철수",
        "otherUserPhotoURL": "https://storage.googleapis.com/...",
        "lastMessageText": "반갑습니다!",
        "lastMessageTimestamp": 1704902460000,
        "unreadCount": 1,
        "updatedAt": 1704902460000
      }
    },
    "def456": {
      "abc123__def456": {
        "roomId": "abc123__def456",
        "otherUserId": "abc123",
        "otherUserName": "홍길동",
        "otherUserPhotoURL": "https://storage.googleapis.com/...",
        "lastMessageText": "반갑습니다!",
        "lastMessageTimestamp": 1704902460000,
        "unreadCount": 0,
        "updatedAt": 1704902460000
      }
    }
  }
}
```

**userChats 사용 이유:**
- 사용자의 채팅 목록을 빠르게 조회
- 읽지 않은 메시지 수 표시
- 마지막 메시지 미리보기
--
---

## 5. 주요 기능 구현

### 5.1 채팅방 ID 생성

```typescript
const createRoomId = (userId1: string, userId2: string): string => {
  // 알파벳 순으로 정렬하여 항상 같은 ID 생성
  return [userId1, userId2].sort().join('__');
};

// 예시
const roomId = createRoomId('abc123', 'def456');
// → "abc123__def456"
```

---

### 5.2 채팅방 생성 또는 가져오기

```typescript
const getOrCreateChatRoom = async (
  currentUserId: string,
  otherUserId: string,
  currentUserData: { displayName: string; photoURL: string | null },
  otherUserData: { displayName: string; photoURL: string | null }
) => {
  const roomId = createRoomId(currentUserId, otherUserId);
  const roomRef = ref(database, `chatRooms/${roomId}`);
  
  // 채팅방 존재 확인
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) {
    // 새 채팅방 생성
    const now = Date.now();
    
    await set(roomRef, {
      id: roomId,
      participants: {
        [currentUserId]: {
          uid: currentUserId,
          displayName: currentUserData.displayName,
          photoURL: currentUserData.photoURL,
          joinedAt: now
        },
        [otherUserId]: {
          uid: otherUserId,
          displayName: otherUserData.displayName,
          photoURL: otherUserData.photoURL,
          joinedAt: now
        }
      },
      lastMessage: null,
      createdAt: now,
      updatedAt: now
    });
    
    // userChats 인덱스 생성
    await set(ref(database, `userChats/${currentUserId}/${roomId}`), {
      roomId,
      otherUserId,
      otherUserName: otherUserData.displayName,
      otherUserPhotoURL: otherUserData.photoURL,
      lastMessageText: '',
      lastMessageTimestamp: now,
      unreadCount: 0,
      updatedAt: now
    });
    
    await set(ref(database, `userChats/${otherUserId}/${roomId}`), {
      roomId,
      otherUserId: currentUserId,
      otherUserName: currentUserData.displayName,
      otherUserPhotoURL: currentUserData.photoURL,
      lastMessageText: '',
      lastMessageTimestamp: now,
      unreadCount: 0,
      updatedAt: now
    });
  }
  
  return roomId;
};
```

---

### 5.3 메시지 전송

```typescript
const sendMessage = async (
  roomId: string,
  senderId: string,
  senderName: string,
  senderPhotoURL: string | null,
  text: string,
  recipientId: string
) => {
  // 1. 메시지 추가
  const messagesRef = ref(database, `messages/${roomId}`);
  const newMessageRef = push(messagesRef);
  
  const message = {
    id: newMessageRef.key,
    roomId,
    senderId,
    senderName,
    senderPhotoURL,
    text,
    timestamp: serverTimestamp(),
    isRead: false
  };
  
  await set(newMessageRef, message);
  
  // 2. 채팅방의 lastMessage 업데이트
  await update(ref(database, `chatRooms/${roomId}`), {
    lastMessage: {
      text,
      senderId,
      senderName,
      timestamp: serverTimestamp(),
      isRead: false
    },
    updatedAt: serverTimestamp()
  });
  
  // 3. userChats 인덱스 업데이트
  const now = Date.now();
  
  // 보낸 사람
  await update(ref(database, `userChats/${senderId}/${roomId}`), {
    lastMessageText: text,
    lastMessageTimestamp: now,
    updatedAt: now
  });
  
  // 받는 사람 (unreadCount 증가)
  await runTransaction(
    ref(database, `userChats/${recipientId}/${roomId}/unreadCount`),
    (currentCount) => (currentCount || 0) + 1
  );
  
  await update(ref(database, `userChats/${recipientId}/${roomId}`), {
    lastMessageText: text,
    lastMessageTimestamp: now,
    updatedAt: now
  });
};
```

---

### 5.4 메시지 실시간 수신

```typescript
const subscribeToMessages = (
  roomId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = ref(database, `messages/${roomId}`);
  const q = query(messagesRef, orderByChild('timestamp'), limitToLast(50));
  
  const unsubscribe = onValue(q, (snapshot) => {
    const messages: Message[] = [];
    
    snapshot.forEach((child) => {
      messages.push({
        id: child.key!,
        ...child.val()
      });
    });
    
    callback(messages);
  });
  
  return unsubscribe; // 구독 해제 함수 반환
};

// 사용 예시
const unsubscribe = subscribeToMessages('abc123__def456', (messages) => {
  console.log('새 메시지:', messages);
});

// 컴포넌트 언마운트 시
unsubscribe();
```

---

### 5.5 메시지 읽음 처리

```typescript
const markMessagesAsRead = async (
  roomId: string,
  currentUserId: string,
  otherUserId: string
) => {
  const messagesRef = ref(database, `messages/${roomId}`);
  const q = query(
    messagesRef,
    orderByChild('senderId'),
    equalTo(otherUserId)
  );
  
  const snapshot = await get(q);
  const updates: { [key: string]: any } = {};
  
  snapshot.forEach((child) => {
    const message = child.val();
    if (!message.isRead) {
      updates[`messages/${roomId}/${child.key}/isRead`] = true;
      updates[`messages/${roomId}/${child.key}/readAt`] = Date.now();
    }
  });
  
  // unreadCount 초기화
  updates[`userChats/${currentUserId}/${roomId}/unreadCount`] = 0;
  
  // 채팅방의 lastMessage.isRead 업데이트
  updates[`chatRooms/${roomId}/lastMessage/isRead`] = true;
  
  await update(ref(database), updates);
};
```

---

### 5.6 사용자의 채팅 목록 가져오기

```typescript
const getUserChatRooms = (
  userId: string,
  callback: (chatRooms: UserChatIndex[]) => void
) => {
  const userChatsRef = ref(database, `userChats/${userId}`);
  const q = query(userChatsRef, orderByChild('updatedAt'));
  
  const unsubscribe = onValue(q, (snapshot) => {
    const chatRooms: UserChatIndex[] = [];
    
    snapshot.forEach((child) => {
      chatRooms.unshift({ // 최신순으로 정렬
        ...child.val()
      });
    });
    
    callback(chatRooms);
  });
  
  return unsubscribe;
};
```

---

## 6. Realtime Database Security Rules

```json
{
  "rules": {
    "chatRooms": {
      "$roomId": {
        ".read": "auth != null && (
          data.child('participants').child(auth.uid).exists()
        )",
        ".write": "auth != null && (
          data.child('participants').child(auth.uid).exists() ||
          !data.exists()
        )"
      }
    },
    "messages": {
      "$roomId": {
        ".read": "auth != null && (
          root.child('chatRooms').child($roomId).child('participants').child(auth.uid).exists()
        )",
        "$messageId": {
          ".write": "auth != null && (
            root.child('chatRooms').child($roomId).child('participants').child(auth.uid).exists() &&
            newData.child('senderId').val() === auth.uid
          )"
        }
      }
    },
    "userChats": {
      "$userId": {
        ".read": "auth != null && auth.uid === $userId",
        "$roomId": {
          ".write": "auth != null && auth.uid === $userId"
        }
      }
    }
  }
}
```

**규칙 설명:**
- 채팅방: 참여자만 읽기/쓰기 가능
- 메시지: 채팅방 참여자만 읽기 가능, 본인이 보낸 메시지만 쓰기 가능
- userChats: 본인의 채팅 목록만 읽기/쓰기 가능

---

## 7. 인덱싱 설정

Firebase Console에서 다음 인덱스 설정:

```json
{
  "rules": {
    "messages": {
      "$roomId": {
        ".indexOn": ["timestamp", "senderId", "isRead"]
      }
    },
    "userChats": {
      "$userId": {
        ".indexOn": ["updatedAt", "lastMessageTimestamp"]
      }
    }
  }
}
```

---

## 8. 성능 최적화

### 8.1 메시지 페이지네이션

```typescript
// 최근 50개 메시지만 가져오기
const q = query(
  ref(database, `messages/${roomId}`),
  orderByChild('timestamp'),
  limitToLast(50)
);

// 더 이전 메시지 가져오기
const loadMoreMessages = (oldestTimestamp: number) => {
  const q = query(
    ref(database, `messages/${roomId}`),
    orderByChild('timestamp'),
    endBefore(oldestTimestamp),
    limitToLast(20)
  );
  
  return get(q);
};
```

### 8.2 오프라인 지원

```typescript
// 오프라인 지속성 활성화
import { enablePersistence } from 'firebase/database';

enablePersistence(database)
  .then(() => console.log('오프라인 지원 활성화'))
  .catch(err => console.error('오프라인 지원 실패:', err));
```

### 8.3 연결 상태 모니터링

```typescript
const connectedRef = ref(database, '.info/connected');

onValue(connectedRef, (snapshot) => {
  if (snapshot.val() === true) {
    console.log('연결됨');
  } else {
    console.log('연결 끊김');
  }
});
```

---

## 9. 데이터 비정규화 전략

### 비정규화된 데이터
- `senderName`, `senderPhotoURL` in messages
- `otherUserName`, `otherUserPhotoURL` in userChats
- `lastMessage` in chatRooms

### 프로필 변경 시 업데이트

```typescript
const updateUserProfileInChats = async (
  userId: string,
  newDisplayName: string,
  newPhotoURL: string | null
) => {
  // 1. 모든 채팅방의 participants 업데이트
  const chatRoomsRef = ref(database, 'chatRooms');
  const snapshot = await get(chatRoomsRef);
  const updates: { [key: string]: any } = {};
  
  snapshot.forEach((child) => {
    const roomId = child.key!;
    const room = child.val();
    
    if (room.participants[userId]) {
      updates[`chatRooms/${roomId}/participants/${userId}/displayName`] = newDisplayName;
      updates[`chatRooms/${roomId}/participants/${userId}/photoURL`] = newPhotoURL;
    }
  });
  
  // 2. userChats의 상대방 정보 업데이트
  // (복잡하므로 Cloud Functions 권장)
  
  await update(ref(database), updates);
};
```

---

## 10. 추가 기능 고려사항

### 10.1 타이핑 표시 (선택)

```json
{
  "typing": {
    "{roomId}": {
      "{userId}": true
    }
  }
}
```

### 10.2 온라인 상태 표시 (선택)

```json
{
  "presence": {
    "{userId}": {
      "online": true,
      "lastSeen": 1704902400000
    }
  }
}
```

### 10.3 메시지 삭제 (선택)

```typescript
const deleteMessage = async (roomId: string, messageId: string) => {
  await remove(ref(database, `messages/${roomId}/${messageId}`));
};
```

---

## 11. 비용 최적화

- **메시지 제한**: 오래된 메시지 자동 삭제 (Cloud Functions)
- **페이지네이션**: 한 번에 모든 메시지를 가져오지 않음
- **리스너 최소화**: 필요한 곳에만 실시간 리스너 사용
- **오프라인 캐시**: 네트워크 사용 최소화

---

## 12. 테스트 시나리오

1. **채팅방 생성**: 두 사용자 간 새 채팅방 생성
2. **메시지 전송**: 메시지 전송 및 실시간 수신 확인
3. **읽음 처리**: 상대방이 메시지를 읽었을 때 상태 업데이트
4. **채팅 목록**: 사용자의 모든 채팅방 목록 표시
5. **읽지 않은 메시지**: 읽지 않은 메시지 수 표시
6. **오프라인**: 오프라인 상태에서 메시지 전송 후 재연결 시 동기화

