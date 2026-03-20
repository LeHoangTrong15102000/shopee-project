import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation, useFocusTrap } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns handleKeyDown function', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ onEnter: vi.fn() }));
    expect(typeof result.current.handleKeyDown).toBe('function');
  });

  it('calls onEnter when Enter key is pressed', () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEnter }));
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    result.current.handleKeyDown(event);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('calls onEnter when Space key is pressed', () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEnter }));
    const event = new KeyboardEvent('keydown', { key: ' ' });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    result.current.handleKeyDown(event);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('calls onEscape when Escape key is pressed', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEscape }));
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    result.current.handleKeyDown(event);
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('calls onArrowUp when ArrowUp key is pressed', () => {
    const onArrowUp = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onArrowUp }));
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    result.current.handleKeyDown(event);
    expect(onArrowUp).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('calls onArrowDown when ArrowDown key is pressed', () => {
    const onArrowDown = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onArrowDown }));
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    result.current.handleKeyDown(event);
    expect(onArrowDown).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('does nothing when enabled is false', () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEnter, enabled: false }));
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    result.current.handleKeyDown(event);
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('does nothing for unhandled keys', () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ onEnter }));
    const event = new KeyboardEvent('keydown', { key: 'a' });
    result.current.handleKeyDown(event);
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('handles missing callbacks gracefully', () => {
    const { result } = renderHook(() => useKeyboardNavigation({}));
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    expect(() => result.current.handleKeyDown(event)).not.toThrow();
  });
});

describe('useFocusTrap', () => {
  it('does nothing when isActive is false', () => {
    const container = document.createElement('div');
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, false));
    // No error thrown
  });

  it('does nothing when ref is null', () => {
    const ref = { current: null };
    renderHook(() => useFocusTrap(ref as any, true));
    // No error thrown
  });

  it('focuses first focusable element when active', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    button1.textContent = 'First';
    const button2 = document.createElement('button');
    button2.textContent = 'Last';
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    expect(document.activeElement).toBe(button1);
    document.body.removeChild(container);
  });

  it('traps focus on Tab from last element to first', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    button2.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    container.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it('traps focus on Shift+Tab from first element to last', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    button1.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    container.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it('ignores non-Tab keys', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    container.appendChild(button1);
    document.body.appendChild(container);

    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    container.dispatchEvent(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it('cleans up event listener on unmount', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    container.appendChild(button1);
    document.body.appendChild(container);

    const ref = { current: container };
    const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');
    const { unmount } = renderHook(() => useFocusTrap(ref, true));

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    document.body.removeChild(container);
  });
});
