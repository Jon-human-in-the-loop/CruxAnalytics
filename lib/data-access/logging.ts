/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

/**
 * Base log entry structure
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Logger name */
  logger: string;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Error object if applicable */
  error?: Error;
}

/**
 * Audit log entry for tracking important operations
 */
export interface AuditLogEntry extends LogEntry {
  /** User or system performing the action */
  actor: string;
  /** Action performed */
  action: string;
  /** Resource affected */
  resource: string;
  /** Operation result */
  result: 'success' | 'failure';
  /** Additional audit metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Log output interface
 */
export interface LogOutput {
  /** Write a log entry */
  write(entry: LogEntry): Promise<void>;
  /** Flush any buffered logs */
  flush?(): Promise<void>;
}

/**
 * Console log output implementation
 */
export class ConsoleLogOutput implements LogOutput {
  private colorize: boolean;

  constructor(options: { colorize?: boolean } = {}) {
    this.colorize = options.colorize ?? true;
  }

  async write(entry: LogEntry): Promise<void> {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${levelName}] [${entry.logger}]`;

    let message = `${prefix} ${entry.message}`;

    if (this.colorize) {
      message = this.applyColor(message, entry.level);
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }

    const logMethod = this.getConsoleMethod(entry.level);
    logMethod(message);
  }

  private applyColor(message: string, level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m',    // Cyan
      [LogLevel.INFO]: '\x1b[32m',     // Green
      [LogLevel.WARN]: '\x1b[33m',     // Yellow
      [LogLevel.ERROR]: '\x1b[31m',    // Red
      [LogLevel.CRITICAL]: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    return `${colors[level]}${message}${reset}`;
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
}

/**
 * In-memory log output for testing
 */
export class MemoryLogOutput implements LogOutput {
  private logs: LogEntry[] = [];
  private maxSize: number;

  constructor(options: { maxSize?: number } = {}) {
    this.maxSize = options.maxSize ?? 1000;
  }

  async write(entry: LogEntry): Promise<void> {
    this.logs.push(entry);
    if (this.logs.length > this.maxSize) {
      this.logs.shift();
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get log count
   */
  count(): number {
    return this.logs.length;
  }
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private outputs: LogOutput[];
  private minLevel: LogLevel;

  constructor(
    private name: string,
    options: {
      outputs?: LogOutput[];
      minLevel?: LogLevel;
    } = {}
  ) {
    this.outputs = options.outputs || [new ConsoleLogOutput()];
    this.minLevel = options.minLevel ?? LogLevel.INFO;
  }

  /**
   * Log a debug message
   */
  async debug(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  async info(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  async warn(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  async error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log a critical message
   */
  async critical(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.log(LogLevel.CRITICAL, message, context, error);
  }

  /**
   * Log an audit entry
   */
  async audit(
    actor: string,
    action: string,
    resource: string,
    result: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const entry: AuditLogEntry = {
      level: LogLevel.INFO,
      message: `Audit: ${actor} ${action} ${resource} - ${result}`,
      timestamp: new Date(),
      logger: this.name,
      actor,
      action,
      resource,
      result,
      metadata,
    };

    if (entry.level >= this.minLevel) {
      await Promise.all(this.outputs.map((output) => output.write(entry)));
    }
  }

  /**
   * Core logging method
   */
  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): Promise<void> {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      logger: this.name,
      context,
      error,
    };

    await Promise.all(this.outputs.map((output) => output.write(entry)));
  }

  /**
   * Add a log output
   */
  addOutput(output: LogOutput): void {
    this.outputs.push(output);
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Flush all outputs
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.outputs
        .filter((output) => output.flush)
        .map((output) => output.flush!())
    );
  }
}

/**
 * Logger factory for managing loggers
 */
export class LoggerFactory {
  private static loggers: Map<string, Logger> = new Map();
  private static defaultOutputs: LogOutput[] = [new ConsoleLogOutput()];
  private static defaultMinLevel: LogLevel = LogLevel.INFO;

  /**
   * Get or create a logger
   */
  static getLogger(name: string): Logger {
    let logger = this.loggers.get(name);
    if (!logger) {
      logger = new Logger(name, {
        outputs: this.defaultOutputs,
        minLevel: this.defaultMinLevel,
      });
      this.loggers.set(name, logger);
    }
    return logger;
  }

  /**
   * Set default outputs for new loggers
   */
  static setDefaultOutputs(outputs: LogOutput[]): void {
    this.defaultOutputs = outputs;
  }

  /**
   * Set default minimum level for new loggers
   */
  static setDefaultMinLevel(level: LogLevel): void {
    this.defaultMinLevel = level;
  }

  /**
   * Clear all loggers
   */
  static clear(): void {
    this.loggers.clear();
  }

  /**
   * Flush all loggers
   */
  static async flushAll(): Promise<void> {
    await Promise.all(
      Array.from(this.loggers.values()).map((logger) => logger.flush())
    );
  }
}
