# Firebase Authentication 구현 가이드

## 1. 개요

Firebase Authentication은 이메일/비밀번호, 소셜 로그인 등 다양한 인증 방법을 제공하는 서비스입니다.

---

## 2. 프로젝트에서 사용할 인증 방식

### 2.1 이메일/비밀번호 인증
- 전통적인 회원가입/로그인
- 비밀번호 재설정 기능

### 2.2 Google 소셜 로그인
- Google 계정으로 간편 로그인
- 별도 회원가입 불필요

---

## 3. Firebase 초기 설정

### 3.1 Firebase 프로젝트 설정

**Firebase Console에서:**
1. Authentication 메뉴 이동
2. Sign-in method 탭
3. 이메일/비밀번호 활성화
4. Google 활성화 (OAuth 2.0 클라이언트 ID 자동 생성)

### 3.2 Firebase 초기화 코드

```typescript
// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // Realtime DB
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

export default app;
```

---

## 4. 이메일/비밀번호 인증 구현

### 4.1 회원가입

```typescript
// src/services/auth.service.ts
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

interface SignupData {
  email: string;
  password: string;
  displayName: string;
}

export const signupWithEmail = async ({
  email,
  password,
  displayName
}: SignupData) => {
  try {
    // 1. Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    const user = userCredential.user;
    
    // 2. 프로필 업데이트 (displayName)
    await updateProfile(user, {
      displayName
    });
    
    // 3. Firestore에 사용자 프로필 생성
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      bio: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      postCount: 0,
      likeCount: 0,
      provider: 'email',
      isActive: true
    });
    
    // 4. 이메일 인증 발송 (선택)
    await sendEmailVerification(user);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    };
  } catch (error: any) {
    throw handleAuthError(error);
  }
};
```

### 4.2 로그인

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }
    };
  } catch (error: any) {
    throw handleAuthError(error);
  }
};
```

### 4.3 로그아웃

```typescript
import { signOut } from 'firebase/auth';

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    throw handleAuthError(error);
  }
};
```

### 4.4 비밀번호 재설정

```typescript
import { sendPasswordResetEmail } from 'firebase/auth';

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: '비밀번호 재설정 이메일이 발송되었습니다.'
    };
  } catch (error: any) {
    throw handleAuthError(error);
  }
};
```

### 4.5 비밀번호 변경

```typescript
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('로그인이 필요합니다.');
    
    // 재인증 (보안을 위해 필요)
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
    
    // 비밀번호 변경
    await updatePassword(user, newPassword);
    
    return {
      success: true,
      message: '비밀번호가 변경되었습니다.'
    };
  } catch (error: any) {
    throw handleAuthError(error);
  }
};
```

---

## 5. Google 소셜 로그인 구현

### 5.1 Google 로그인

```typescript
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    // 팝업 방식 (권장)
    const result = await signInWithPopup(auth, provider);
    
    // 리다이렉트 방식 (모바일에서 권장)
    // await signInWithRedirect(auth, provider);
    
    const user = result.user;
    
    // Firestore에 사용자 프로필 확인/생성
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // 최초 로그인 시 프로필 생성
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        postCount: 0,
        likeCount: 0,
        provider: 'google',
        isActive: true
      });
    }
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    };
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

// 리다이렉트 결과 처리 (앱 시작 시 호출)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // 위와 동일한 프로필 생성 로직
      return result.user;
    }
    return null;
  } catch (error: any) {
    throw handleAuthError(error);
  }
};
```

### 5.2 Google 로그인 추가 설정

```typescript
// 특정 Google 계정 도메인만 허용 (선택)
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  hd: 'example.com' // example.com 도메인만 허용
});

// 추가 권한 요청 (선택)
provider.addScope('https://www.googleapis.com/auth/user.birthday.read');
```

---

## 6. 인증 상태 관리 (Context API)

### 6.1 Auth Context 생성

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          bio: userData.bio
        });
      } else {
        // Firestore에 프로필이 없으면 Firebase Auth 정보 사용
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error);
    }
  };
  
  const refreshUser = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <AuthContext.Provider value={{ currentUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 6.2 App에 AuthProvider 적용

```typescript
// src/app/App.tsx
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* 나머지 앱 컴포넌트 */}
    </AuthProvider>
  );
}
```

---

## 7. 보호된 라우트 구현

### 7.1 ProtectedRoute 컴포넌트

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/common/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!currentUser) {
    // 로그인 페이지로 리다이렉트 (현재 경로 저장)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};
```

### 7.2 라우터에 적용

```typescript
// src/app/router.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* 보호된 라우트 */}
        <Route
          path="/posts/new"
          element={
            <ProtectedRoute>
              <PostCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfileEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 8. 로그인/회원가입 폼 컴포넌트

### 8.1 로그인 폼

```typescript
// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginWithEmail, loginWithGoogle } from '@/services/auth.service';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상입니다.')
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      await loginWithEmail(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="이메일"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
        
        <div>
          <Input
            type="password"
            placeholder="비밀번호"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">
            또는
          </span>
        </div>
      </div>
      
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          {/* Google 아이콘 SVG */}
        </svg>
        Google로 로그인
      </Button>
    </div>
  );
};
```

### 8.2 회원가입 폼

```typescript
// src/components/auth/SignupForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signupWithEmail } from '@/services/auth.service';

const signupSchema = z.object({
  displayName: z.string().min(2, '이름은 최소 2자 이상입니다.'),
  email: z.string().email('올바른 이메일을 입력하세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상입니다.'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword']
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  });
  
  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setError('');
      await signupWithEmail({
        email: data.email,
        password: data.password,
        displayName: data.displayName
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 폼 필드들 */}
      <Button type="submit" disabled={loading}>
        {loading ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  );
};
```

---

## 9. 에러 처리

```typescript
// src/services/auth.service.ts
const handleAuthError = (error: any): Error => {
  let message = '오류가 발생했습니다.';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = '이미 사용 중인 이메일입니다.';
      break;
    case 'auth/invalid-email':
      message = '올바르지 않은 이메일 형식입니다.';
      break;
    case 'auth/operation-not-allowed':
      message = '허용되지 않은 작업입니다.';
      break;
    case 'auth/weak-password':
      message = '비밀번호가 너무 약합니다.';
      break;
    case 'auth/user-disabled':
      message = '비활성화된 계정입니다.';
      break;
    case 'auth/user-not-found':
      message = '존재하지 않는 계정입니다.';
      break;
    case 'auth/wrong-password':
      message = '잘못된 비밀번호입니다.';
      break;
    case 'auth/popup-closed-by-user':
      message = '로그인 팝업이 닫혔습니다.';
      break;
    case 'auth/cancelled-popup-request':
      message = '로그인이 취소되었습니다.';
      break;
    case 'auth/network-request-failed':
      message = '네트워크 오류가 발생했습니다.';
      break;
    default:
      message = error.message || '알 수 없는 오류가 발생했습니다.';
  }
  
  return new Error(message);
};
```

---

## 10. 커스텀 훅

```typescript
// src/hooks/useAuth.ts
export { useAuth } from '@/contexts/AuthContext';

// 추가 헬퍼 훅
export const useRequireAuth = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);
  
  return { currentUser, loading };
};
```

---

## 11. 보안 체크리스트

- [x] 비밀번호 최소 길이 (6자 이상)
- [x] 이메일 형식 검증
- [x] 재인증 (민감한 작업 전)
- [x] 이메일 인증 (선택)
- [x] 보호된 라우트 구현
- [x] 에러 메시지 사용자 친화적 변환
- [x] HTTPS 사용 (배포 시)

---

## 12. 테스트 시나리오

1. **이메일 회원가입**: 새 계정 생성 및 Firestore 프로필 확인
2. **이메일 로그인**: 기존 계정으로 로그인
3. **Google 로그인**: Google 계정으로 로그인
4. **로그아웃**: 로그아웃 후 보호된 페이지 접근 차단 확인
5. **비밀번호 재설정**: 비밀번호 재설정 이메일 수신
6. **보호된 라우트**: 로그인 없이 접근 시 로그인 페이지로 리다이렉트
7. **프로필 자동 생성**: 최초 로그인 시 Firestore 프로필 생성 확인

