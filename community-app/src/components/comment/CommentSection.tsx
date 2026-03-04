import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserNameButton } from '@/components/common/UserNameButton'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToComments, createComment, deleteComment, updateComment, toggleCommentLike } from '@/services/comment.service'
import type { Comment } from '@/types/post.types'
import { MessageCircle, Trash2, Edit2, X, Check, Heart } from 'lucide-react'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { currentUser } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  
  // 좋아요 처리 중인 댓글 ID들을 추적
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // 실시간 댓글 구독
    const unsubscribe = subscribeToComments(
      postId,
      (updatedComments) => {
        setComments(updatedComments)
      },
      (error) => {
        console.error('댓글 구독 오류:', error)
      }
    )

    return () => unsubscribe()
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!newComment.trim()) {
      setError('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      setError('')

      await createComment(
        postId,
        currentUser.uid,
        currentUser.displayName || '익명',
        currentUser.photoURL,
        newComment.trim()
      )

      setNewComment('')
    } catch (err: any) {
      setError(err.message || '댓글 작성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!currentUser) return
    
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      await deleteComment(postId, commentId, currentUser.uid)
    } catch (err: any) {
      alert(err.message || '댓글 삭제에 실패했습니다.')
    }
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!currentUser) return
    
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      await updateComment(postId, commentId, currentUser.uid, editContent.trim())
      setEditingId(null)
      setEditContent('')
    } catch (err: any) {
      alert(err.message || '댓글 수정에 실패했습니다.')
    }
  }

  const handleToggleLike = async (commentId: string) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    // 이미 처리 중이면 무시
    if (likingCommentIds.has(commentId)) {
      return
    }

    // 처리 중 상태로 설정
    setLikingCommentIds(prev => new Set(prev).add(commentId))

    // 낙관적 UI 업데이트 (즉시 화면에 반영)
    setComments(prevComments => {
      const updatedComments = prevComments.map(comment => {
        if (comment.id === commentId) {
          const isLiked = comment.likedBy?.includes(currentUser.uid)
          const newLikedBy = isLiked
            ? comment.likedBy.filter(id => id !== currentUser.uid)
            : [...(comment.likedBy || []), currentUser.uid]
          const newLikeCount = isLiked
            ? Math.max((comment.likeCount || 1) - 1, 0)
            : (comment.likeCount || 0) + 1

          return {
            ...comment,
            likedBy: newLikedBy,
            likeCount: newLikeCount,
          }
        }
        return comment
      })

      // 좋아요 순으로 다시 정렬
      return updatedComments.sort((a, b) => {
        const likeDiff = (b.likeCount || 0) - (a.likeCount || 0)
        if (likeDiff !== 0) return likeDiff
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      })
    })

    // 백그라운드에서 Firebase 업데이트
    try {
      await toggleCommentLike(postId, commentId, currentUser.uid)
    } catch (err: any) {
      // 실패 시 롤백은 onSnapshot이 자동으로 처리
      console.error('좋아요 처리 실패:', err)
    } finally {
      // 처리 완료 후 상태에서 제거
      setLikingCommentIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          댓글 {comments.length}개
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 댓글 작성 폼 */}
        {currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !newComment.trim()}>
                {loading ? '작성 중...' : '댓글 작성'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            댓글을 작성하려면 로그인이 필요합니다.
          </div>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              첫 댓글을 작성해보세요!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border-b pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  {/* 프로필 이미지 */}
                  <div className="flex-shrink-0">
                    {comment.authorPhotoURL ? (
                      <img
                        src={comment.authorPhotoURL}
                        alt={comment.authorName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {comment.authorName[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 댓글 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UserNameButton
                        userId={comment.authorId}
                        userName={comment.authorName}
                        userPhotoURL={comment.authorPhotoURL}
                        className="font-medium text-sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.createdAt?.seconds !== comment.updatedAt?.seconds && (
                        <span className="text-xs text-muted-foreground">(수정됨)</span>
                      )}
                    </div>

                    {/* 수정 모드 */}
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>

                        {/* 액션 버튼들 */}
                        <div className="flex items-center gap-2 mt-2">
                          {/* 좋아요 버튼 */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleLike(comment.id)}
                            disabled={likingCommentIds.has(comment.id)}
                            className={
                              comment.likedBy?.includes(currentUser?.uid || '')
                                ? 'text-red-500 hover:text-red-600'
                                : ''
                            }
                          >
                            <Heart 
                              className={`h-3 w-3 mr-1 ${
                                comment.likedBy?.includes(currentUser?.uid || '')
                                  ? 'fill-current'
                                  : ''
                              }`}
                            />
                            {comment.likeCount || 0}
                          </Button>

                          {/* 작성자 본인만 수정/삭제 버튼 표시 */}
                          {currentUser?.uid === comment.authorId && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(comment)}
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                수정
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(comment.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                삭제
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

