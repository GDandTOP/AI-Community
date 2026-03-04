import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUserProfile } from '@/services/auth.service'
import { updateUserProfile, saveSurveyData } from '@/services/user.service'
import { uploadProfileImage, readImageAsDataURL, validateImageFile } from '@/services/storage.service'
import { getUserLikedPostIds, toggleLike } from '@/services/like.service'
import { getUserBookmarkedPosts, toggleBookmark, getUserBookmarkedPostIds } from '@/services/bookmark.service'
import { User, Edit2, Save, X, CheckCircle2, Camera, Upload, Heart, Bookmark, MessageCircle, Eye } from 'lucide-react'
import type { SurveyData } from '@/types/user.types'
import type { Post } from '@/types/post.types'

const INTERESTS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Midjourney',
  'Stable Diffusion',
  'AI 코딩',
  'AI 윤리',
  '머신러닝',
  '딥러닝',
  '자연어처리',
]

const TOPICS = [
  'AI 도구 사용법',
  '프롬프트 엔지니어링',
  'AI 뉴스',
  'AI 연구',
  'AI 개발',
  'AI 비즈니스',
  'AI 교육',
  '생성형 AI',
]

type TabType = 'profile' | 'liked' | 'bookmarked'

export function Profile() {
  const { currentUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  
  // 게시글 데이터
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  
  // 좋아요/북마크 상태
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  // 프로필 데이터
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    email: '',
    provider: '',
    photoURL: '',
    createdAt: null as any,
  })

  // 이미지 미리보기
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // 설문 데이터
  const [surveyData, setSurveyData] = useState<SurveyData>({
    interests: [],
    experienceLevel: 'beginner' as const,
    preferredTopics: [],
  })

  // 초기 데이터 로드
  useEffect(() => {
    loadProfile()
  }, [currentUser])

  // 탭 변경 시 게시글 로드
  useEffect(() => {
    if (activeTab === 'liked' && likedPosts.length === 0) {
      loadLikedPosts()
    } else if (activeTab === 'bookmarked' && bookmarkedPosts.length === 0) {
      loadBookmarkedPosts()
    }
  }, [activeTab])

  // 사용자의 좋아요/북마크 상태 로드
  useEffect(() => {
    if (currentUser) {
      loadUserInteractions()
    } else {
      setLikedPostIds(new Set())
      setBookmarkedPostIds(new Set())
    }
  }, [currentUser])

  // 게시글 로드 후 사용자 상호작용 상태 새로고침
  useEffect(() => {
    if (currentUser && (likedPosts.length > 0 || bookmarkedPosts.length > 0)) {
      loadUserInteractions()
    }
  }, [likedPosts.length, bookmarkedPosts.length, currentUser])

  const loadProfile = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const profile = await getUserProfile(currentUser.uid)
      
      if (profile) {
        setProfileData({
          displayName: profile.displayName || '',
          bio: profile.bio || '',
          email: profile.email || '',
          provider: profile.provider || '',
          photoURL: profile.photoURL || currentUser.photoURL || '',
          createdAt: profile.createdAt,
        })

        setSurveyData({
          interests: profile.interests || [],
          experienceLevel: profile.experienceLevel || 'beginner',
          preferredTopics: profile.preferredTopics || [],
        })

        // 현재 프로필 이미지를 미리보기로 설정
        setPreviewImage(profile.photoURL || currentUser.photoURL || null)
      }
    } catch (err) {
      console.error('프로필 로드 실패:', err)
      setError('프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadLikedPosts = async () => {
    if (!currentUser) return

    try {
      setPostsLoading(true)
      const likedPostIds = await getUserLikedPostIds(currentUser.uid)
      
      // 좋아요한 게시글의 상세 정보를 가져오기 위해 getUserPosts 사용
      // 또는 별도로 구현해야 함
      // 일단 간단하게 처리
      const postsPromises = likedPostIds.map(async (postId) => {
        const { getPost } = await import('@/services/post.service')
        return getPost(postId)
      })
      
      const posts = await Promise.all(postsPromises)
      setLikedPosts(posts.filter(p => p !== null) as Post[])
    } catch (err) {
      console.error('좋아요한 게시글 로드 실패:', err)
    } finally {
      setPostsLoading(false)
    }
  }

  const loadBookmarkedPosts = async () => {
    if (!currentUser) return

    try {
      setPostsLoading(true)
      const posts = await getUserBookmarkedPosts(currentUser.uid)
      setBookmarkedPosts(posts)
    } catch (err) {
      console.error('북마크한 게시글 로드 실패:', err)
    } finally {
      setPostsLoading(false)
    }
  }

  const loadUserInteractions = async () => {
    if (!currentUser) return

    try {
      const [likedIds, bookmarkedIds] = await Promise.all([
        getUserLikedPostIds(currentUser.uid),
        getUserBookmarkedPostIds(currentUser.uid),
      ])
      
      setLikedPostIds(new Set(likedIds))
      setBookmarkedPostIds(new Set(bookmarkedIds))
    } catch (err) {
      console.error('좋아요/북마크 상태 로드 실패:', err)
    }
  }

  const handleLikeToggle = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      navigate('/login')
      return
    }

    if (processingIds.has(postId)) return

    try {
      setProcessingIds(prev => new Set(prev).add(postId))
      
      const isLiked = likedPostIds.has(postId)
      
      // 낙관적 UI 업데이트
      if (isLiked) {
        setLikedPostIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      } else {
        setLikedPostIds(prev => new Set(prev).add(postId))
      }
      
      // 게시글 목록 업데이트
      setLikedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likeCount: isLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1 }
          : post
      ))
      
      setBookmarkedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likeCount: isLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1 }
          : post
      ))
      
      // 실제 데이터 업데이트
      await toggleLike(currentUser.uid, postId)
    } catch (err: any) {
      console.error('좋아요 처리 실패:', err)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleBookmarkToggle = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      navigate('/login')
      return
    }

    if (processingIds.has(postId)) return

    try {
      setProcessingIds(prev => new Set(prev).add(postId))
      
      const isBookmarked = bookmarkedPostIds.has(postId)
      
      // 낙관적 UI 업데이트
      if (isBookmarked) {
        setBookmarkedPostIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      } else {
        setBookmarkedPostIds(prev => new Set(prev).add(postId))
      }
      
      // 게시글 목록 업데이트
      setLikedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, bookmarkCount: isBookmarked ? Math.max(0, post.bookmarkCount - 1) : post.bookmarkCount + 1 }
          : post
      ))
      
      setBookmarkedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, bookmarkCount: isBookmarked ? Math.max(0, post.bookmarkCount - 1) : post.bookmarkCount + 1 }
          : post
      ))
      
      // 실제 데이터 업데이트
      await toggleBookmark(currentUser.uid, postId)
    } catch (err: any) {
      console.error('북마크 처리 실패:', err)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  // 이미지 파일 선택 핸들러
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 유효성 검사
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || '유효하지 않은 파일입니다.')
      return
    }

    try {
      // 미리보기 생성
      const dataURL = await readImageAsDataURL(file)
      setPreviewImage(dataURL)
      setSelectedFile(file)
      setError('')
    } catch (err: any) {
      setError(err.message || '이미지를 불러오는데 실패했습니다.')
    }
  }

  // 이미지 업로드 버튼 클릭
  const handleImageUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 이미지 업로드 및 저장
  const handleImageUpload = async () => {
    if (!currentUser || !selectedFile) return

    try {
      setUploading(true)
      setError('')

      // 이미지 업로드 및 Firestore 업데이트
      const downloadURL = await uploadProfileImage(
        currentUser.uid,
        selectedFile,
        profileData.photoURL
      )

      // 로컬 상태 업데이트
      setProfileData(prev => ({ ...prev, photoURL: downloadURL }))
      setPreviewImage(downloadURL)
      setSelectedFile(null)
      
      // AuthContext 갱신 (헤더 프로필 이미지 업데이트)
      await refreshUser()
      
      setSuccess('프로필 이미지가 업데이트되었습니다!')
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  // 이미지 변경 취소
  const handleImageCancel = () => {
    setPreviewImage(profileData.photoURL || currentUser?.photoURL || null)
    setSelectedFile(null)
    setError('')
  }

  const handleSave = async () => {
    if (!currentUser) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // 기본 프로필 업데이트
      await updateUserProfile(currentUser.uid, {
        displayName: profileData.displayName,
        bio: profileData.bio,
      })

      // 설문 데이터 업데이트
      await saveSurveyData(currentUser.uid, surveyData)

      setSuccess('프로필이 성공적으로 업데이트되었습니다!')
      setIsEditing(false)
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || '프로필 업데이트에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setSurveyData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const toggleTopic = (topic: string) => {
    setSurveyData(prev => ({
      ...prev,
      preferredTopics: prev.preferredTopics.includes(topic)
        ? prev.preferredTopics.filter(t => t !== topic)
        : [...prev.preferredTopics, topic]
    }))
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* 탭 네비게이션 */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('profile')}
          >
            프로필 정보
          </Button>
          <Button
            variant={activeTab === 'liked' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('liked')}
            className="gap-2"
          >
            <Heart className="h-4 w-4" />
            좋아요한 게시글
          </Button>
          <Button
            variant={activeTab === 'bookmarked' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('bookmarked')}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            북마크한 게시글
          </Button>
        </div>

        {/* 프로필 정보 탭 */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* 프로필 이미지 */}
            <div className="relative group">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="프로필 이미지"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-primary" />
                )}
              </div>
              
              {/* 이미지 변경 버튼 */}
              <button
                onClick={handleImageUploadClick}
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                title="이미지 변경"
              >
                <Camera className="h-5 w-5" />
              </button>
              
              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            
            {/* 사용자 정보 */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold">{profileData.displayName || '사용자'}</h1>
              <p className="text-muted-foreground mt-1">{profileData.email}</p>
              
              {/* 이미지 업로드 버튼 (파일 선택 후 표시) */}
              {selectedFile && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleImageUpload}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? '업로드 중...' : '이미지 저장'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImageCancel}
                    disabled={uploading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    취소
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* 편집 버튼 */}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              프로필 편집
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  handleImageCancel()
                  loadProfile() // 취소 시 원래 데이터로 복원
                }}
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                취소
              </Button>
            </div>
          )}
        </div>

        {/* 메시지 */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>프로필 기본 정보를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">이름</label>
              <Input
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                disabled={!isEditing}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">소개</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="자기소개를 입력하세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">가입 방법</p>
                <p className="text-sm font-medium mt-1">
                  {profileData.provider === 'google' ? 'Google 로그인' : '이메일 로그인'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">가입일</p>
                <p className="text-sm font-medium mt-1">
                  {profileData.createdAt 
                    ? new Date(profileData.createdAt.seconds * 1000).toLocaleDateString('ko-KR')
                    : '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 관심사 */}
        <Card>
          <CardHeader>
            <CardTitle>관심 있는 AI 도구</CardTitle>
            <CardDescription>관심있는 AI 도구를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERESTS.map(interest => (
                <Button
                  key={interest}
                  type="button"
                  variant={surveyData.interests.includes(interest) ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => isEditing && toggleInterest(interest)}
                  disabled={!isEditing}
                >
                  {surveyData.interests.includes(interest) && (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {interest}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 경험 수준 */}
        <Card>
          <CardHeader>
            <CardTitle>AI 사용 경험</CardTitle>
            <CardDescription>AI 사용 경험 수준을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'beginner', label: '초보자' },
                { value: 'intermediate', label: '중급자' },
                { value: 'advanced', label: '고급자' },
                { value: 'expert', label: '전문가' },
              ].map(level => (
                <Button
                  key={level.value}
                  type="button"
                  variant={surveyData.experienceLevel === level.value ? 'default' : 'outline'}
                  onClick={() => isEditing && setSurveyData(prev => ({ 
                    ...prev, 
                    experienceLevel: level.value as any 
                  }))}
                  disabled={!isEditing}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 선호 주제 */}
        <Card>
          <CardHeader>
            <CardTitle>선호하는 주제</CardTitle>
            <CardDescription>관심있는 콘텐츠 주제를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TOPICS.map(topic => (
                <Button
                  key={topic}
                  type="button"
                  variant={surveyData.preferredTopics.includes(topic) ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => isEditing && toggleTopic(topic)}
                  disabled={!isEditing}
                >
                  {surveyData.preferredTopics.includes(topic) && (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {topic}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* 좋아요한 게시글 탭 */}
        {activeTab === 'liked' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">좋아요한 게시글 ({likedPosts.length}개)</h2>
            
            {postsLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : likedPosts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">아직 좋아요한 게시글이 없습니다.</p>
                  <Button asChild>
                    <Link to="/">게시글 둘러보기</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              likedPosts.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {/* 작성자 프로필 */}
                        <div className="flex-shrink-0">
                          {post.authorPhotoURL ? (
                            <img
                              src={post.authorPhotoURL}
                              alt={post.authorName}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {post.authorName[0]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* 카테고리 */}
                          {post.category && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-primary/10 text-primary mb-2">
                              {post.category}
                            </span>
                          )}

                          {/* 제목 */}
                          <CardTitle className="text-xl mb-2">{post.title}</CardTitle>

                          {/* 작성자 및 시간 */}
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{post.authorName}</span>
                            <span>·</span>
                            <span>{formatDate(post.createdAt)}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.viewCount}
                            </span>
                          </CardDescription>

                          {/* 태그 */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {post.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <div className="flex gap-4">
                        <Button variant="ghost" size="sm" className="gap-2 pointer-events-none">
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          {post.likeCount}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 pointer-events-none">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentCount}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={(e) => handleBookmarkToggle(e, post.id)}
                          disabled={processingIds.has(post.id)}
                        >
                          <Bookmark
                            className={`h-4 w-4 transition-colors ${
                              bookmarkedPostIds.has(post.id) ? 'fill-blue-500 text-blue-500' : ''
                            }`}
                          />
                          {post.bookmarkCount}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {/* 북마크한 게시글 탭 */}
        {activeTab === 'bookmarked' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">북마크한 게시글 ({bookmarkedPosts.length}개)</h2>
            
            {postsLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : bookmarkedPosts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">아직 북마크한 게시글이 없습니다.</p>
                  <Button asChild>
                    <Link to="/">게시글 둘러보기</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              bookmarkedPosts.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {/* 작성자 프로필 */}
                        <div className="flex-shrink-0">
                          {post.authorPhotoURL ? (
                            <img
                              src={post.authorPhotoURL}
                              alt={post.authorName}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {post.authorName[0]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* 카테고리 */}
                          {post.category && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-primary/10 text-primary mb-2">
                              {post.category}
                            </span>
                          )}

                          {/* 제목 */}
                          <CardTitle className="text-xl mb-2">{post.title}</CardTitle>

                          {/* 작성자 및 시간 */}
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{post.authorName}</span>
                            <span>·</span>
                            <span>{formatDate(post.createdAt)}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.viewCount}
                            </span>
                          </CardDescription>

                          {/* 태그 */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {post.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={(e) => handleLikeToggle(e, post.id)}
                          disabled={processingIds.has(post.id)}
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              likedPostIds.has(post.id) ? 'fill-red-500 text-red-500' : ''
                            }`}
                          />
                          {post.likeCount}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 pointer-events-none">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentCount}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 pointer-events-none">
                          <Bookmark className="h-4 w-4 fill-blue-500 text-blue-500" />
                          {post.bookmarkCount}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

