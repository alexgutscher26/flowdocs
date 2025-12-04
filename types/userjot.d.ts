// UserJot Widget Type Definitions
interface UserJotWidget {
  init(projectId: string, options?: { widget?: boolean }): void;
  identify(userId: string, userData?: Record<string, any>): void;
  track(eventName: string, eventData?: Record<string, any>): void;
  show(): void;
  hide(): void;
}

interface Window {
  $ujq: Array<[string, ...any[]]>;
  uj: UserJotWidget;
}
