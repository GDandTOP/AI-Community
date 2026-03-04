import { useState, useRef, useEffect } from 'react'
import { MessageCircle, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { useNavigate } from 'react-router-dom'

interface UserNameButtonProps {
  userId: string
  userName: string
  userPhotoURL?: string | null
  className?: string
}

export function UserNameButton({ userId, userName, userPhotoURL, className = '' }: UserNameButtonProps) {
  const { currentUser } = useAuth()
  const { openChat } = useChat()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLSpanElement>(null)

  // 자기 자신의 닉네임이면 드롭다운 표시 안함
  const isSelf = currentUser?.uid === userId

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDropdown])

  const handleUserNameClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isSelf) {
      setShowDropdown(!showDropdown)
    }
  }

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      navigate('/login')
      return
    }

    await openChat(userId, userName, userPhotoURL)
    setShowDropdown(false)
  }

  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 프로필 페이지로 이동 (추후 구현 가능)
    console.log('프로필 보기:', userId)
    setShowDropdown(false)
  }

  if (isSelf) {
    // 자기 자신의 닉네임은 클릭 불가능한 텍스트로 표시
    return <span className={className}>{userName}</span>
  }

  return (
    <span className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleUserNameClick}
        className={`hover:underline cursor-pointer ${className}`}
      >
        {userName}
      </button>

      {/* 드롭다운 메뉴 */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[160px] overflow-hidden">
          <div className="py-1">
            <button
              onClick={handleStartChat}
              className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              대화하기
            </button>
            <button
              onClick={handleViewProfile}
              className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              프로필 보기
            </button>
          </div>
        </div>
      )}
    </span>
  )
}

