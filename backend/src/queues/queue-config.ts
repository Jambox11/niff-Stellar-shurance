import { QUEUE_NAMES, QueueName } from './names';

const QUEUE_CONCURRENCY_DEFAULTS: Record<QueueName, number> = {
  'tx-submit': 1,
  'claim-events': 5,
  'claim-payouts': 3,
};

export function getQueueConcurrency(
  queueName: QueueName,
  concurrencyMapStr?: string,
): number {
  if (!concurrencyMapStr) {
    return QUEUE_CONCURRENCY_DEFAULTS[queueName];
  }

  const map = new Map<string, number>();
  for (const pair of concurrencyMapStr.split(',')) {
    const [name, value] = pair.trim().split('=');
    if (name && value) {
      const concurrency = parseInt(value, 10);
      if (!isNaN(concurrency) && concurrency > 0) {
        map.set(name.trim(), concurrency);
      }
    }
  }

  return map.get(queueName) ?? QUEUE_CONCURRENCY_DEFAULTS[queueName];
}
