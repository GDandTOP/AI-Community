import { useState, useEffect, useRef } from 'react'
import { X, Send, Minimize2, Maximize2, Check, CheckCheck, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { 
  subscribeToMessages, 
  sendMessage, 
  markMessagesAsRead, 
  markMessageAsRead,
  updateTypingStatus,
  subscribeToTypingStatus 
} from '@/services/chat.service'
import type { Message } from '@/types/chat.types'

interface ChatWindowProps {
  chatRoomId: string
  otherUserId: string
  otherUserName: string
  otherUserPhotoURL?: string | null
  onClose: () => void
  position: { bottom: number; right: number }
}

export function ChatWindow({
  chatRoomId,
  otherUserName,
  otherUserPhotoURL,
  onClose,
  position,
}: ChatWindowProps) {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<number | null>(null)

  // 메시지 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      chatRoomId,
      (updatedMessages) => {
        setMessages(updatedMessages)
      },
      (error) => {
        console.error('메시지 구독 오류:', error)
      }
    )

    return () => unsubscribe()
  }, [chatRoomId])

  // 타이핑 상태 구독
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToTypingStatus(
      chatRoomId,
      currentUser.uid,
      (isTyping) => {
        setIsOtherUserTyping(isTyping)
      }
    )

    return () => unsubscribe()
  }, [chatRoomId, currentUser])

  // 메시지가 추가되면 스크롤을 맨 아래로
  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom()
    }
  }, [messages, isMinimized])

  // 채팅창이 열리거나 새 메시지가 도착하면 읽음 처리
  useEffect(() => {
    if (currentUser && !isMinimized && messages.length > 0) {
      // 읽지 않은 메시지 필터링
      const unreadMessages = messages.filter(
        (message) => message.senderId !== currentUser.uid && !message.read
      )
      
      // 읽지 않은 메시지가 있으면 읽음 처리
      if (unreadMessages.length > 0) {
        // 1. 채팅방 unreadCount 초기화
        markMessagesAsRead(chatRoomId, currentUser.uid).then(() => {
          console.log('채팅방 읽음 처리 완료')
        }).catch((error) => {
          console.error('채팅방 읽음 처리 실패:', error)
        })
        
        // 2. 개별 메시지도 읽음 처리
        Promise.all(
          unreadMessages.map((message) =>
            markMessageAsRead(chatRoomId, message.id, currentUser.uid)
          )
        ).then(() => {
          console.log(`${unreadMessages.length}개 메시지 읽음 처리 완료`)
        }).catch((error) => {
          console.error('메시지 읽음 처리 실패:', error)
        })
      }
    }
  }, [chatRoomId, currentUser, isMinimized, messages])

  // 최소화 상태가 변경되면 포커스 조정
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isMinimized])

  // 스크롤 위치 감지
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // 컴포넌트 마운트 해제 시 타이핑 상태 제거
  useEffect(() => {
    return () => {
      if (currentUser) {
        updateTypingStatus(chatRoomId, currentUser.uid, false)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [chatRoomId, currentUser])

  const scrollToBottom = (smooth = true) => {
    if (smooth) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    if (!currentUser) return

    // 타이핑 중 상태 업데이트
    if (value.trim()) {
      updateTypingStatus(chatRoomId, currentUser.uid, true)

      // 5초 후 자동으로 타이핑 상태 제거
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(chatRoomId, currentUser.uid, false)
      }, 5000)
    } else {
      // 입력창이 비면 타이핑 상태 제거
      updateTypingStatus(chatRoomId, currentUser.uid, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !newMessage.trim()) return

    const messageToSend = newMessage.trim()
    
    // 즉시 입력창 비우기
    setNewMessage('')
    
    // 타이핑 상태 제거
    updateTypingStatus(chatRoomId, currentUser.uid, false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    try {
      setLoading(true)
      await sendMessage(
        chatRoomId,
        currentUser.uid,
        currentUser.displayName || '익명',
        currentUser.photoURL,
        messageToSend
      )
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      alert('메시지 전송에 실패했습니다.')
      // 실패 시 메시지 복구
      setNewMessage(messageToSend)
    } finally {
      setLoading(false)
      // Chrome 포커스 문제 해결: Promise.resolve로 마이크로태스크 큐 이후 실행
      Promise.resolve().then(() => {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus()
            // selection을 끝으로 이동 (추가 안정성)
            const len = inputRef.current.value.length
            inputRef.current.setSelectionRange(len, len)
          }
        })
      })
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? '오후' : '오전'
    const displayHours = hours % 12 || 12
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`
  }

  const formatDateSeparator = (timestamp: number) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '오늘'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제'
    } else {
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    }
  }

  // 날짜 구분선을 표시하기 위한 헬퍼 함수
  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true

    const currentDate = new Date(currentMsg.timestamp).toDateString()
    const prevDate = new Date(prevMsg.timestamp).toDateString()

    return currentDate !== prevDate
  }

  // 메시지 그룹핑 헬퍼 함수
  const shouldGroupWithPrevious = (currentMsg?: Message, prevMsg?: Message) => {
    if (!currentMsg || !prevMsg) return false
    
    // 같은 발신자이고, 5분 이내 메시지면 그룹핑
    const isSameSender = currentMsg.senderId === prevMsg.senderId
    const timeDiff = currentMsg.timestamp - prevMsg.timestamp
    const isWithin5Minutes = timeDiff < 5 * 60 * 1000 // 5분
    
    return isSameSender && isWithin5Minutes
  }

  return (
    <div
      className="flex flex-col bg-background border border-border rounded-lg shadow-2xl overflow-hidden transition-all duration-200"
      style={{
        position: 'fixed',
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
        width: '380px',
        height: isMinimized ? '56px' : '500px',
        zIndex: 9999,
        top: 'auto',
        left: 'auto',
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground border-b">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {otherUserPhotoURL ? (
            <img
              src={otherUserPhotoURL}
              alt={otherUserName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">{otherUserName[0]}</span>
            </div>
          )}
          <span className="font-semibold truncate">{otherUserName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 메시지 영역 - 최소화되지 않았을 때만 표시 */}
      {!isMinimized && (
        <>
          {/* 메시지 목록 */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-muted/5 to-muted/10 relative"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent'
            }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <div className="text-4xl">💬</div>
                <div className="text-center">
                  <p className="font-medium">대화를 시작해보세요</p>
                  <p className="text-xs mt-1">메시지를 입력하여 대화를 시작할 수 있습니다</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isCurrentUser = message.senderId === currentUser?.uid
                  const prevMessage = index > 0 ? messages[index - 1] : undefined
                  const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined
                  const showDateSeparator = shouldShowDateSeparator(message, prevMessage)
                  const groupWithPrevious = shouldGroupWithPrevious(message, prevMessage)
                  const groupWithNext = shouldGroupWithPrevious(nextMessage, message)

                  return (
                    <div key={message.id}>
                      {/* 날짜 구분선 */}
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-4">
                          <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                            {formatDateSeparator(message.timestamp)}
                          </div>
                        </div>
                      )}

                      {/* 메시지 */}
                      <div
                        className={`flex gap-2 ${
                          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                        } ${groupWithPrevious ? 'mt-1' : 'mt-3'}`}
                      >
                        {/* 프로필 이미지 (상대방 메시지만, 그룹 마지막에만 표시) */}
                        {!isCurrentUser && (
                          <div className="flex-shrink-0 w-8">
                            {!groupWithNext && (
                              <>
                                {message.senderPhotoURL ? (
                                  <img
                                    src={message.senderPhotoURL}
                                    alt={message.senderName}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-xs font-semibold">
                                      {message.senderName[0]}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* 메시지 내용 */}
                        <div
                          className={`flex flex-col ${
                            isCurrentUser ? 'items-end' : 'items-start'
                          } max-w-[70%]`}
                        >
                          <div
                            className={`px-3 py-2 rounded-2xl shadow-sm ${
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/80 border border-border/50'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.text}
                            </p>
                          </div>
                          
                          {/* 시간과 읽음 표시 (그룹의 마지막 메시지만) */}
                          {!groupWithNext && (
                            <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* 내가 보낸 메시지인 경우 읽음 표시 */}
                              {isCurrentUser && (
                                <span className="text-xs">
                                  {message.read ? (
                                    <span className="flex items-center gap-0.5 text-blue-500" title="읽음">
                                      <CheckCheck className="h-3 w-3" />
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5 text-muted-foreground" title="전송됨">
                                      <Check className="h-3 w-3" />
                                    </span>
                                  )}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}

            {/* 스크롤 최하단 버튼 */}
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-2.5 shadow-lg hover:scale-110 transition-all duration-200 z-10"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 타이핑 인디케이터 */}
          {isOtherUserTyping && (
            <div className="px-4 py-2 bg-muted/20 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-2 bg-muted/80 rounded-2xl border border-border/50">
                  <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs text-muted-foreground">{otherUserName}님이 입력 중</span>
              </div>
            </div>
          )}

          {/* 입력 영역 */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 p-3 border-t bg-background/95 backdrop-blur-sm"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={handleInputChange}
              disabled={loading}
              autoFocus
              className="flex-1 px-4 py-2.5 text-sm rounded-full border border-input bg-muted/50 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              onKeyDown={(e) => {
                // Enter 키로 전송
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSendMessage(e as any)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !newMessage.trim()}
              className="flex-shrink-0 rounded-full h-10 w-10 transition-all hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  )
}

