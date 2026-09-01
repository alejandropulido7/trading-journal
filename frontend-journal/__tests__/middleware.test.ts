import { describe, it, expect } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('Next.js Authentication Middleware', () => {
  it('redirects unauthenticated users to /login when accessing protected routes', () => {
    const req = new NextRequest('http://localhost:3000/accounts', {
      headers: { cookie: '' },
    });

    const res = middleware(req);
    expect(res.status).toBe(307); // NextResponse.redirect default status
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('allows unauthenticated users to access /login', () => {
    const req = new NextRequest('http://localhost:3000/login', {
      headers: { cookie: '' },
    });

    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows unauthenticated users to access /register', () => {
    const req = new NextRequest('http://localhost:3000/register', {
      headers: { cookie: '' },
    });

    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from /login to / (dashboard root)', () => {
    const req = new NextRequest('http://localhost:3000/login', {
      headers: { cookie: 'token=valid_test_token_123' },
    });

    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('allows authenticated users to access protected routes', () => {
    const req = new NextRequest('http://localhost:3000/trade-ideas', {
      headers: { cookie: 'token=valid_test_token_123' },
    });

    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});
