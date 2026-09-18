import test from 'node:test';
import assert from 'node:assert/strict';
import { isTenantMediaPath, hasGenerationAccess } from '../../src/lib/security-policy.ts';

test('media paths reject other tenants and traversal encodings before service-role signing', () => {
  assert.equal(isTenantMediaPath('tenant-a/photo/result.png', 'tenant-a'), true);
  for (const path of ['tenant-b/result.png', 'tenant-a/../tenant-b/photo.png',
    'tenant-a/%2e%2e/tenant-b/photo.png', 'tenant-a/\\tenant-b/photo.png',
    'tenant-a/\t..\t/tenant-b/photo.png', 'tenant-a/\n..\r/tenant-b/photo.png',
    'tenant-a/photo.png?x=1', 'tenant-a/photo.png#fragment', 'tenant-a/photo\u007f.png',
    'tenant-a//photo.png', 'tenant-a/./photo.png', null, 'https://evil.example/photo.png']) {
    assert.equal(isTenantMediaPath(path, 'tenant-a'), false, String(path));
  }
});

test('billing access denies failed, incomplete, paused, canceled and expired paid subscriptions', () => {
  const now = Date.parse('2026-09-18T12:00:00Z');
  const paid = { plan: 'pro', status: 'active', current_period_end: '2026-10-01T00:00:00Z' };
  assert.equal(hasGenerationAccess(paid, now), true);
  assert.equal(hasGenerationAccess({ ...paid, status: 'trialing' }, now), true);
  for (const status of ['past_due', 'incomplete', 'paused', 'canceled', 'unpaid']) {
    assert.equal(hasGenerationAccess({ ...paid, status }, now), false);
  }
  assert.equal(hasGenerationAccess({ ...paid, current_period_end: null }, now), false);
  assert.equal(hasGenerationAccess({ ...paid, current_period_end: '2026-09-01T00:00:00Z' }, now), false);
  assert.equal(hasGenerationAccess({ plan: 'free', status: 'active', current_period_end: null }, now), true);
});
