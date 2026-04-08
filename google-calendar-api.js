// Google Calendar API 통신
class GoogleCalendarAPI {
  constructor() {
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
    this.calendarId = 'primary';
  }

  // API 요청 (재사용 가능한 함수)
  async makeRequest(method, path, body = null) {
    const token = googleAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, options);

    if (!response.ok) {
      if (response.status === 401) {
        // 토큰 만료 → 재인증
        googleAuth.logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // TODO를 Calendar 이벤트로 변환
  todoToCalendarEvent(todo) {
    return {
      summary: todo.text,
      description: `담당: ${todo.who}\n우선순위: ${todo.priority.toUpperCase()}`,
      start: {
        date: new Date().toISOString().split('T')[0] // 오늘 날짜 (YYYY-MM-DD)
      },
      end: {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0] // 내일 (All-day event)
      },
      extendedProperties: {
        private: {
          todoId: String(todo.id),
          priority: todo.priority,
          who: todo.who,
          done: String(todo.done),
          localTimestamp: String(Date.now())
        }
      },
      transparency: todo.done ? 'transparent' : 'opaque'
    };
  }

  // 이벤트 생성
  async createEvent(todo) {
    try {
      const event = this.todoToCalendarEvent(todo);
      const result = await this.makeRequest(
        'POST',
        `/calendars/${this.calendarId}/events`,
        event
      );

      // TODO에 calendar event ID 저장
      todo.calendarEventId = result.id;
      return result;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  // 이벤트 업데이트 (완료 상태만 동기화)
  async updateEvent(todo) {
    if (!todo.calendarEventId) return;

    try {
      const event = this.todoToCalendarEvent(todo);
      await this.makeRequest(
        'PATCH',
        `/calendars/${this.calendarId}/events/${todo.calendarEventId}`,
        event
      );
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  // 이벤트 삭제
  async deleteEvent(eventId) {
    if (!eventId) return;

    try {
      await this.makeRequest(
        'DELETE',
        `/calendars/${this.calendarId}/events/${eventId}`,
        null
      );
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  // 모든 이벤트 조회 (우리 앱이 만든 것만)
  async listEvents() {
    try {
      const result = await this.makeRequest(
        'GET',
        `/calendars/${this.calendarId}/events?q=VATYA`,
        null
      );
      return result.items || [];
    } catch (error) {
      console.error('Failed to list events:', error);
      return [];
    }
  }

  // 주간 이벤트 조회 (일정 관리용)
  async getWeeklyEvents() {
    try {
      // 이번 주 월요일부터 일요일까지 이벤트 조회
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const timeMin = monday.toISOString();
      const timeMax = sunday.toISOString();

      const result = await this.makeRequest(
        'GET',
        `/calendars/${this.calendarId}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `orderBy=startTime&` +
        `singleEvents=true`,
        null
      );

      return result.items || [];
    } catch (error) {
      console.error('Failed to get weekly events:', error);
      return [];
    }
  }
}

const googleCalendarAPI = new GoogleCalendarAPI();
