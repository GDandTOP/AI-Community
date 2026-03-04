import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getOrCreateChatRoom } from '@/services/chat.service'
import type { ChatPreview } from '@/types/chat.types'

export interface OpenChat {
  chatRoomId: string
  otherUserId: string
  otherUserName: string
  otherUserPhotoURL?: string | null
}

interface ChatContextType {
  openChats: OpenChat[]
  showChatList: boolean
  setShowChatList: (show: boolean) => void
  openChat: (
    otherUserId: string,
    otherUserName: string,
    otherUserPhotoURL?: string | null
  ) => Promise<void>
  openChatFromPreview: (chatPreview: ChatPreview) => void
  closeChat: (chatRoomId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [showChatList, setShowChatList] = useState(false)

  const openChat = async (
    otherUserId: string,
    otherUserName: string,
    otherUserPhotoURL?: string | null
  ) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      // 채팅방 ID 생성 또는 가져오기
      const chatRoomId = await getOrCreateChatRoom(
        currentUser.uid,
        currentUser.displayName || '익명',
        currentUser.photoURL,
        otherUserId,
        otherUserName,
        otherUserPhotoURL
      )

      // 이미 열려있는 채팅인지 확인
      const isAlreadyOpen = openChats.some((c) => c.chatRoomId === chatRoomId)

      if (!isAlreadyOpen) {
        setOpenChats((prev) => [
          ...prev,
          {
            chatRoomId,
            otherUserId,
            otherUserName,
            otherUserPhotoURL,
          },
        ])
      }
    } catch (error) {
      console.error('채팅방 생성 실패:', error)
      alert('채팅방을 열 수 없습니다.')
    }
  }

  const openChatFromPreview = (chatPreview: ChatPreview) => {
    // ChatPreview에서 직접 채팅창 열기
    const isAlreadyOpen = openChats.some((c) => c.chatRoomId === chatPreview.chatRoomId)

    if (!isAlreadyOpen) {
      setOpenChats((prev) => [
        ...prev,
        {
          chatRoomId: chatPreview.chatRoomId,
          otherUserId: chatPreview.otherUserId,
          otherUserName: chatPreview.otherUserName,
          otherUserPhotoURL: chatPreview.otherUserPhotoURL,
        },
      ])
    }
  }

  const closeChat = (chatRoomId: string) => {
    setOpenChats((prev) => prev.filter((chat) => chat.chatRoomId !== chatRoomId))
  }

  return (
    <ChatContext.Provider
      value={{
        openChats,
        showChatList,
        setShowChatList,
        openChat,
        openChatFromPreview,
        closeChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

