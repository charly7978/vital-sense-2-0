
/**
 * Custom EventEmitter implementation for browser environments
 */
type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private eventMap: { [key: string]: EventCallback[] };

  constructor() {
    this.eventMap = {};
  }

  on(eventName: string, callback: EventCallback): this {
    if (!this.eventMap[eventName]) {
      this.eventMap[eventName] = [];
    }
    this.eventMap[eventName].push(callback);
    return this;
  }

  emit(eventName: string, ...args: any[]): this {
    const handlers = this.eventMap[eventName];
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
    return this;
  }

  removeAllListeners(eventName?: string): this {
    if (eventName) {
      delete this.eventMap[eventName];
    } else {
      this.eventMap = {};
    }
    return this;
  }
}
