import { useState } from 'react'
import { ChatWindow } from './ChatWindow'
import { ChatListPopup } from './ChatListPopup'
import { MessageNotification } from './MessageNotification'
import type { ChatPreview } from '@/types/chat.types'

interface OpenChat {
  chatRoomId: string
  otherUserId: string
  otherUserName: string
  otherUserPhotoURL?: string | null
}

export function ChatManager() {
  const [showChatList, setShowChatList] = useState(false)
  const [openChats, setOpenChats] = useState<OpenChat[]>([])

  const handleOpenChat = (chat: ChatPreview | OpenChat) => {
    // 이미 열려있는 채팅인지 확인
    const isAlreadyOpen = openChats.some((c) => c.chatRoomId === chat.chatRoomId)

    if (!isAlreadyOpen) {
      setOpenChats((prev) => [
        ...prev,
        {
          chatRoomId: chat.chatRoomId,
          otherUserId: chat.otherUserId,
          otherUserName: chat.otherUserName,
          otherUserPhotoURL: chat.otherUserPhotoURL,
        },
      ])
    }
  }

  const handleCloseChat = (chatRoomId: string) => {
    setOpenChats((prev) => prev.filter((chat) => chat.chatRoomId !== chatRoomId))
  }

  return (
    <>
      {/* 메시지 알림 아이콘 */}
      <MessageNotification onClick={() => setShowChatList(!showChatList)} />

      {/* 채팅 목록 팝업 */}
      {showChatList && (
        <ChatListPopup
          onClose={() => setShowChatList(false)}
          onSelectChat={handleOpenChat}
          position={{ top: 64, right: 16 }}
        />
      )}

      {/* 열린 채팅창들 */}
      {openChats.map((chat, index) => (
        <ChatWindow
          key={chat.chatRoomId}
          chatRoomId={chat.chatRoomId}
          otherUserId={chat.otherUserId}
          otherUserName={chat.otherUserName}
          otherUserPhotoURL={chat.otherUserPhotoURL}
          onClose={() => handleCloseChat(chat.chatRoomId)}
          position={{
            bottom: 16,
            right: 16 + index * 400, // 여러 채팅창을 옆으로 배치
          }}
        />
      ))}
    </>
  )
}

// 전역적으로 채팅을 열 수 있도록 커스텀 훅 제공
export function useChatManager() {
  const [chatManagerInstance, setChatManagerInstance] = useState<{
    openChat: (chat: {
      chatRoomId: string
      otherUserId: string
      otherUserName: string
      otherUserPhotoURL?: string | null
    }) => void
  } | null>(null)

  return {
    chatManagerInstance,
    setChatManagerInstance,
  }
}

