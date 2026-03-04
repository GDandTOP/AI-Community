import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToChatRooms, getTotalUnreadCount } from '@/services/chat.service'
import type { ChatPreview } from '@/types/chat.types'

interface MessageNotificationProps {
  onClick: () => void
}

export function MessageNotification({ onClick }: MessageNotificationProps) {
  const { currentUser } = useAuth()
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

  useEffect(() => {
    if (!currentUser) {
      setTotalUnreadCount(0)
      return
    }

    const unsubscribe = subscribeToChatRooms(
      currentUser.uid,
      (chatPreviews: ChatPreview[]) => {
        const count = getTotalUnreadCount(chatPreviews)
        setTotalUnreadCount(count)
      },
      (error) => {
        console.error('채팅 알림 구독 오류:', error)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="relative">
      <MessageSquare className="h-5 w-5" />
      {totalUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-semibold">
          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
        </span>
      )}
      <span className="sr-only">메시지</span>
    </Button>
  )
}

