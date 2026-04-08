// Google OAuth 2.0 Implicit Flow 인증 관리
class GoogleAuth {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.clientId = '593308343689-j5khk34u6d7n6c7d9k8l9m0n1o2p3q4r.apps.googleusercontent.com'; // Google OAuth Client ID (공개용)
    this.scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets'
    ];
  }

  // 페이지 로드 시 토큰 확인
  init() {
    // URL fragment에서 토큰 추출 (로그인 후 리다이렉트)
    this.extractTokenFromURL();

    const container = document.getElementById('google-auth-container');
    if (this.getStoredToken()) {
      this.showLogoutButton();
    } else {
      this.showLoginButton();
    }
  }

  // URL fragment에서 access token 추출
  extractTokenFromURL() {
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const expiresIn = params.get('expires_in');

      if (token) {
        this.accessToken = token;
        this.storeToken(token, expiresIn);
        this.onAuthSuccess();
        // URL에서 토큰 제거 (보안)
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  // Google Authorization Endpoint로 redirect
  login() {
    // 모바일과 데스크톱 모두 호환되는 리다이렉트 URI
    const baseUrl = window.location.origin;
    const pathname = window.location.pathname;

    // PWA 모드 또는 일반 모드에서 모두 작동
    const redirectUri = pathname === '/'
      ? baseUrl + '/'
      : baseUrl + pathname;

    const scope = this.scopes.join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(this.clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}&` +
      `prompt=consent&` +
      `access_type=offline&` +
      `include_granted_scopes=true`;

    // 모바일 사파리에서도 새 탭이 아닌 같은 탭에서 열기
    window.location.href = authUrl;
  }

  // 토큰 저장
  storeToken(token, expiresIn) {
    localStorage.setItem('google_token', token);
    localStorage.setItem('google_token_time', Date.now());
    if (expiresIn) {
      localStorage.setItem('google_token_expiry', Date.now() + parseInt(expiresIn) * 1000);
    }
  }

  // 저장된 토큰 조회
  getStoredToken() {
    const token = localStorage.getItem('google_token');
    const expiry = localStorage.getItem('google_token_expiry');

    if (!token) return null;

    // 토큰 유효 기간 확인
    if (expiry && Date.now() > parseInt(expiry)) {
      this.logout();
      return null;
    }

    this.accessToken = token;
    return token;
  }

  // 유효한 토큰 취득
  getAccessToken() {
    return this.getStoredToken() || this.accessToken;
  }

  // 인증 여부 확인
  isAuthenticated() {
    return this.getAccessToken() !== null;
  }

  // 로그인 버튼 표시
  showLoginButton() {
    const container = document.getElementById('google-auth-container');
    container.innerHTML = `
      <button onclick="googleAuth.login()" style="
        background: white;
        color: #1f2937;
        border: 1px solid #d1d5db;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span style="font-size: 16px;">🔐</span>
        Google로 로그인
      </button>
    `;
  }

  // 로그아웃 버튼 표시
  showLogoutButton() {
    const container = document.getElementById('google-auth-container');
    const userEmail = this.getUserEmail();
    container.innerHTML = `
      <span style="font-size: 12px; color: white;">${userEmail}</span>
      <button onclick="googleAuth.logout()" style="
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.4);
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        font-family: inherit;
      ">로그아웃</button>
    `;
  }

  // 로그아웃
  logout() {
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_token_time');
    localStorage.removeItem('google_token_expiry');
    this.accessToken = null;

    const container = document.getElementById('google-auth-container');
    this.showLoginButton();
  }

  // 사용자 정보 조회 (토큰에서 기본 정보 추출)
  getUserEmail() {
    // Implicit Flow에서는 JWT가 아닌 Bearer token이므로
    // Google People API 호출 또는 localStorage에서 가져오기
    return localStorage.getItem('google_user_email') || '사용자';
  }

  // 사용자 프로필 가져오기
  async fetchUserProfile() {
    if (!this.isAuthenticated()) return;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`
        }
      });
      const data = await response.json();
      localStorage.setItem('google_user_email', data.email);
      return data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }

  // 인증 성공 콜백
  async onAuthSuccess() {
    await this.fetchUserProfile();
    this.showLogoutButton();

    // 동기화 시작
    if (typeof syncManager !== 'undefined') {
      syncManager.syncFromCalendar();
    }
  }
}

// 전역 인스턴스
const googleAuth = new GoogleAuth();

// 인증 상태 확인 함수
function isGoogleAuthed() {
  return googleAuth.isAuthenticated();
}
