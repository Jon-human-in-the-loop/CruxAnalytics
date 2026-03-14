/**
 * Simple Event Emitter for cross-screen communication
 * Allows screens to notify each other of data changes without prop drilling
 */

type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event: string): void {
    this.events.delete(event);
  }
}

// Singleton instance
export const eventEmitter = new EventEmitter();

// Event types
export const Events = {
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_DUPLICATED: 'project:duplicated',
  SNAPSHOT_CREATED: 'snapshot:created',
  SNAPSHOT_DELETED: 'snapshot:deleted',
} as const;
