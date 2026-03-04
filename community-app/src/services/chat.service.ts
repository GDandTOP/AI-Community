import { ref, push, set, onValue, query, orderByChild, get, update, remove, off } from 'firebase/database'
import { realtimeDb } from './firebase'
import type { Message, ChatRoom, ChatPreview } from '@/types/chat.types'

// 채팅방 ID 생성 (두 사용자 ID를 정렬하여 일관된 ID 생성)
export function generateChatRoomId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_')
}

// 채팅방 생성 또는 가져오기
export async function getOrCreateChatRoom(
  currentUserId: string,
  currentUserName: string,
  currentUserPhotoURL: string | null | undefined,
  otherUserId: string,
  otherUserName: string,
  otherUserPhotoURL: string | null | undefined
): Promise<string> {
  const chatRoomId = generateChatRoomId(currentUserId, otherUserId)
  const chatRoomRef = ref(realtimeDb, `chatRooms/${chatRoomId}`)

  // 채팅방이 이미 존재하는지 확인
  const snapshot = await get(chatRoomRef)

  if (!snapshot.exists()) {
    // 채팅방이 없으면 새로 생성
    const newChatRoom: Omit<ChatRoom, 'id'> = {
      participants: [currentUserId, otherUserId],
      participantNames: {
        [currentUserId]: currentUserName,
        [otherUserId]: otherUserName,
      },
      participantPhotos: {
        [currentUserId]: currentUserPhotoURL || null,
        [otherUserId]: otherUserPhotoURL || null,
      },
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await set(chatRoomRef, newChatRoom)
  }

  return chatRoomId
}

// 메시지 전송
export async function sendMessage(
  chatRoomId: string,
  senderId: string,
  senderName: string,
  senderPhotoURL: string | null | undefined,
  text: string
): Promise<void> {
  const messagesRef = ref(realtimeDb, `messages/${chatRoomId}`)
  const newMessageRef = push(messagesRef)

  const message: Omit<Message, 'id'> = {
    chatRoomId,
    senderId,
    senderName,
    senderPhotoURL: senderPhotoURL || null,
    text,
    timestamp: Date.now(),
    read: false,
  }

  await set(newMessageRef, message)

  // 채팅방 정보 업데이트 (마지막 메시지, 읽지 않은 메시지 수)
  const chatRoomRef = ref(realtimeDb, `chatRooms/${chatRoomId}`)
  const chatRoomSnapshot = await get(chatRoomRef)

  if (chatRoomSnapshot.exists()) {
    const chatRoom = chatRoomSnapshot.val() as ChatRoom
    const otherUserId = chatRoom.participants.find(id => id !== senderId)

    if (otherUserId) {
      const updates: any = {
        lastMessage: text,
        lastMessageTime: Date.now(),
        lastMessageSenderId: senderId,
        updatedAt: Date.now(),
        [`unreadCount/${otherUserId}`]: (chatRoom.unreadCount[otherUserId] || 0) + 1,
      }

      await update(chatRoomRef, updates)
    }
  }
}

// 메시지 읽음 처리 (개별 메시지)
export async function markMessageAsRead(
  chatRoomId: string,
  messageId: string,
  readerId: string
): Promise<void> {
  const messageRef = ref(realtimeDb, `messages/${chatRoomId}/${messageId}`)
  const messageSnapshot = await get(messageRef)

  if (messageSnapshot.exists()) {
    const message = messageSnapshot.val() as Message

    // 자신이 보낸 메시지가 아니고, 아직 읽지 않은 경우에만 읽음 처리
    if (message.senderId !== readerId && !message.read) {
      await update(messageRef, {
        read: true,
        readAt: Date.now(),
      })
    }
  }
}

// 메시지 실시간 구독
export function subscribeToMessages(
  chatRoomId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): () => void {
  const messagesRef = ref(realtimeDb, `messages/${chatRoomId}`)
  const messagesQuery = query(messagesRef, orderByChild('timestamp'))

  onValue(
    messagesQuery,
    (snapshot) => {
      const messages: Message[] = []
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        } as Message)
      })
      callback(messages)
    },
    (error) => {
      if (onError) {
        onError(error as Error)
      }
    }
  )

  return () => off(messagesQuery)
}

// 채팅방 목록 실시간 구독 (현재 사용자가 참여한 채팅방)
export function subscribeToChatRooms(
  currentUserId: string,
  callback: (chatPreviews: ChatPreview[]) => void,
  onError?: (error: Error) => void
): () => void {
  const chatRoomsRef = ref(realtimeDb, 'chatRooms')

  onValue(
    chatRoomsRef,
    (snapshot) => {
      const chatPreviews: ChatPreview[] = []

      snapshot.forEach((childSnapshot) => {
        const chatRoom = childSnapshot.val() as ChatRoom
        const chatRoomId = childSnapshot.key!

        // 현재 사용자가 참여한 채팅방만 필터링
        if (chatRoom.participants.includes(currentUserId)) {
          const otherUserId = chatRoom.participants.find(id => id !== currentUserId)

          if (otherUserId) {
            chatPreviews.push({
              chatRoomId,
              otherUserId,
              otherUserName: chatRoom.participantNames[otherUserId] || '알 수 없음',
              otherUserPhotoURL: chatRoom.participantPhotos[otherUserId] || null,
              lastMessage: chatRoom.lastMessage,
              lastMessageTime: chatRoom.lastMessageTime,
              unreadCount: chatRoom.unreadCount[currentUserId] || 0,
            })
          }
        }
      })

      // 마지막 메시지 시간으로 정렬 (최신순)
      chatPreviews.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))

      callback(chatPreviews)
    },
    (error) => {
      if (onError) {
        onError(error as Error)
      }
    }
  )

  return () => off(chatRoomsRef)
}

// 메시지 읽음 처리 (채팅방의 unreadCount만 초기화)
export async function markMessagesAsRead(chatRoomId: string, currentUserId: string): Promise<void> {
  try {
    const chatRoomRef = ref(realtimeDb, `chatRooms/${chatRoomId}`)
    const chatRoomSnapshot = await get(chatRoomRef)
    
    if (chatRoomSnapshot.exists()) {
      const currentUnreadCount = chatRoomSnapshot.val().unreadCount?.[currentUserId] || 0
      
      // unreadCount가 0보다 클 때만 업데이트 (불필요한 업데이트 방지)
      if (currentUnreadCount > 0) {
        await update(chatRoomRef, {
          [`unreadCount/${currentUserId}`]: 0,
        })
        console.log(`✅ 읽음 처리 완료: ${chatRoomId}, ${currentUnreadCount} → 0`)
      }
    }
  } catch (error) {
    console.error('❌ 읽음 처리 실패:', error)
  }
}

// 총 읽지 않은 메시지 수 계산
export function getTotalUnreadCount(chatPreviews: ChatPreview[]): number {
  return chatPreviews.reduce((total, chat) => total + chat.unreadCount, 0)
}

// 타이핑 상태 업데이트
export async function updateTypingStatus(
  chatRoomId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  const chatRoomRef = ref(realtimeDb, `chatRooms/${chatRoomId}`)
  
  if (isTyping) {
    // 타이핑 중: 현재 timestamp 저장
    await update(chatRoomRef, {
      [`typing/${userId}`]: Date.now(),
    })
  } else {
    // 타이핑 중지: 해당 필드 삭제
    const typingRef = ref(realtimeDb, `chatRooms/${chatRoomId}/typing/${userId}`)
    await remove(typingRef)
  }
}

// 타이핑 상태 구독
export function subscribeToTypingStatus(
  chatRoomId: string,
  currentUserId: string,
  callback: (isTyping: boolean) => void
): () => void {
  const typingRef = ref(realtimeDb, `chatRooms/${chatRoomId}/typing`)
  
  onValue(typingRef, (snapshot) => {
    if (snapshot.exists()) {
      const typingData = snapshot.val()
      const now = Date.now()
      
      // 다른 사용자가 5초 이내에 타이핑했는지 확인
      const isOtherUserTyping = Object.entries(typingData).some(([userId, timestamp]) => {
        return userId !== currentUserId && (now - (timestamp as number)) < 5000
      })
      
      callback(isOtherUserTyping)
    } else {
      callback(false)
    }
  })
  
  return () => off(typingRef)
}

// 채팅방 삭제 (선택적)
export async function deleteChatRoom(chatRoomId: string): Promise<void> {
  const chatRoomRef = ref(realtimeDb, `chatRooms/${chatRoomId}`)
  const messagesRef = ref(realtimeDb, `messages/${chatRoomId}`)

  await remove(chatRoomRef)
  await remove(messagesRef)
}

