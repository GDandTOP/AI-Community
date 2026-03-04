/**
 * YouTube URL에서 비디오 ID 추출
 * @param url YouTube URL
 * @returns 비디오 ID 또는 null
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null

  // YouTube URL 패턴들
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  // 11자리 영숫자 문자열만 입력된 경우
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }

  return null
}

/**
 * YouTube 비디오 ID로 썸네일 URL 생성
 * @param videoId YouTube 비디오 ID
 * @param quality 썸네일 품질 (default, medium, high, maxres)
 * @returns 썸네일 URL
 */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'
): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/**
 * YouTube URL이 유효한지 검사
 * @param url YouTube URL
 * @returns 유효 여부
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return extractYouTubeVideoId(url) !== null
}

/**
 * YouTube 임베드 URL 생성
 * @param videoId YouTube 비디오 ID
 * @returns 임베드 URL
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`
}

