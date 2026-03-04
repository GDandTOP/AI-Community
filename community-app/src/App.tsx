import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { Survey } from '@/pages/Survey'
import { Profile } from '@/pages/Profile'
import { NewPost } from '@/pages/NewPost'
import { PostDetail } from '@/pages/PostDetail'
import { EditPost } from '@/pages/EditPost'
import { Bookmarks } from '@/pages/Bookmarks'
import { Likes } from '@/pages/Likes'
import { NotFound } from '@/pages/NotFound'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-community-theme">
      <AuthProvider>
        <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/survey"
                element={
                  <ProtectedRoute>
                    <Survey />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts/new"
                element={
                  <ProtectedRoute>
                    <NewPost />
                  </ProtectedRoute>
                }
              />
              <Route path="/posts/:postId" element={<PostDetail />} />
              <Route
                path="/posts/:postId/edit"
                element={
                  <ProtectedRoute>
                    <EditPost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute>
                    <Bookmarks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/likes"
                element={
                  <ProtectedRoute>
                    <Likes />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
