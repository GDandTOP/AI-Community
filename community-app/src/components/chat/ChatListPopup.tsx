import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, MessageCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToChatRooms, markMessagesAsRead } from '@/services/chat.service'
import type { ChatPreview } from '@/types/chat.types'

interface ChatListPopupProps {
  onClose: () => void
  onSelectChat: (chatPreview: ChatPreview) => void
  position: { top: number; right: number }
}

export function ChatListPopup({ onClose, onSelectChat, position }: ChatListPopupProps) {
  const { currentUser } = useAuth()
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([])

  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToChatRooms(
      currentUser.uid,
      (previews) => {
        setChatPreviews(previews)
      },
      (error) => {
        console.error('채팅 목록 구독 오류:', error)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const days = Math.floor(diff / 86400000)
    
    const isToday = date.toDateString() === now.toDateString()
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString()

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (isToday) return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    if (isYesterday) return '어제'
    if (days < 7) return `${days}일 전`

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="fixed bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        width: '360px',
        maxHeight: '480px',
        zIndex: 9999,
      }}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            메시지
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            {chatPreviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">아직 대화가 없습니다</p>
                <p className="text-xs text-muted-foreground mt-1">
                  다른 사용자의 닉네임을 클릭하여 대화를 시작하세요
                </p>
              </div>
            ) : (
              chatPreviews.map((chat) => (
                <button
                  key={chat.chatRoomId}
                  onClick={async () => {
                    // 대화를 선택하면 읽음 처리
                    if (currentUser && chat.unreadCount > 0) {
                      await markMessagesAsRead(chat.chatRoomId, currentUser.uid)
                    }
                    onSelectChat(chat)
                    onClose()
                  }}
                  className="w-full flex items-start gap-3 p-4 hover:bg-muted/50 active:bg-muted transition-all border-b last:border-b-0 text-left"
                >
                  {/* 프로필 이미지 */}
                  <div className="relative flex-shrink-0">
                    {chat.otherUserPhotoURL ? (
                      <img
                        src={chat.otherUserPhotoURL}
                        alt={chat.otherUserName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-lg">
                          {chat.otherUserName[0]}
                        </span>
                      </div>
                    )}
                    {/* 읽지 않은 메시지 뱃지 */}
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* 대화 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm truncate">
                        {chat.otherUserName}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    {chat.lastMessage && (
                      <p
                        className={`text-sm truncate leading-relaxed ${
                          chat.unreadCount > 0
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

