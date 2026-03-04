import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserNameButton } from '@/components/common/UserNameButton'
import { useAuth } from '@/contexts/AuthContext'
import { getPosts, getPopularPosts } from '@/services/post.service'
import { toggleLike, getUserLikedPostIds } from '@/services/like.service'
import { toggleBookmark, getUserBookmarkedPostIds } from '@/services/bookmark.service'
import { CATEGORIES } from '@/types/post.types'
import type { Post } from '@/types/post.types'
import { Heart, MessageCircle, Bookmark, TrendingUp, Clock, PenSquare } from 'lucide-react'

export function Home() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [selectedCategory, setSelectedCategory] = useState<string>('전체')
  
  // 좋아요/북마크 상태
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPosts()
  }, [sortBy, selectedCategory])

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
    if (currentUser && posts.length > 0) {
      loadUserInteractions()
    }
  }, [posts.length, currentUser])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError('')
      
      const categoryFilter = selectedCategory === '전체' ? undefined : selectedCategory
      const fetchedPosts = sortBy === 'latest' 
        ? await getPosts(categoryFilter)
        : await getPopularPosts(categoryFilter)
      
      setPosts(fetchedPosts)
    } catch (err: any) {
      setError(err.message || '게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
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
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likeCount: isLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1 }
          : post
      ))
      
      // 실제 데이터 업데이트
      await toggleLike(currentUser.uid, postId)
    } catch (err: any) {
      console.error('좋아요 처리 실패:', err)
      // 실패 시 롤백은 다음 로드 시 자동으로 처리됨
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
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, bookmarkCount: isBookmarked ? Math.max(0, post.bookmarkCount - 1) : post.bookmarkCount + 1 }
          : post
      ))
      
      // 실제 데이터 업데이트
      await toggleBookmark(currentUser.uid, postId)
    } catch (err: any) {
      console.error('북마크 처리 실패:', err)
      // 실패 시 롤백은 다음 로드 시 자동으로 처리됨
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
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

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['전체', ...CATEGORIES].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* 정렬 탭 */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={sortBy === 'latest' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => setSortBy('latest')}
            >
              <Clock className="h-4 w-4" />
              최신순
            </Button>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => setSortBy('popular')}
            >
              <TrendingUp className="h-4 w-4" />
              인기순
            </Button>
          </div>

          {/* 로딩/에러 상태 */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* 게시글 목록 */}
          {!loading && !error && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
                    <p className="text-muted-foreground">아직 게시글이 없습니다.</p>
                    {currentUser && (
                      <Button asChild>
                        <Link to="/posts/new">
                          <PenSquare className="mr-2 h-4 w-4" />
                          첫 글 작성하기
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Link key={post.id} to={`/posts/${post.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{post.title}</CardTitle>
                            <CardDescription className="mt-2">
                              <span className="inline-flex items-center gap-1 flex-wrap">
                                <UserNameButton
                                  userId={post.authorId}
                                  userName={post.authorName}
                                  userPhotoURL={post.authorPhotoURL}
                                  className="font-medium"
                                />
                                <span>·</span>
                                <span>{formatDate(post.createdAt)}</span>
                                {post.category && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                                    {post.category}
                                  </span>
                                )}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3">
                          {post.content}
                        </p>
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
                        <span className="text-sm text-muted-foreground">
                          조회 {post.viewCount}
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 space-y-6">
          {/* 글 작성하기 버튼 (로그인 시) */}
          {currentUser && (
            <Button 
              className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800" 
              asChild
            >
              <Link to="/posts/new" className="flex items-center justify-center gap-2">
                <PenSquare className="h-5 w-5" />
                글 작성하기
              </Link>
            </Button>
          )}

          {/* Welcome Card */}
          {!currentUser && (
            <Card>
              <CardHeader>
                <CardTitle>AI Community에 오신 것을 환영합니다!</CardTitle>
                <CardDescription>
                  AI에 관한 다양한 정보를 공유하고 소통하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full h-11 text-base font-semibold" asChild>
                  <Link to="/login">로그인</Link>
                </Button>
                <Button variant="outline" className="w-full h-11 text-base" asChild>
                  <Link to="/signup">회원가입</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">인기 태그</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['ChatGPT', 'Claude', 'Midjourney', 'Stable Diffusion', 'GPT-4', 'AI 윤리'].map((tag) => (
                  <Button key={tag} variant="secondary" size="sm">
                    #{tag}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">커뮤니티 통계</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">전체 게시글</span>
                <span className="font-semibold">{posts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">선택된 카테고리</span>
                <span className="font-semibold">{selectedCategory}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
