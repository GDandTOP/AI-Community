import { useState, useEffect } from 'react'
import { Youtube, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { extractYouTubeVideoId, getYouTubeThumbnail, isValidYouTubeUrl } from '@/utils/youtube'

interface YouTubeInputProps {
  youtubeUrl: string
  onYoutubeUrlChange: (url: string) => void
}

export function YouTubeInput({ youtubeUrl, onYoutubeUrlChange }: YouTubeInputProps) {
  const [urlInput, setUrlInput] = useState(youtubeUrl || '')
  const [error, setError] = useState('')
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  useEffect(() => {
    if (youtubeUrl) {
      const videoId = extractYouTubeVideoId(youtubeUrl)
      if (videoId) {
        setThumbnail(getYouTubeThumbnail(videoId))
      }
    } else {
      setThumbnail(null)
    }
  }, [youtubeUrl])

  const handleAddUrl = () => {
    setError('')

    if (!urlInput.trim()) {
      onYoutubeUrlChange('')
      setThumbnail(null)
      return
    }

    if (!isValidYouTubeUrl(urlInput)) {
      setError('유효한 YouTube URL을 입력해주세요.')
      return
    }

    onYoutubeUrlChange(urlInput)
    const videoId = extractYouTubeVideoId(urlInput)
    if (videoId) {
      setThumbnail(getYouTubeThumbnail(videoId))
    }
  }

  const handleRemove = () => {
    setUrlInput('')
    onYoutubeUrlChange('')
    setThumbnail(null)
    setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddUrl()
    }
  }

  return (
    <div className="space-y-4">
      {/* URL 입력 */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="YouTube URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
            className="w-full"
          />
        </div>
        {!youtubeUrl ? (
          <Button type="button" onClick={handleAddUrl} variant="outline">
            <Youtube className="h-4 w-4 mr-2" />
            추가
          </Button>
        ) : (
          <Button type="button" onClick={handleRemove} variant="destructive">
            <X className="h-4 w-4 mr-2" />
            제거
          </Button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* 썸네일 미리보기 */}
      {thumbnail && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 max-w-md">
          <img
            src={thumbnail}
            alt="YouTube 썸네일"
            className="w-full aspect-video object-cover"
            onError={() => {
              setError('썸네일을 불러올 수 없습니다.')
              setThumbnail(null)
            }}
          />
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
            <Youtube className="h-3 w-3" />
            YouTube
          </div>
        </div>
      )}

      {youtubeUrl && (
        <p className="text-sm text-muted-foreground">
          YouTube 영상이 게시글에 포함됩니다.
        </p>
      )}
    </div>
  )
}

