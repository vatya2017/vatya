// Google OAuth 2.0 인증 관리 (Client ID 자동 설정 방식)
class GoogleAuth {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.clientId = localStorage.getItem('google_client_id') || null;
    this.scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets'
    ];
  }

  // 페이지 로드 시 토큰 확인
  init() {
    // URL fragment에서 토큰 추출 (로그인 후 리다이렉트)
    this.extractTokenFromURL();

    if (this.getStoredToken()) {
      this.showLogoutButton();
      // 대시보드 표시
      document.getElementById('dashboard-container').style.display = 'block';
      document.getElementById('login-modal').style.display = 'none';
    } else {
      this.showLoginModal();
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

  // 로그인 모달 표시
  showLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
      loginModal.style.display = 'flex';
    }
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
      dashboardContainer.style.display = 'none';
    }
  }

  // Google Authorization Endpoint로 redirect
  login() {
    // Client ID 없으면 입력 요청
    if (!this.clientId) {
      this.promptForClientId();
      return;
    }

    // 현재 페이지로 리다이렉트되도록 설정
    const redirectUri = window.location.origin + '/';
    const scope = this.scopes.join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(this.clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}&` +
      `prompt=consent&` +
      `include_granted_scopes=true`;

    window.location.href = authUrl;
  }

  // Client ID 입력 모달
  promptForClientId() {
    const clientId = prompt(
      '🔐 Google Client ID를 입력하세요:\n\n' +
      '1. https://console.cloud.google.com 접속\n' +
      '2. 프로젝트 생성 또는 선택\n' +
      '3. "사용자 인증 정보" → "OAuth 2.0 클라이언트 ID" 생성\n' +
      '4. "웹 애플리케이션" 선택 후 Client ID 복사\n' +
      '5. 아래에 붙여넣기\n\n' +
      'Client ID를 입력하세요:'
    );

    if (clientId) {
      this.setClientId(clientId);
      // 다시 시도
      setTimeout(() => this.login(), 300);
    }
  }

  // Client ID 설정 및 저장
  setClientId(clientId) {
    this.clientId = clientId;
    localStorage.setItem('google_client_id', clientId);
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

  // 로그아웃
  logout() {
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_token_time');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_user_email');
    this.accessToken = null;

    this.showLoginModal();
  }

  // 사용자 정보 조회
  getUserEmail() {
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

    // 대시보드 표시
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginModal = document.getElementById('login-modal');
    if (dashboardContainer && loginModal) {
      dashboardContainer.style.display = 'block';
      loginModal.style.display = 'none';
    }

    // topbar에 로그아웃 버튼 표시
    const userEmail = this.getUserEmail();
    const authContainer = document.getElementById('google-auth-container');
    if (authContainer) {
      authContainer.innerHTML = `
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
