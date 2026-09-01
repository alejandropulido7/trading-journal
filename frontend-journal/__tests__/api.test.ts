import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/app/lib/api';
import Cookies from 'js-cookie';

describe('Axios API Client and Interceptor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('has default baseURL configured to FastAPI backend', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:8000');
  });

  it('adds Authorization Bearer header when token cookie exists', async () => {
    vi.spyOn(Cookies, 'get').mockReturnValue('mocked_jwt_token_xyz');

    // Run the request interceptor
    const requestHandler = (api.interceptors.request as any).handlers[0]?.fulfilled;
    expect(requestHandler).toBeDefined();

    const config = { headers: {} as Record<string, string> };
    const modifiedConfig = await requestHandler(config);

    expect(modifiedConfig.headers.Authorization).toBe('Bearer mocked_jwt_token_xyz');
  });

  it('does not add Authorization header when token cookie does not exist', async () => {
    vi.spyOn(Cookies, 'get').mockReturnValue(undefined);

    const requestHandler = (api.interceptors.request as any).handlers[0]?.fulfilled;
    const config = { headers: {} as Record<string, string> };
    const modifiedConfig = await requestHandler(config);

    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });
});
