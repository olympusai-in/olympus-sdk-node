export interface OlympusConfig {
  apiKey: string;
  service: string;
  endpoint?: string;
  flushInterval?: number; // ms, default 10000 (10s)
  batchSize?: number;     // max logs per flush, default 100
}

interface LogEntry {
  level: number;
  message: string;
  timestamp?: string;
}

const Level = { INFO: 0, WARN: 1, ERROR: 2, DEBUG: 3 } as const;

export class Olympus {
  private config: Required<OlympusConfig>;
  private buffer: LogEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: OlympusConfig) {
    if (!config.apiKey) throw new Error('Olympus: apiKey is required');
    if (!config.service) throw new Error('Olympus: service name is required');

    this.config = {
      endpoint: 'https://api.olympusai.in',
      flushInterval: 10_000,
      batchSize: 100,
      ...config,
    };

    this.startAutoFlush();

    // Flush on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.flush());
      process.on('SIGINT', () => { this.flush().then(() => process.exit(0)); });
      process.on('SIGTERM', () => { this.flush().then(() => process.exit(0)); });
    }
  }

  info(message: string): void {
    this.push(Level.INFO, message);
  }

  warn(message: string): void {
    this.push(Level.WARN, message);
  }

  error(message: string): void {
    this.push(Level.ERROR, message);
  }

  debug(message: string): void {
    this.push(Level.DEBUG, message);
  }

  private push(level: number, message: string): void {
    this.buffer.push({
      level,
      message,
      timestamp: new Date().toISOString(),
    });

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = this.buffer.splice(0, this.config.batchSize);

    try {
      const res = await fetch(`${this.config.endpoint}/api/v1/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          service: this.config.service,
          logs,
        }),
      });

      if (!res.ok) {
        // Put logs back on failure
        this.buffer.unshift(...logs);
        const body = await res.json().catch(() => ({})) as Record<string, string>;
        console.error(`[Olympus] Failed to flush: ${body.error || res.status}`);
      }
    } catch (err) {
      // Put logs back on network error
      this.buffer.unshift(...logs);
      console.error(`[Olympus] Network error: ${(err as Error).message}`);
    }
  }

  private startAutoFlush(): void {
    this.timer = setInterval(() => this.flush(), this.config.flushInterval);
    // Don't keep process alive just for flushing
    if (this.timer && typeof this.timer === 'object' && 'unref' in this.timer) {
      this.timer.unref();
    }
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}

export default Olympus;
export { Level };
