// Google Calendar와 로컬 todos 동기화
class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncQueue = [];
  }

  // 할 일을 Calendar에 동기화
  async syncTodoToCalendar(todo) {
    if (this.isSyncing) {
      this.syncQueue.push({ action: 'create', todo });
      return;
    }

    this.isSyncing = true;
    try {
      if (todo.calendarEventId) {
        // 이미 있으면 업데이트
        await googleCalendarAPI.updateEvent(todo);
      } else {
        // 새로 생성
        await googleCalendarAPI.createEvent(todo);
      }
      console.log(`✓ Synced todo: ${todo.text}`);
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncQueue.push({ action: 'create', todo });
    } finally {
      this.isSyncing = false;
    }
  }

  // Calendar에서 모든 이벤트 가져오기
  async syncFromCalendar() {
    if (!isGoogleAuthed()) return;

    try {
      const events = await googleCalendarAPI.listEvents();

      // 각 이벤트를 로컬 todos와 병합
      for (const event of events) {
        const todoId = event.extendedProperties?.private?.todoId;
        const localTodo = todos.find(t => t.id == todoId);

        if (localTodo) {
          // 이미 있으면 업데이트
          localTodo.calendarEventId = event.id;
          localTodo.lastSyncTime = new Date(event.updated).getTime();
        } else {
          // 새로 추가 (Calendar에만 있는 경우)
          todos.push({
            id: Math.max(...todos.map(t => t.id), 0) + 1,
            text: event.summary,
            priority: event.extendedProperties?.private?.priority || 'med',
            done: event.transparency === 'transparent',
            who: event.extendedProperties?.private?.who || 'Calendar',
            calendarEventId: event.id,
            lastSyncTime: new Date(event.updated).getTime()
          });
        }
      }

      renderTodos();
      console.log(`✓ Synced ${events.length} events from Calendar`);
    } catch (error) {
      console.error('Failed to sync from calendar:', error);
    }
  }

  // 큐에 있는 변경사항 처리
  async processSyncQueue() {
    while (this.syncQueue.length > 0 && isGoogleAuthed()) {
      const { action, todo } = this.syncQueue.shift();
      await this.syncTodoToCalendar(todo);
    }
  }

  // 주간 일정 동기화
  async syncWeeklySchedule() {
    if (!isGoogleAuthed()) return [];

    try {
      const events = await googleCalendarAPI.getWeeklyEvents();
      console.log(`✓ Synced ${events.length} weekly events from Calendar`);
      return events;
    } catch (error) {
      console.error('Failed to sync weekly schedule:', error);
      return [];
    }
  }
}

const syncManager = new SyncManager();

// 전역 함수들
async function syncTodoToCalendar(todo) {
  await syncManager.syncTodoToCalendar(todo);
}

async function deleteCalendarEvent(eventId) {
  await googleCalendarAPI.deleteEvent(eventId);
}

async function updateCalendarEvent(todo) {
  await syncManager.syncTodoToCalendar(todo);
}

// 주간 일정 조회
async function getWeeklyScheduleFromCalendar() {
  return await syncManager.syncWeeklySchedule();
}
