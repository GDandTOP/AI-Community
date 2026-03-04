import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { getPost, updatePost } from '@/services/post.service'
import { uploadPostImage } from '@/services/storage.service'
import { CATEGORIES } from '@/types/post.types'
import type { PostFormData } from '@/types/post.types'
import { ImageUpload } from '@/components/post/ImageUpload'
import { YouTubeInput } from '@/components/post/YouTubeInput'
import { ArrowLeft, Image as ImageIcon, Youtube, X } from 'lucide-react'

export function EditPost() {
  const { postId } = useParams<{ postId: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    category: 'AI 도구',
    tags: [],
    images: [],
    youtubeUrl: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [existingImages, setExistingImages] = useState<string[]>([]) // 기존 이미지 URL
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]) // 새로 추가할 이미지
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  const loadPost = async () => {
    if (!postId) return

    try {
      setLoading(true)
      const post = await getPost(postId)
      
      // 권한 확인
      if (post.authorId !== currentUser?.uid) {
        setError('수정 권한이 없습니다.')
        return
      }

      setFormData({
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags || [],
        images: post.images || [],
        youtubeUrl: post.youtubeUrl || '',
      })
      setExistingImages(post.images || [])
    } catch (err: any) {
      setError(err.message || '게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !postId) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      setError('')
      
      // 1. 새 이미지 파일이 있으면 업로드
      let newUploadedUrls: string[] = []
      if (newImageFiles.length > 0) {
        setUploadingImages(true)
        newUploadedUrls = await Promise.all(
          newImageFiles.map(file => uploadPostImage(postId, file))
        )
      }
      
      // 2. 기존 이미지 + 새 이미지 URL 결합
      const allImageUrls = [...existingImages, ...newUploadedUrls]
      
      // 3. 게시글 업데이트
      await updatePost(postId, currentUser.uid, {
        ...formData,
        images: allImageUrls,
      })
      
      navigate(`/posts/${postId}`, { replace: true })
    } catch (err: any) {
      setError(err.message || '게시글 수정에 실패했습니다.')
    } finally {
      setSaving(false)
      setUploadingImages(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove)
    })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleAddTag()
    }
  }

  // 기존 이미지 제거
  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl))
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

  if (error && !formData.title) {
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
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(`/posts/${postId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로 가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">글 수정</CardTitle>
          <CardDescription>
            게시글을 수정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">제목</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="게시글 제목을 입력하세요"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.title.length}/100
              </p>
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">태그</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="태그를 입력하고 Enter를 누르세요"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  추가
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">내용</label>
              <textarea
                className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="내용을 입력하세요 (마크다운 지원)"
              />
              <p className="text-xs text-muted-foreground">
                마크다운 문법을 사용할 수 있습니다.
              </p>
            </div>

            {/* 기존 이미지 관리 */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  기존 이미지 ({existingImages.length}개)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`기존 이미지 ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(imageUrl)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 이미지 추가 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                새 이미지 추가 (최대 {5 - existingImages.length}개)
              </label>
              <ImageUpload
                images={newImageFiles}
                onImagesChange={setNewImageFiles}
                maxImages={5 - existingImages.length}
              />
            </div>

            {/* YouTube 영상 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube 영상 (선택)
              </label>
              <YouTubeInput
                youtubeUrl={formData.youtubeUrl || ''}
                onYoutubeUrlChange={(url) => setFormData({ ...formData, youtubeUrl: url })}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || uploadingImages}
              >
                {uploadingImages 
                  ? '이미지 업로드 중...' 
                  : saving 
                    ? '저장 중...' 
                    : '수정 완료'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/posts/${postId}`)}
                disabled={saving}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

