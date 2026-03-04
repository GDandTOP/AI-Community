import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { saveSurveyData } from '@/services/user.service'
import type { SurveyData } from '@/types/user.types'
import { CheckCircle2 } from 'lucide-react'

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

export function Survey() {
  const { currentUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  
  const [surveyData, setSurveyData] = useState<SurveyData>({
    interests: [],
    experienceLevel: 'beginner',
    preferredTopics: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (surveyData.interests.length === 0) {
      setError('최소 1개 이상의 관심사를 선택해주세요.')
      return
    }

    if (surveyData.preferredTopics.length === 0) {
      setError('최소 1개 이상의 선호 주제를 선택해주세요.')
      return
    }

    if (!currentUser) {
      setError('로그인이 필요합니다.')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await saveSurveyData(currentUser.uid, surveyData)
      await refreshUser()
      
      // 설문 완료 후 홈으로 이동
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/', { replace: true })
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">환영합니다! 👋</CardTitle>
          <CardDescription className="text-base">
            AI 커뮤니티에 오신 것을 환영합니다. <br />
            간단한 설문을 통해 더 나은 경험을 제공하고자 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 관심사 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  어떤 AI 도구에 관심이 있으신가요?
                </h3>
                <p className="text-sm text-muted-foreground">
                  관심있는 항목을 모두 선택해주세요
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map(interest => (
                  <Button
                    key={interest}
                    type="button"
                    variant={surveyData.interests.includes(interest) ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => toggleInterest(interest)}
                  >
                    {surveyData.interests.includes(interest) && (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    {interest}
                  </Button>
                ))}
              </div>
            </div>

            {/* 경험 수준 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  AI 사용 경험이 어느 정도이신가요?
                </h3>
                <p className="text-sm text-muted-foreground">
                  하나를 선택해주세요
                </p>
              </div>
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
                    onClick={() => setSurveyData(prev => ({ 
                      ...prev, 
                      experienceLevel: level.value as any 
                    }))}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 선호 주제 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  어떤 주제의 콘텐츠를 보고 싶으신가요?
                </h3>
                <p className="text-sm text-muted-foreground">
                  관심있는 주제를 모두 선택해주세요
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TOPICS.map(topic => (
                  <Button
                    key={topic}
                    type="button"
                    variant={surveyData.preferredTopics.includes(topic) ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => toggleTopic(topic)}
                  >
                    {surveyData.preferredTopics.includes(topic) && (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    {topic}
                  </Button>
                ))}
              </div>
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
                disabled={loading}
              >
                {loading ? '저장 중...' : '완료'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={loading}
              >
                나중에 하기
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

