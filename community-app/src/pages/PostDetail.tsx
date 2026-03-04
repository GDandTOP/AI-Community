import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserNameButton } from '@/components/common/UserNameButton'
import { useAuth } from '@/contexts/AuthContext'
import { getPost, deletePost } from '@/services/post.service'
import { toggleLike, checkLikeStatus, subscribeToPostLikes } from '@/services/like.service'
import { toggleBookmark, checkBookmarkStatus, subscribeToPostBookmarks } from '@/services/bookmark.service'
import { CommentSection } from '@/components/comment/CommentSection'
import type { Post } from '@/types/post.types'
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube'
import { Heart, MessageCircle, Bookmark, ArrowLeft, Edit, Trash2, Clock, Eye } from 'lucide-react'

export function PostDetail() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  
  // 좋아요/북마크 상태
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  // 실시간 좋아요/북마크 수 구독
  useEffect(() => {
    if (!postId) return

    const unsubscribeLikes = subscribeToPostLikes(postId, (likeCount) => {
      setPost(prev => prev ? { ...prev, likeCount } : prev)
    })

    const unsubscribeBookmarks = subscribeToPostBookmarks(postId, (bookmarkCount) => {
      setPost(prev => prev ? { ...prev, bookmarkCount } : prev)
    })

    return () => {
      unsubscribeLikes()
      unsubscribeBookmarks()
    }
  }, [postId])

  const loadPost = async () => {
    if (!postId) return

    try {
      setLoading(true)
      setError('')
      const fetchedPost = await getPost(postId)
      setPost(fetchedPost)
      
      // 로그인한 사용자라면 좋아요/북마크 상태 확인
      if (currentUser) {
        const [likeStatus, bookmarkStatus] = await Promise.all([
          checkLikeStatus(currentUser.uid, postId),
          checkBookmarkStatus(currentUser.uid, postId),
        ])
        setIsLiked(likeStatus)
        setIsBookmarked(bookmarkStatus)
      }
    } catch (err: any) {
      setError(err.message || '게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!post || !currentUser || !postId) return
    
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      setDeleting(true)
      await deletePost(postId, currentUser.uid)
      navigate('/', { replace: true })
    } catch (err: any) {
      alert(err.message || '게시글 삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const handleLikeToggle = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }
    
    if (!postId || likeLoading) return

    try {
      setLikeLoading(true)
      
      // 낙관적 UI 업데이트
      const newIsLiked = !isLiked
      setIsLiked(newIsLiked)
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          likeCount: newIsLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1)
        }
      })
      
      // 실제 데이터 업데이트
      await toggleLike(currentUser.uid, postId)
    } catch (err: any) {
      // 실패 시 롤백
      setIsLiked(!isLiked)
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          likeCount: isLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1)
        }
      })
      console.error('좋아요 처리 실패:', err)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleBookmarkToggle = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }
    
    if (!postId || bookmarkLoading) return

    try {
      setBookmarkLoading(true)
      
      // 낙관적 UI 업데이트
      const newIsBookmarked = !isBookmarked
      setIsBookmarked(newIsBookmarked)
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          bookmarkCount: newIsBookmarked ? prev.bookmarkCount + 1 : Math.max(0, prev.bookmarkCount - 1)
        }
      })
      
      // 실제 데이터 업데이트
      await toggleBookmark(currentUser.uid, postId)
    } catch (err: any) {
      // 실패 시 롤백
      setIsBookmarked(!isBookmarked)
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          bookmarkCount: isBookmarked ? prev.bookmarkCount + 1 : Math.max(0, prev.bookmarkCount - 1)
        }
      })
      console.error('북마크 처리 실패:', err)
    } finally {
      setBookmarkLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error || !post) {
    return (
      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로 가기
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-destructive mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
            <Button onClick={() => navigate('/')}>
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAuthor = currentUser?.uid === post.authorId

  return (
    <div className="container max-w-4xl py-8">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로 가기
        </Button>
        
        {isAuthor && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/posts/${postId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              수정
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        )}
      </div>

      {/* 게시글 카드 */}
      <Card>
        <CardHeader className="space-y-4">
          {/* 카테고리 */}
          {post.category && (
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                {post.category}
              </span>
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-3xl font-bold">{post.title}</h1>

          {/* 작성자 정보 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {post.authorPhotoURL ? (
                <img
                  src={post.authorPhotoURL}
                  alt={post.authorName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {post.authorName[0]}
                  </span>
                </div>
              )}
              <UserNameButton
                userId={post.authorId}
                userName={post.authorName}
                userPhotoURL={post.authorPhotoURL}
                className="font-medium text-foreground"
              />
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(post.createdAt)}
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              조회 {post.viewCount}
            </div>
          </div>

          {/* 태그 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 본문 */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap break-words">
              {post.content}
            </div>
          </div>

          {/* 이미지 갤러리 */}
          {post.images && post.images.length > 0 && (
            <div className="space-y-4">
              <div className={`grid gap-4 ${
                post.images.length === 1 ? 'grid-cols-1' :
                post.images.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 md:grid-cols-3'
              }`}>
                {post.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <img
                      src={imageUrl}
                      alt={`게시글 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube 영상 */}
          {post.youtubeUrl && extractYouTubeVideoId(post.youtubeUrl) && (
            <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
              <iframe
                src={getYouTubeEmbedUrl(extractYouTubeVideoId(post.youtubeUrl)!)}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleLikeToggle}
              disabled={likeLoading || !currentUser}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : ''
                }`}
              />
              <span>{post.likeCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              <span>{post.commentCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading || !currentUser}
            >
              <Bookmark
                className={`h-5 w-5 transition-colors ${
                  isBookmarked ? 'fill-blue-500 text-blue-500' : ''
                }`}
              />
              <span>{post.bookmarkCount}</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 댓글 섹션 */}
      {postId && (
        <div className="mt-6">
          <CommentSection postId={postId} />
        </div>
      )}
    </div>
  )
}

