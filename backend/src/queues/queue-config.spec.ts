import { getQueueConcurrency } from './queue-config';

describe('getQueueConcurrency', () => {
  it('returns defaults when concurrency map is empty', () => {
    expect(getQueueConcurrency('tx-submit')).toBe(1);
    expect(getQueueConcurrency('claim-events')).toBe(5);
    expect(getQueueConcurrency('claim-payouts')).toBe(3);
  });

  it('returns defaults when concurrency map is undefined', () => {
    expect(getQueueConcurrency('tx-submit', undefined)).toBe(1);
    expect(getQueueConcurrency('claim-events', undefined)).toBe(5);
  });

  it('parses concurrency map correctly', () => {
    const map = 'tx-submit=1,claim-events=10,claim-payouts=5';
    expect(getQueueConcurrency('tx-submit', map)).toBe(1);
    expect(getQueueConcurrency('claim-events', map)).toBe(10);
    expect(getQueueConcurrency('claim-payouts', map)).toBe(5);
  });

  it('handles whitespace in concurrency map', () => {
    const map = '  tx-submit = 2  ,  claim-events = 8  ';
    expect(getQueueConcurrency('tx-submit', map)).toBe(2);
    expect(getQueueConcurrency('claim-events', map)).toBe(8);
  });

  it('falls back to defaults for unmapped queues', () => {
    const map = 'tx-submit=1';
    expect(getQueueConcurrency('tx-submit', map)).toBe(1);
    expect(getQueueConcurrency('claim-events', map)).toBe(5); // default
    expect(getQueueConcurrency('claim-payouts', map)).toBe(3); // default
  });

  it('ignores invalid entries in concurrency map', () => {
    const map = 'tx-submit=1,invalid,claim-events=5,bad=abc';
    expect(getQueueConcurrency('tx-submit', map)).toBe(1);
    expect(getQueueConcurrency('claim-events', map)).toBe(5);
    expect(getQueueConcurrency('claim-payouts', map)).toBe(3); // default
  });

  it('ignores zero or negative concurrency values', () => {
    const map = 'tx-submit=0,claim-events=-1';
    expect(getQueueConcurrency('tx-submit', map)).toBe(1); // default, 0 is invalid
    expect(getQueueConcurrency('claim-events', map)).toBe(5); // default, -1 is invalid
  });

  it('enforces tx-submit defaults to 1 for nonce safety', () => {
    expect(getQueueConcurrency('tx-submit')).toBe(1);
    expect(getQueueConcurrency('tx-submit', '')).toBe(1);
    expect(getQueueConcurrency('tx-submit', 'claim-events=10')).toBe(1);
  });
});
