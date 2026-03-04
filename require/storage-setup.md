# Firebase Storage 설정 가이드

프로필 이미지 업로드 기능을 사용하기 위한 Firebase Storage 설정 방법입니다.

## 1. Firebase Console에서 Storage 활성화

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"빌드" > "Storage"** 클릭
4. **"시작하기"** 버튼 클릭
5. 보안 규칙 모드 선택 (프로덕션 모드 권장)
6. Cloud Storage 위치 선택 (asia-northeast3 권장 - 서울)
7. **"완료"** 클릭

## 2. Storage 보안 규칙 배포

### 방법 1: Firebase Console에서 직접 설정

1. Firebase Console > Storage > Rules 탭
2. 아래 규칙을 복사해서 붙여넣기:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // 프로필 이미지 규칙
    match /profile-images/{userId}/{imageFile} {
      // 읽기: 모든 인증된 사용자
      allow read: if request.auth != null;
      
      // 쓰기: 본인의 프로필 이미지만
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024  // 10MB 제한
                   && request.resource.contentType.matches('image/(jpeg|jpg|png|webp|gif)');
      
      // 삭제: 본인의 프로필 이미지만
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
    
    // 게시글 이미지 규칙 (향후 확장용)
    match /post-images/{postId}/{imageFile} {
      allow read: if request.auth != null;
      
      allow write: if request.auth != null 
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/(jpeg|jpg|png|webp|gif)');
      
      allow delete: if request.auth != null;
    }
    
    // 기타 파일은 기본적으로 거부
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **"게시"** 버튼 클릭

### 방법 2: Firebase CLI로 배포 (권장)

프로젝트 루트 디렉토리에 이미 `storage.rules` 파일이 생성되어 있습니다.

```bash
# Firebase CLI 설치 (아직 설치하지 않은 경우)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 초기화 (이미 했다면 생략)
firebase init

# Storage 규칙 배포
firebase deploy --only storage
```

## 3. Storage 버킷 URL 확인

Firebase Console > Storage > Files 탭에서 버킷 URL을 확인할 수 있습니다.
URL 형식: `gs://your-project-id.appspot.com`

## 4. 기능 테스트

### 프로필 이미지 업로드 테스트

1. 애플리케이션 실행
2. 로그인
3. 프로필 페이지로 이동 (`/profile`)
4. 프로필 이미지 위의 카메라 아이콘 클릭
5. 이미지 파일 선택 (jpeg, png, webp, gif)
6. "이미지 저장" 버튼 클릭
7. 성공 메시지 확인

### 검증 사항

- ✅ 이미지 미리보기가 즉시 표시되는지
- ✅ 파일 크기 제한 (10MB) 체크
- ✅ 파일 형식 제한 체크
- ✅ 업로드 후 헤더의 프로필 아이콘이 업데이트되는지
- ✅ 이전 이미지가 자동 삭제되는지 (구글 프로필 이미지 제외)

## 5. 구현된 기능

### ✅ 완료된 기능

1. **이미지 업로드**
   - 파일 선택 UI
   - 실시간 미리보기
   - 파일 유효성 검사 (크기, 형식)
   - Firebase Storage 업로드
   - Firestore 프로필 업데이트

2. **이미지 관리**
   - 이전 이미지 자동 삭제
   - 구글 프로필 이미지 보호
   - 에러 처리 및 사용자 피드백

3. **UI 통합**
   - 프로필 페이지에서 이미지 관리
   - 헤더에 프로필 이미지 표시
   - 반응형 디자인

### 📁 파일 구조

```
profile-images/
  └── {userId}/
      └── {userId}_{timestamp}.{ext}
```

예시: `profile-images/abc123/abc123_1705824567890.jpg`

## 6. 제약사항

- **최대 파일 크기**: 10MB
- **지원 형식**: JPEG, PNG, WebP, GIF
- **권한**: 본인의 프로필 이미지만 업로드/삭제 가능
- **구글 프로필 이미지**: 자동 삭제 대상에서 제외

## 7. 트러블슈팅

### 업로드 실패 시

1. **파일 크기 확인**: 10MB 이하인지 확인
2. **파일 형식 확인**: jpeg, png, webp, gif만 가능
3. **인증 상태 확인**: 로그인되어 있는지 확인
4. **Storage 규칙 확인**: Firebase Console에서 규칙이 올바르게 배포되었는지 확인
5. **브라우저 콘솔 확인**: 에러 메시지 확인

### 이미지가 표시되지 않을 때

1. **Storage 규칙 확인**: 읽기 권한이 설정되어 있는지 확인
2. **CORS 설정**: Firebase Storage는 기본적으로 CORS를 지원하지만, 문제가 있다면 gsutil로 설정 필요
3. **캐시 문제**: 브라우저 캐시를 지우고 다시 시도

## 8. 추가 개선 사항 (선택)

향후 구현할 수 있는 기능들:

- [ ] 이미지 크롭 기능
- [ ] 이미지 압축 (클라이언트 사이드)
- [ ] 여러 이미지 형식 지원 확대
- [ ] 드래그 앤 드롭 업로드
- [ ] 진행률 표시
- [ ] 이미지 최적화 (리사이징)

