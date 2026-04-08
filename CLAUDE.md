# 김비서 — 업무 대시보드

마케팅 팀의 업무를 한눈에 관리하는 실시간 대시보드.

---

## 🎯 주요 기능

### 할 일 관리
- **TODAY'S TASKS**: 우선순위별 할 일 목록 (높음/중간/낮음)
- Google Calendar와 자동 동기화
- 완료/미완료 상태 추적
- 담당자별 작업 할당

### 일정 관리
- **WEEKLY SCHEDULE**: 주간 일정 한눈에 보기
- 팀 회의, 마감일, 미팅 일정 표시
- 일정 색상 구분 (초록/주황/빨강)

### 성과 지표
- **KPI**: 총 매출, 상위 제품, 진행 프로젝트
- 실시간 진행률 막대 그래프
- 완료율 트래킹

### 분석 및 리포트
- **PROJECT PROGRESS**: 프로젝트별 진행률 (4개)
- **SALES TREND**: 매출 추이 라인 차트
- **PRODUCT RANKING**: 제품 순위표 (톱 6)
- **REGIONAL SALES**: 지역별 판매량 (서울/대구/부산)
- **CATEGORY SHARE**: 카테고리 점유율 도넛 차트

---

## 📁 파일 구조

```
vatya/
├── index.html                    # 메인 페이지
├── 업무-대시보드.html            # 대시보드 본체
├── google-auth.js                # Google OAuth 인증 관리
├── google-calendar-api.js        # Google Calendar API 통신
├── sync-manager.js               # Calendar ↔ 로컬 데이터 동기화
├── vercel.json                   # Vercel 배포 설정
├── .gitignore                    # Git 제외 파일
└── CLAUDE.md                     # 이 파일
```

### 파일 역할

| 파일 | 역할 |
|------|------|
| `index.html` | Vercel 메인 페이지 진입점 |
| `업무-대시보드.html` | 대시보드 UI & 차트 (Chart.js) |
| `google-auth.js` | Google Sign-In, 토큰 관리 |
| `google-calendar-api.js` | Calendar API 요청/응답 처리 |
| `sync-manager.js` | 할 일 추가/완료/삭제 → Calendar 동기화 |

---

## 🛠️ 사용 기술

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, 반응형 디자인
- **JavaScript (ES6+)**: 동적 UI, 비동기 처리

### 라이브러리
- **Chart.js**: 라인, 바, 도넛 차트
- **Google Calendar API**: 할 일 ↔ 캘린더 동기화

### 배포
- **GitHub**: 소스 관리
- **Vercel**: 정적 사이트 호스팅

### 인증
- **Google OAuth 2.0**: 사용자 인증
- **localStorage**: 토큰 저장소

---

## 🚀 시작하기

### 로컬 개발
```bash
python -m http.server 8000
# http://localhost:8000 접속
```

### 온라인 배포
```
https://vatya-xxx.vercel.app
```

### Google Calendar 연동
1. Google Cloud Console에서 Client ID 생성
2. `업무-대시보드.html` 상단의 `GOOGLE_CLIENT_ID` 업데이트
3. "Sign in with Google" 클릭하여 인증

---

## 📝 주요 특징

✨ **리얼타임 동기화** - 할 일 추가/수정 시 즉시 Google Calendar 반영
🎨 **깔끔한 UI** - 마케팅팀 브랜드 컬러 (파란색) 적용
📊 **다양한 차트** - 판매 추이, 지역별 통계, 카테고리 분석
🔐 **안전한 인증** - Google OAuth로 본인 확인 후 접근
📱 **반응형 디자인** - 데스크톱/태블릿 최적화

---

**Made with ❤️ for VATYA Marketing Team**
