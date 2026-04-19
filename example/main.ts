import { Olympus } from '../src/index';

const olympus = new Olympus({
  apiKey: process.env.OLYMPUS_API_KEY || 'ol_YOUR_KEY_HERE',
  service: 'my-app',
  endpoint: 'http://localhost:4000',
  flushInterval: 5000, // flush every 5s for testing
});

// Log some events
olympus.info('Application started');
olympus.info('Connected to database');
olympus.warn('Cache miss for key=user:profile:123');
olympus.error('Failed to process payment — timeout after 30s');
olympus.debug('Query executed in 42ms');

console.log('Logs buffered. Waiting for flush...');

// Force flush and exit after 6 seconds
setTimeout(async () => {
  await olympus.flush();
  console.log('Done!');
  process.exit(0);
}, 6000);
