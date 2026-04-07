import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce Hook', () => {
    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('updates to the new value after the specified delay', () => {
        vi.useFakeTimers();
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        // Update value
        rerender({ value: 'updated', delay: 500 });
        
        // Should still be 'initial' immediately after update
        expect(result.current).toBe('initial');

        // Fast-forward time by 500ms
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
        vi.useRealTimers();
    });

    it('does not update the value before the delay period', () => {
        vi.useFakeTimers();
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'updated', delay: 500 });
        
        act(() => {
            vi.advanceTimersByTime(250); // Less than 500ms
        });

        expect(result.current).toBe('initial');
        vi.useRealTimers();
    });

    it('updates to the latest value if multiple updates occur within the delay window', () => {
        vi.useFakeTimers();
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'update1', delay: 500 });
        
        act(() => {
            vi.advanceTimersByTime(250);
        });

        rerender({ value: 'update2', delay: 500 });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('update2');
        vi.useRealTimers();
    });
});
