import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-8 text-center">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">페이지를 찾을 수 없습니다</h2>
      <p className="mt-2 text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Button className="mt-8 gap-2" asChild>
        <Link to="/">
          <Home className="h-4 w-4" />
          홈으로 돌아가기
        </Link>
      </Button>
    </div>
  )
}

