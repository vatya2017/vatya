// Google OAuth 인증 관리
class GoogleAuth {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // 인증 초기화 (페이지 로드 시)
  init() {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      callback: this.handleAuthResponse.bind(this)
    });

    const container = document.getElementById('google-auth-container');
    if (this.getStoredToken()) {
      this.showLogoutButton();
    } else {
      google.accounts.id.renderButton(container, {
        type: 'standard',
        size: 'large',
        text: 'signin'
      });
    }
  }

  // 인증 응답 처리
  handleAuthResponse(response) {
    if (response.credential) {
      // JWT 디코딩
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      this.accessToken = response.credential;
      this.storeToken(response.credential);
      this.showLogoutButton();
      this.onAuthSuccess();
    }
  }

  // 토큰 저장
  storeToken(token) {
    localStorage.setItem('google_token', token);
    localStorage.setItem('google_token_time', Date.now());
  }

  // 저장된 토큰 조회
  getStoredToken() {
    const token = localStorage.getItem('google_token');
    const time = localStorage.getItem('google_token_time');

    if (!token) return null;

    // 토큰 유효 기간: 1시간
    if (Date.now() - parseInt(time) > 3600000) {
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
    this.accessToken = null;

    const container = document.getElementById('google-auth-container');
    container.innerHTML = '';
    google.accounts.id.renderButton(container, {
      type: 'standard',
      size: 'large',
      text: 'signin'
    });
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
      ">SIGN OUT</button>
    `;
  }

  // 사용자 이메일 추출
  getUserEmail() {
    if (!this.accessToken) return '';
    const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
    return payload.email || 'User';
  }

  // 인증 성공 콜백
  onAuthSuccess() {
    // 페이지 새로고침 또는 동기화 시작
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
