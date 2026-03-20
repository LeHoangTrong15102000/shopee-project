import { describe, it, expect } from 'vitest';
import { ordersStatus, orderStatusFromNumber, orderStatusToNumber } from '../order';

describe('ordersStatus', () => {
  it('has correct numeric values', () => {
    expect(ordersStatus.all).toBe(0);
    expect(ordersStatus.pending).toBe(1);
    expect(ordersStatus.confirmed).toBe(2);
    expect(ordersStatus.processing).toBe(3);
    expect(ordersStatus.shipping).toBe(4);
    expect(ordersStatus.delivered).toBe(5);
    expect(ordersStatus.cancelled).toBe(6);
    expect(ordersStatus.returned).toBe(7);
  });
});

describe('orderStatusFromNumber', () => {
  it('converts numeric status to string', () => {
    expect(orderStatusFromNumber(1)).toBe('pending');
    expect(orderStatusFromNumber(2)).toBe('confirmed');
    expect(orderStatusFromNumber(3)).toBe('processing');
    expect(orderStatusFromNumber(4)).toBe('shipping');
    expect(orderStatusFromNumber(5)).toBe('delivered');
    expect(orderStatusFromNumber(6)).toBe('cancelled');
    expect(orderStatusFromNumber(7)).toBe('returned');
  });

  it('returns undefined for unknown number', () => {
    expect(orderStatusFromNumber(0)).toBeUndefined();
    expect(orderStatusFromNumber(99)).toBeUndefined();
  });
});

describe('orderStatusToNumber', () => {
  it('converts string status to number', () => {
    expect(orderStatusToNumber('pending')).toBe(1);
    expect(orderStatusToNumber('confirmed')).toBe(2);
    expect(orderStatusToNumber('processing')).toBe(3);
    expect(orderStatusToNumber('shipping')).toBe(4);
    expect(orderStatusToNumber('delivered')).toBe(5);
    expect(orderStatusToNumber('cancelled')).toBe(6);
    expect(orderStatusToNumber('returned')).toBe(7);
  });

  it('returns 0 (all) for unknown string', () => {
    expect(orderStatusToNumber('unknown')).toBe(0);
    expect(orderStatusToNumber('')).toBe(0);
  });
});
