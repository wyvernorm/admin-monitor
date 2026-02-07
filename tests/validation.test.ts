import { describe, it, expect } from 'vitest';

// ==================== Input Validation Tests ====================
// These test the validation logic used in endpoints

describe('Cleanup days validation', () => {
  // Mirrors the validation in monitor.ts /cleanup endpoint
  function validateDays(days: unknown): { valid: boolean; value?: number; error?: string } {
    const daysNum = Math.floor(Number(days));
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return { valid: false, error: 'days ต้องเป็นตัวเลข 1-365' };
    }
    return { valid: true, value: daysNum };
  }

  it('accepts valid integer', () => {
    expect(validateDays(30)).toEqual({ valid: true, value: 30 });
  });

  it('accepts valid float (floors it)', () => {
    expect(validateDays(7.5)).toEqual({ valid: true, value: 7 });
  });

  it('accepts string number', () => {
    expect(validateDays('14')).toEqual({ valid: true, value: 14 });
  });

  it('accepts boundary value 1', () => {
    expect(validateDays(1)).toEqual({ valid: true, value: 1 });
  });

  it('accepts boundary value 365', () => {
    expect(validateDays(365)).toEqual({ valid: true, value: 365 });
  });

  it('rejects 0', () => {
    expect(validateDays(0).valid).toBe(false);
  });

  it('rejects negative', () => {
    expect(validateDays(-5).valid).toBe(false);
  });

  it('rejects > 365', () => {
    expect(validateDays(400).valid).toBe(false);
  });

  it('rejects NaN string', () => {
    expect(validateDays('abc').valid).toBe(false);
  });

  it('rejects null', () => {
    expect(validateDays(null).valid).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateDays(undefined).valid).toBe(false);
  });
});

describe('Order target validation', () => {
  // Mirrors validation in monitor.ts /orders endpoint
  function validateTargets(viewTarget: unknown, likeTarget: unknown): { valid: boolean; error?: string } {
    const viewTargetNum = Number(viewTarget) || 0;
    const likeTargetNum = Number(likeTarget) || 0;
    if (viewTargetNum === 0 && likeTargetNum === 0) {
      return { valid: false, error: 'กรุณาระบุจำนวนวิวหรือไลค์อย่างน้อย 1 อย่าง' };
    }
    return { valid: true };
  }

  it('accepts view only', () => {
    expect(validateTargets(1000, 0).valid).toBe(true);
  });

  it('accepts like only', () => {
    expect(validateTargets(0, 500).valid).toBe(true);
  });

  it('accepts both', () => {
    expect(validateTargets(1000, 500).valid).toBe(true);
  });

  it('rejects both zero', () => {
    expect(validateTargets(0, 0).valid).toBe(false);
  });

  it('rejects both undefined', () => {
    expect(validateTargets(undefined, undefined).valid).toBe(false);
  });

  it('handles string numbers', () => {
    expect(validateTargets('1000', '0').valid).toBe(true);
  });
});

describe('Rate limit logic', () => {
  // Mirrors rate limiting check in index.ts
  function shouldRateLimit(count: number, limit: number = 10): boolean {
    return count >= limit;
  }

  it('allows under limit', () => {
    expect(shouldRateLimit(5)).toBe(false);
  });

  it('blocks at limit', () => {
    expect(shouldRateLimit(10)).toBe(true);
  });

  it('blocks over limit', () => {
    expect(shouldRateLimit(15)).toBe(true);
  });

  it('allows first request', () => {
    expect(shouldRateLimit(0)).toBe(false);
  });
});

describe('Cooldown logic', () => {
  // Mirrors cooldown check in monitor.ts check-all
  function getCooldownRemaining(lastCheckTime: string | null, cooldownSeconds: number = 300): number {
    if (!lastCheckTime) return 0;
    const elapsed = (Date.now() - new Date(lastCheckTime).getTime()) / 1000;
    const remaining = Math.ceil(cooldownSeconds - elapsed);
    return remaining > 0 ? remaining : 0;
  }

  it('returns 0 when no last check', () => {
    expect(getCooldownRemaining(null)).toBe(0);
  });

  it('returns remaining seconds during cooldown', () => {
    const twoMinsAgo = new Date(Date.now() - 120 * 1000).toISOString();
    const remaining = getCooldownRemaining(twoMinsAgo);
    expect(remaining).toBeGreaterThan(170);
    expect(remaining).toBeLessThanOrEqual(180);
  });

  it('returns 0 after cooldown expires', () => {
    const tenMinsAgo = new Date(Date.now() - 600 * 1000).toISOString();
    expect(getCooldownRemaining(tenMinsAgo)).toBe(0);
  });
});

describe('Target completion logic', () => {
  // Mirrors completion check in cron.ts
  function isTargetReached(current: number, target: number): boolean {
    return target === 0 || current >= target;
  }

  function isOrderComplete(viewCurrent: number, viewTarget: number, likeCurrent: number, likeTarget: number): boolean {
    return isTargetReached(viewCurrent, viewTarget) && isTargetReached(likeCurrent, likeTarget);
  }

  it('completes when view target reached', () => {
    expect(isOrderComplete(10000, 10000, 0, 0)).toBe(true);
  });

  it('completes when view exceeds target', () => {
    expect(isOrderComplete(15000, 10000, 0, 0)).toBe(true);
  });

  it('not complete when view below target', () => {
    expect(isOrderComplete(5000, 10000, 0, 0)).toBe(false);
  });

  it('completes when both targets reached', () => {
    expect(isOrderComplete(10000, 10000, 500, 500)).toBe(true);
  });

  it('not complete when only view reached', () => {
    expect(isOrderComplete(10000, 10000, 200, 500)).toBe(false);
  });

  it('not complete when only like reached', () => {
    expect(isOrderComplete(5000, 10000, 500, 500)).toBe(false);
  });

  it('completes when no targets set (both 0)', () => {
    expect(isOrderComplete(0, 0, 0, 0)).toBe(true);
  });

  it('handles like-only order', () => {
    expect(isOrderComplete(0, 0, 1000, 500)).toBe(true);
  });
});
