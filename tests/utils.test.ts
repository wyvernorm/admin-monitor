import { describe, it, expect } from 'vitest';
import {
  extractVideoId,
  extractChannelId,
  isChannelUrl,
  base64Encode,
  base64Decode,
  createSessionToken,
  verifySessionToken,
  verifySessionTokenCompat,
} from '../src/utils';

// ==================== extractVideoId ====================
describe('extractVideoId', () => {
  it('extracts from standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from watch URL with extra params', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=abc123&t=120')).toBe('abc123');
  });

  it('extracts from youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from youtu.be with query params', () => {
    expect(extractVideoId('https://youtu.be/abc123?t=60')).toBe('abc123');
  });

  it('extracts from Shorts URL', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/xyz789')).toBe('xyz789');
  });

  it('extracts from Shorts URL with query', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/xyz789?feature=share')).toBe('xyz789');
  });

  it('returns null for non-YouTube URL', () => {
    expect(extractVideoId('https://www.tiktok.com/@user/video/123')).toBeNull();
  });

  it('returns null for YouTube channel URL', () => {
    expect(extractVideoId('https://www.youtube.com/channel/UCxxxx')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull();
  });
});

// ==================== extractChannelId ====================
describe('extractChannelId', () => {
  it('extracts from channel URL', () => {
    expect(extractChannelId('https://www.youtube.com/channel/UCabcdef123')).toBe('UCabcdef123');
  });

  it('returns null for non-channel URL', () => {
    expect(extractChannelId('https://www.youtube.com/watch?v=abc')).toBeNull();
  });

  it('returns null for handle URL', () => {
    expect(extractChannelId('https://www.youtube.com/@username')).toBeNull();
  });
});

// ==================== isChannelUrl ====================
describe('isChannelUrl', () => {
  it('detects /channel/ URL', () => {
    expect(isChannelUrl('https://www.youtube.com/channel/UCxxxx')).toBe(true);
  });

  it('detects /@ handle URL', () => {
    expect(isChannelUrl('https://www.youtube.com/@username')).toBe(true);
  });

  it('detects /c/ custom URL', () => {
    expect(isChannelUrl('https://www.youtube.com/c/channelname')).toBe(true);
  });

  it('returns false for video URL', () => {
    expect(isChannelUrl('https://www.youtube.com/watch?v=abc')).toBe(false);
  });
});

// ==================== base64 encode/decode ====================
describe('base64Encode / base64Decode', () => {
  it('roundtrips ASCII string', () => {
    const original = 'Hello, World!';
    expect(base64Decode(base64Encode(original))).toBe(original);
  });

  it('roundtrips Thai text', () => {
    const original = 'สวัสดีครับ';
    expect(base64Decode(base64Encode(original))).toBe(original);
  });

  it('roundtrips JSON payload', () => {
    const payload = JSON.stringify({ email: 'test@test.com', name: 'ทดสอบ', exp: 123456 });
    expect(base64Decode(base64Encode(payload))).toBe(payload);
  });

  it('handles empty string', () => {
    expect(base64Decode(base64Encode(''))).toBe('');
  });

  it('handles emoji', () => {
    const original = '🎉🚀💻';
    expect(base64Decode(base64Encode(original))).toBe(original);
  });
});

// ==================== HMAC Session Tokens ====================
describe('createSessionToken / verifySessionToken', () => {
  const SECRET = 'test-secret-key-for-hmac';

  it('creates and verifies a valid token', async () => {
    const payload = { email: 'test@test.com', name: 'Test', exp: Date.now() + 60000 };
    const token = await createSessionToken(payload, SECRET);

    expect(token).toContain('.'); // format: base64.hex
    expect(token.split('.').length).toBe(2);

    const verified = await verifySessionToken(token, SECRET);
    expect(verified).not.toBeNull();
    expect(verified!.email).toBe('test@test.com');
    expect(verified!.name).toBe('Test');
  });

  it('rejects tampered payload', async () => {
    const payload = { email: 'test@test.com', name: 'Test', exp: Date.now() + 60000 };
    const token = await createSessionToken(payload, SECRET);

    // Tamper with the payload part
    const [, sig] = token.split('.');
    const fakePayload = base64Encode(JSON.stringify({ email: 'hacker@evil.com', name: 'Hacker', exp: Date.now() + 60000 }));
    const tampered = `${fakePayload}.${sig}`;

    const verified = await verifySessionToken(tampered, SECRET);
    expect(verified).toBeNull();
  });

  it('rejects expired token', async () => {
    const payload = { email: 'test@test.com', name: 'Test', exp: Date.now() - 1000 };
    const token = await createSessionToken(payload, SECRET);

    const verified = await verifySessionToken(token, SECRET);
    expect(verified).toBeNull();
  });

  it('rejects token signed with wrong secret', async () => {
    const payload = { email: 'test@test.com', name: 'Test', exp: Date.now() + 60000 };
    const token = await createSessionToken(payload, SECRET);

    const verified = await verifySessionToken(token, 'wrong-secret');
    expect(verified).toBeNull();
  });

  it('rejects malformed token', async () => {
    expect(await verifySessionToken('not-a-valid-token', SECRET)).toBeNull();
    expect(await verifySessionToken('', SECRET)).toBeNull();
    expect(await verifySessionToken('a.b.c', SECRET)).toBeNull();
  });
});

// ==================== verifySessionTokenCompat ====================
describe('verifySessionTokenCompat', () => {
  const SECRET = 'test-secret-key-for-hmac';

  it('verifies new HMAC-signed tokens', async () => {
    const payload = { email: 'test@test.com', name: 'Test', exp: Date.now() + 60000 };
    const token = await createSessionToken(payload, SECRET);

    const result = await verifySessionTokenCompat(token, SECRET);
    expect(result).not.toBeNull();
    expect(result!.email).toBe('test@test.com');
  });

  it('falls back to legacy unsigned base64 tokens', async () => {
    const payload = { email: 'legacy@test.com', name: 'Legacy', exp: Date.now() + 60000 };
    const legacyToken = base64Encode(JSON.stringify(payload));

    const result = await verifySessionTokenCompat(legacyToken, SECRET);
    expect(result).not.toBeNull();
    expect(result!.email).toBe('legacy@test.com');
  });

  it('rejects expired legacy tokens', async () => {
    const payload = { email: 'legacy@test.com', name: 'Legacy', exp: Date.now() - 1000 };
    const legacyToken = base64Encode(JSON.stringify(payload));

    const result = await verifySessionTokenCompat(legacyToken, SECRET);
    expect(result).toBeNull();
  });

  it('rejects garbage input', async () => {
    expect(await verifySessionTokenCompat('garbage!!!', SECRET)).toBeNull();
  });
});
