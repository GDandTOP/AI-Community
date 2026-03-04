import { useState, useRef, type DragEvent } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateImageFile, readImageAsDataURL } from '@/services/storage.service'

interface ImageUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([])

  // 파일 미리보기 생성
  const generatePreviews = async (files: File[]) => {
    const newPreviews = await Promise.all(
      files.map(async (file) => {
        try {
          const preview = await readImageAsDataURL(file)
          return { file, preview }
        } catch {
          return null
        }
      })
    )
    setPreviews(newPreviews.filter(Boolean) as { file: File; preview: string }[])
  }

  // 파일 추가 처리
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError('')

    const newFiles = Array.from(files)
    const validFiles: File[] = []

    // 최대 개수 체크
    if (images.length + newFiles.length > maxImages) {
      setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`)
      return
    }

    // 각 파일 유효성 검사
    for (const file of newFiles) {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        setError(validation.error || '유효하지 않은 파일입니다.')
        return
      }
    }

    const allImages = [...images, ...validFiles]
    onImagesChange(allImages)
    await generatePreviews(allImages)
  }

  // 드래그 이벤트 핸들러
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  // 이미지 제거
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
    generatePreviews(newImages)
  }

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/50 dark:border-gray-700'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-base font-medium">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              최대 {maxImages}개, 각 10MB 이하 (JPEG, PNG, WebP, GIF)
            </p>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* 미리보기 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((item, index) => (
            <div
              key={index}
              className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
            >
              <img
                src={item.preview}
                alt={`미리보기 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage(index)
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              </div>
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {(item.file.size / 1024 / 1024).toFixed(2)}MB
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드된 이미지 개수 */}
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {images.length}/{maxImages}개 이미지 선택됨
        </p>
      )}
    </div>
  )
}

