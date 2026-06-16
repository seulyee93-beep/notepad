# 내 메모장

에버노트 스타일의 개인 메모장 앱

## 기능

- 회원가입 / 로그인 (JWT)
- 노트 작성 (리치 텍스트 에디터 - TipTap)
- 노트북으로 노트 분류
- 태그 관리
- 노트 고정 (핀)
- 검색
- 휴지통 / 복원 / 영구 삭제
- 자동 저장

## 기술 스택

- **Frontend**: React + Vite + Tailwind CSS + TipTap
- **Backend**: Express.js + Prisma ORM
- **Database**: PostgreSQL
- **배포**: Render Blueprints (무료 플랜)

## 로컬 개발

### 백엔드
```bash
cd backend
# backend/.env의 DATABASE_URL을 실제 DB로 수정
npm install
npx prisma migrate dev --name init
npm run dev
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

## Render 배포

1. GitHub에 push
2. [Render](https://render.com) → New → Blueprint
3. 레포 선택 → `render.yaml` 자동 감지
4. 서비스 3개 자동 생성: `notepad-api`, `notepad-app`, `notepad-db`
5. 배포 완료

> **주의**: Render 무료 PostgreSQL은 90일 후 만료됩니다.
