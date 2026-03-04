import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { createPost } from '@/services/post.service'
import { uploadPostImage } from '@/services/storage.service'
import { CATEGORIES } from '@/types/post.types'
import type { PostFormData } from '@/types/post.types'
import { ImageUpload } from '@/components/post/ImageUpload'
import { YouTubeInput } from '@/components/post/YouTubeInput'
import { ArrowLeft, Image as ImageIcon, Youtube } from 'lucide-react'

export function NewPost() {
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
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
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
      setLoading(true)
      setError('')
      
      // 1. 이미지 파일이 있으면 먼저 업로드
      let uploadedImageUrls: string[] = []
      if (imageFiles.length > 0) {
        setUploadingImages(true)
        // 임시 postId 생성 (타임스탬프 기반)
        const tempPostId = `temp_${Date.now()}`
        uploadedImageUrls = await Promise.all(
          imageFiles.map(file => uploadPostImage(tempPostId, file))
        )
      }
      
      // 2. 이미지 URL을 포함하여 게시글 생성
      const result = await createPost(
        currentUser.uid,
        currentUser.displayName || '익명',
        currentUser.photoURL,
        {
          ...formData,
          images: uploadedImageUrls,
        }
      )
      
      if (result.success) {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || '게시글 작성에 실패했습니다.')
    } finally {
      setLoading(false)
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
        <CardHeader>
          <CardTitle className="text-3xl">새 글 작성</CardTitle>
          <CardDescription>
            AI 커뮤니티에 당신의 이야기를 공유해보세요
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

            {/* 이미지 업로드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                이미지 (선택)
              </label>
              <ImageUpload
                images={imageFiles}
                onImagesChange={setImageFiles}
                maxImages={5}
              />
            </div>

            {/* YouTube URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube 링크 (선택)
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
                disabled={loading || uploadingImages}
              >
                {uploadingImages ? '이미지 업로드 중...' : loading ? '작성 중...' : '게시하기'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading || uploadingImages}
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

