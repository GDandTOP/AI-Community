import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getUserBookmarkedPosts } from '@/services/bookmark.service'
import { toggleBookmark, getUserBookmarkedPostIds } from '@/services/bookmark.service'
import { toggleLike, getUserLikedPostIds } from '@/services/like.service'
import type { Post } from '@/types/post.types'
import { Heart, MessageCircle, Bookmark, Eye, X } from 'lucide-react'

export function Bookmarks() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  
  // 좋아요/북마크 상태
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [, setBookmarkedPostIds] = useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBookmarkedPosts()
  }, [currentUser])

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

  const loadBookmarkedPosts = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const bookmarkedPosts = await getUserBookmarkedPosts(currentUser.uid)
      setPosts(bookmarkedPosts)
    } catch (err: any) {
      setError(err.message || '북마크 목록을 불러오는데 실패했습니다.')
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
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleRemoveBookmark = async (postId: string) => {
    if (!currentUser || removingIds.has(postId)) return

    try {
      setRemovingIds(prev => new Set(prev).add(postId))
      
      // 즉시 UI에서 제거
      setPosts(prev => prev.filter(post => post.id !== postId))
      
      // 실제 북마크 삭제
      await toggleBookmark(currentUser.uid, postId)
    } catch (err: any) {
      console.error('북마크 삭제 실패:', err)
      // 실패 시 다시 로드
      await loadBookmarkedPosts()
    } finally {
      setRemovingIds(prev => {
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

  if (!currentUser) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">로그인이 필요한 서비스입니다.</p>
            <Button asChild>
              <Link to="/login">로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">북마크</h1>
        <p className="text-muted-foreground">
          저장한 게시글을 확인하세요 ({posts.length}개)
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
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
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow relative">
              {/* 북마크 제거 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={(e) => {
                  e.preventDefault()
                  handleRemoveBookmark(post.id)
                }}
                disabled={removingIds.has(post.id)}
              >
                <X className="h-5 w-5" />
              </Button>

              <Link to={`/posts/${post.id}`}>
                <CardHeader>
                  <div className="flex items-start gap-3 pr-10">
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
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

