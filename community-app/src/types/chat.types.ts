export interface Message {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  senderPhotoURL?: string | null
  text: string
  timestamp: number
  read: boolean
  readAt?: number
}

export interface ChatRoom {
  id: string
  participants: string[] // [userId1, userId2]
  participantNames: { [userId: string]: string }
  participantPhotos: { [userId: string]: string | null }
  lastMessage?: string
  lastMessageTime?: number
  lastMessageSenderId?: string
  unreadCount: { [userId: string]: number } // 각 사용자별 읽지 않은 메시지 수
  typing?: { [userId: string]: number } // 타이핑 상태 (timestamp)
  createdAt: number
  updatedAt: number
}

export interface ChatPreview {
  chatRoomId: string
  otherUserId: string
  otherUserName: string
  otherUserPhotoURL?: string | null
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
}

