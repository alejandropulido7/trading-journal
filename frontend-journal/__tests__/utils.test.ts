import { describe, it, expect } from 'vitest';
import { cn } from '@/app/lib/utils';

describe('cn utility', () => {
  it('merges single and multiple class names properly', () => {
    const result = cn('font-bold', 'text-slate-800');
    expect(result).toBe('font-bold text-slate-800');
  });

  it('handles conditional class names with falsy values', () => {
    const isTrue = true;
    const isFalse = false;
    const result = cn('base-class', isTrue && 'active-class', isFalse && 'inactive-class', null, undefined);
    expect(result).toBe('base-class active-class');
  });

  it('resolves conflicting tailwind classes by keeping the last one (tailwind-merge)', () => {
    const result = cn('p-2', 'p-4', 'text-red-500', 'text-blue-500');
    expect(result).toBe('p-4 text-blue-500');
  });

  it('handles array and object syntax', () => {
    const result = cn(['px-4', 'py-2'], { 'bg-emerald-500': true, 'bg-rose-500': false });
    expect(result).toBe('px-4 py-2 bg-emerald-500');
  });
});
