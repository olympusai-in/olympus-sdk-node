# Olympus Node.js SDK

Official Node.js/TypeScript SDK for [Olympus](https://olympusai.in) — AI-powered log analysis and debugging platform.

## Installation

```bash
npm install @olympusai/sdk
```

## Quick Start

```typescript
import { Olympus } from '@olympusai/sdk';

const olympus = new Olympus({
  apiKey: 'ol_your_key_here',
  service: 'payment-svc',
});

olympus.info('Payment processed — $14.99');
olympus.warn('Retry attempt 2/3');
olympus.error('Connection timeout after 30s');
olympus.debug('Query executed in 42ms');
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | Your Olympus API key (`ol_...`) |
| `service` | string | required | Service name for log grouping |
| `endpoint` | string | `https://api.olympusai.in` | Olympus server URL |
| `flushInterval` | number | `10000` | Ms between auto-flushes |
| `batchSize` | number | `100` | Max logs per flush |

## Features

- Buffers logs in memory, flushes in batches
- Auto-flushes every 10s (configurable)
- Auto-flushes when buffer hits batch size
- Retries on failure (puts logs back in buffer)
- Flushes on process exit (SIGINT/SIGTERM)
- Zero dependencies
