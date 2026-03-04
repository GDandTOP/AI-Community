import { Link } from 'react-router-dom'
import { Home, User, BookMarked, Search, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { MessageNotification } from '@/components/chat/MessageNotification'
import { ChatListPopup } from '@/components/chat/ChatListPopup'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { signOut } from '@/services/auth.service'
import { useState } from 'react'

export function Header() {
  const { currentUser } = useAuth()
  const { openChats, showChatList, setShowChatList, openChatFromPreview, closeChat } = useChat()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('로그아웃 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-xl font-bold">AI</span>
          </div>
          <span className="hidden font-bold sm:inline-block">
            AI Community
          </span>
        </Link>

        {/* Search Bar */}
        {currentUser && (
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="검색..."
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex items-center space-x-2">
          {currentUser ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <Home className="h-5 w-5" />
                  <span className="sr-only">홈</span>
                </Link>
              </Button>
              <MessageNotification onClick={() => setShowChatList(!showChatList)} />
              <Button variant="ghost" size="icon" asChild>
                <Link to="/bookmarks">
                  <BookMarked className="h-5 w-5" />
                  <span className="sr-only">북마크</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/profile">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="프로필"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="sr-only">프로필</span>
                </Link>
              </Button>
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentUser.displayName || currentUser.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={loading}
                  title="로그아웃"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">로그아웃</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link to="/login">로그인</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </nav>
      </div>

      {/* Mobile Search Bar */}
      {currentUser && (
        <div className="container pb-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="검색..."
              className="pl-10"
            />
          </div>
        </div>
      )}

    </header>

    {/* 채팅 목록 팝업 */}
    {showChatList && currentUser && (
      <ChatListPopup
        onClose={() => setShowChatList(false)}
        onSelectChat={openChatFromPreview}
        position={{ top: 70, right: 20 }}
      />
    )}

    {/* 열린 채팅창들 */}
    {openChats.map((chat, index) => {
      // 최대 3개까지만 표시
      if (index >= 3) return null
      
      // 오른쪽에서부터 차례로 왼쪽으로 배치
      // 첫 번째: right 16px, 두 번째: right 412px, 세 번째: right 808px
      const chatWindowWidth = 380
      const gap = 16
      
      return (
        <ChatWindow
          key={chat.chatRoomId}
          chatRoomId={chat.chatRoomId}
          otherUserId={chat.otherUserId}
          otherUserName={chat.otherUserName}
          otherUserPhotoURL={chat.otherUserPhotoURL}
          onClose={() => closeChat(chat.chatRoomId)}
          position={{
            bottom: 16,
            right: 16 + index * (chatWindowWidth + gap),
          }}
        />
      )
    })}
    </>
  )
}
