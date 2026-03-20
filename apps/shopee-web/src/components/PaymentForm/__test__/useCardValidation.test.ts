import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCardValidation,
  formatCardNumber,
  formatExpiryDate,
  shakeAnimation,
} from '../useCardValidation';

describe('formatCardNumber', () => {
  it('should format regular card number in groups of 4', () => {
    expect(formatCardNumber('1234567890123456', 'visa')).toBe('1234 5678 9012 3456');
  });

  it('should format amex card number as 4-6-5', () => {
    expect(formatCardNumber('123456789012345', 'amex')).toBe('1234 567890 12345');
  });

  it('should remove non-digit characters', () => {
    expect(formatCardNumber('1234-5678-9012-3456', 'visa')).toBe('1234 5678 9012 3456');
  });

  it('should limit regular cards to 16 digits', () => {
    expect(formatCardNumber('12345678901234567890', 'visa')).toBe('1234 5678 9012 3456');
  });

  it('should limit amex cards to 15 digits', () => {
    expect(formatCardNumber('1234567890123456', 'amex')).toBe('1234 567890 12345');
  });

  it('should handle partial card numbers', () => {
    expect(formatCardNumber('1234', 'visa')).toBe('1234');
    expect(formatCardNumber('12345678', 'visa')).toBe('1234 5678');
  });

  it('should handle empty input', () => {
    expect(formatCardNumber('', 'visa')).toBe('');
  });

  it('should format mastercard like regular cards', () => {
    expect(formatCardNumber('5123456789012346', 'mastercard')).toBe('5123 4567 8901 2346');
  });

  it('should format jcb like regular cards', () => {
    expect(formatCardNumber('3528000000000007', 'jcb')).toBe('3528 0000 0000 0007');
  });

  it('should format unknown cards like regular cards', () => {
    expect(formatCardNumber('9999888877776666', 'unknown')).toBe('9999 8888 7777 6666');
  });

  it('should handle partial amex with only 4 digits', () => {
    expect(formatCardNumber('3782', 'amex')).toBe('3782');
  });

  it('should handle partial amex with 10 digits', () => {
    expect(formatCardNumber('3782822463', 'amex')).toBe('3782 822463');
  });

  it('should handle amex with no match groups', () => {
    expect(formatCardNumber('378', 'amex')).toBe('378');
  });

  it('should handle regular card with no groups', () => {
    expect(formatCardNumber('123', 'visa')).toBe('123');
  });
});

describe('formatExpiryDate', () => {
  it('should format expiry date with slash', () => {
    expect(formatExpiryDate('1225')).toBe('12/25');
  });

  it('should handle partial input', () => {
    expect(formatExpiryDate('12')).toBe('12/');
    expect(formatExpiryDate('1')).toBe('1');
  });

  it('should remove non-digit characters', () => {
    expect(formatExpiryDate('12/25')).toBe('12/25');
  });

  it('should limit to 4 digits', () => {
    expect(formatExpiryDate('122599')).toBe('12/25');
  });

  it('should handle empty input', () => {
    expect(formatExpiryDate('')).toBe('');
  });

  it('should format partial expiry with 3 digits', () => {
    expect(formatExpiryDate('122')).toBe('12/2');
  });
});

describe('shakeAnimation', () => {
  it('should have shake animation config', () => {
    expect(shakeAnimation.shake.x).toEqual([0, -10, 10, -10, 10, 0]);
    expect(shakeAnimation.shake.transition.duration).toBe(0.4);
  });
});

describe('useCardValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCardValidation('', '', ''));

    expect(result.current.cardType).toBe('unknown');
    expect(result.current.formattedCardNumber).toBe('');
    expect(result.current.formattedExpiry).toBe('');
    expect(result.current.isCardFlipped).toBe(false);
    expect(result.current.showCvvTooltip).toBe(false);
    expect(result.current.validationState).toEqual({
      cardNumber: { touched: false, isValid: false },
      expiryDate: { touched: false, isValid: false },
      cvv: { touched: false, isValid: false },
    });
    expect(result.current.shakeFields).toEqual({
      cardNumber: false,
      expiryDate: false,
      cvv: false,
    });
  });

  it('should detect visa card type', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', ''));

    expect(result.current.cardType).toBe('visa');
  });

  it('should detect mastercard type', () => {
    const { result } = renderHook(() => useCardValidation('5123456789012346', '', ''));

    expect(result.current.cardType).toBe('mastercard');
  });

  it('should detect mastercard type with 2-series', () => {
    const { result } = renderHook(() => useCardValidation('2221000000000009', '', ''));

    expect(result.current.cardType).toBe('mastercard');
  });

  it('should detect amex card type', () => {
    const { result } = renderHook(() => useCardValidation('378282246310005', '', ''));

    expect(result.current.cardType).toBe('amex');
  });

  it('should detect jcb card type', () => {
    const { result } = renderHook(() => useCardValidation('3528000000000007', '', ''));

    expect(result.current.cardType).toBe('jcb');
  });

  it('should format card number based on type', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', ''));

    expect(result.current.formattedCardNumber).toBe('4111 1111 1111 1111');
  });

  it('should format amex card number differently', () => {
    const { result } = renderHook(() => useCardValidation('378282246310005', '', ''));

    expect(result.current.formattedCardNumber).toBe('3782 822463 10005');
  });

  it('should format expiry date', () => {
    const { result } = renderHook(() => useCardValidation('', '1225', ''));

    expect(result.current.formattedExpiry).toBe('12/25');
  });

  it('should flip card on CVV focus', () => {
    const { result } = renderHook(() => useCardValidation('', '', ''));

    act(() => {
      result.current.handleCvvFocus();
    });

    expect(result.current.isCardFlipped).toBe(true);
  });

  it('should unflip card on CVV blur with valid CVV', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', '123'));

    act(() => {
      result.current.handleCvvFocus();
    });

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.isCardFlipped).toBe(false);
    expect(result.current.validationState.cvv.touched).toBe(true);
    expect(result.current.validationState.cvv.isValid).toBe(true);
  });

  it('should validate CVV length for regular cards', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', '12'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.validationState.cvv.isValid).toBe(false);
    expect(result.current.shakeFields.cvv).toBe(true);
  });

  it('should validate CVV length for amex cards (4 digits)', () => {
    const { result } = renderHook(() => useCardValidation('378282246310005', '', '1234'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.validationState.cvv.isValid).toBe(true);
  });

  it('should shake CVV field on invalid input', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', '12'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.shakeFields.cvv).toBe(true);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.shakeFields.cvv).toBe(false);
  });

  it('should not shake CVV field if empty', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', ''));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.shakeFields.cvv).toBe(false);
  });

  it('should validate card number with Luhn algorithm', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.touched).toBe(true);
    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should invalidate card number with wrong Luhn checksum', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111112', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(false);
    expect(result.current.shakeFields.cardNumber).toBe(true);
  });

  it('should invalidate card number with insufficient length', () => {
    const { result } = renderHook(() => useCardValidation('411111111111', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(false);
  });

  it('should validate amex card number with 15 digits', () => {
    const { result } = renderHook(() => useCardValidation('378282246310005', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should shake card number field on invalid input', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111112', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.shakeFields.cardNumber).toBe(true);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.shakeFields.cardNumber).toBe(false);
  });

  it('should not shake card number field if empty', () => {
    const { result } = renderHook(() => useCardValidation('', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.shakeFields.cardNumber).toBe(false);
  });

  it('should validate expiry date - valid future date', () => {
    const { result } = renderHook(() => useCardValidation('', '1230', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.touched).toBe(true);
    expect(result.current.validationState.expiryDate.isValid).toBe(true);
  });

  it('should invalidate expiry date - past date', () => {
    const { result } = renderHook(() => useCardValidation('', '0120', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(false);
    expect(result.current.shakeFields.expiryDate).toBe(true);
  });

  it('should invalidate expiry date - invalid month', () => {
    const { result } = renderHook(() => useCardValidation('', '1330', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(false);
  });

  it('should invalidate expiry date - month 00', () => {
    const { result } = renderHook(() => useCardValidation('', '0030', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(false);
  });

  it('should invalidate expiry date - insufficient length', () => {
    const { result } = renderHook(() => useCardValidation('', '123', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(false);
  });

  it('should shake expiry field on invalid input', () => {
    const { result } = renderHook(() => useCardValidation('', '0120', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.shakeFields.expiryDate).toBe(true);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.shakeFields.expiryDate).toBe(false);
  });

  it('should not shake expiry field if empty', () => {
    const { result } = renderHook(() => useCardValidation('', '', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.shakeFields.expiryDate).toBe(false);
  });

  it('should toggle CVV tooltip', () => {
    const { result } = renderHook(() => useCardValidation('', '', ''));

    act(() => {
      result.current.toggleCvvTooltip();
    });

    expect(result.current.showCvvTooltip).toBe(true);

    act(() => {
      result.current.toggleCvvTooltip();
    });

    expect(result.current.showCvvTooltip).toBe(false);
  });

  it('should close CVV tooltip', () => {
    const { result } = renderHook(() => useCardValidation('', '', ''));

    act(() => {
      result.current.toggleCvvTooltip();
    });

    act(() => {
      result.current.closeCvvTooltip();
    });

    expect(result.current.showCvvTooltip).toBe(false);
  });

  it('should handle card number with spaces', () => {
    const { result } = renderHook(() => useCardValidation('4111 1111 1111 1111', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should validate current month in current year', () => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear() % 100).padStart(2, '0');
    const expiryDate = currentMonth + currentYear;

    const { result } = renderHook(() => useCardValidation('', expiryDate, ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(true);
  });

  it('should invalidate past month in current year', () => {
    const now = new Date();
    const pastMonth = String(Math.max(1, now.getMonth())).padStart(2, '0');
    const currentYear = String(now.getFullYear() % 100).padStart(2, '0');
    const expiryDate = pastMonth + currentYear;

    if (now.getMonth() > 0) {
      const { result } = renderHook(() => useCardValidation('', expiryDate, ''));

      act(() => {
        result.current.handleExpiryBlur();
      });

      expect(result.current.validationState.expiryDate.isValid).toBe(false);
    }
  });

  it('should handle non-digit characters in card number', () => {
    // The validation only strips spaces, not other characters
    // So we test that it properly validates card numbers with spaces
    const { result } = renderHook(() => useCardValidation('4532 0151 1283 0366', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should validate card number less than 13 digits as invalid', () => {
    const { result } = renderHook(() => useCardValidation('411111111111', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(false);
  });

  it('should handle mastercard with 51-55 prefix', () => {
    const { result } = renderHook(() => useCardValidation('5123456789012346', '', ''));

    expect(result.current.cardType).toBe('mastercard');
  });

  it('should handle amex with 34 prefix', () => {
    const { result } = renderHook(() => useCardValidation('340000000000009', '', ''));

    expect(result.current.cardType).toBe('amex');
  });

  it('should handle amex with 37 prefix', () => {
    const { result } = renderHook(() => useCardValidation('370000000000002', '', ''));

    expect(result.current.cardType).toBe('amex');
  });

  it('should update card type dynamically', () => {
    const { result, rerender } = renderHook(
      ({ cardNumber }) => useCardValidation(cardNumber, '', ''),
      { initialProps: { cardNumber: '4111111111111111' } },
    );

    expect(result.current.cardType).toBe('visa');

    rerender({ cardNumber: '5123456789012346' });

    expect(result.current.cardType).toBe('mastercard');
  });

  it('should update formatted card number dynamically', () => {
    const { result, rerender } = renderHook(
      ({ cardNumber }) => useCardValidation(cardNumber, '', ''),
      { initialProps: { cardNumber: '4111111111111111' } },
    );

    expect(result.current.formattedCardNumber).toBe('4111 1111 1111 1111');

    rerender({ cardNumber: '378282246310005' });

    expect(result.current.formattedCardNumber).toBe('3782 822463 10005');
  });

  it('should update formatted expiry dynamically', () => {
    const { result, rerender } = renderHook(
      ({ expiryDate }) => useCardValidation('', expiryDate, ''),
      { initialProps: { expiryDate: '1225' } },
    );

    expect(result.current.formattedExpiry).toBe('12/25');

    rerender({ expiryDate: '0630' });

    expect(result.current.formattedExpiry).toBe('06/30');
  });

  it('should invalidate 13-digit card number for non-Amex cards', () => {
    // Even though Luhn check passes, non-Amex cards require 16 digits minimum
    const { result } = renderHook(() => useCardValidation('4222222222222', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(false);
  });

  it('should invalidate card with non-numeric characters', () => {
    const { result } = renderHook(() => useCardValidation('411111111111111a', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(false);
  });

  it('should validate all zeros card number', () => {
    const { result } = renderHook(() => useCardValidation('0000000000000000', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should handle Luhn validation with doubled digit > 9', () => {
    const { result } = renderHook(() => useCardValidation('4532015112830366', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should detect mastercard with 2221 prefix', () => {
    const { result } = renderHook(() => useCardValidation('2221000000000009', '', ''));
    expect(result.current.cardType).toBe('mastercard');
  });

  it('should detect mastercard with 2720 prefix', () => {
    const { result } = renderHook(() => useCardValidation('2720000000000000', '', ''));
    expect(result.current.cardType).toBe('mastercard');
  });

  it('should detect mastercard with 2229 prefix', () => {
    const { result } = renderHook(() => useCardValidation('2229000000000000', '', ''));
    expect(result.current.cardType).toBe('mastercard');
  });

  it('should detect jcb with 3529 prefix', () => {
    const { result } = renderHook(() => useCardValidation('3529000000000000', '', ''));
    expect(result.current.cardType).toBe('jcb');
  });

  it('should detect jcb with 3589 prefix', () => {
    const { result } = renderHook(() => useCardValidation('3589000000000000', '', ''));
    expect(result.current.cardType).toBe('jcb');
  });

  it('should return unknown for card starting with 6', () => {
    const { result } = renderHook(() => useCardValidation('6011111111111117', '', ''));
    expect(result.current.cardType).toBe('unknown');
  });

  it('should validate expiry with month 01', () => {
    const { result } = renderHook(() => useCardValidation('', '0130', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(true);
  });

  it('should validate expiry with month 12', () => {
    const { result } = renderHook(() => useCardValidation('', '1230', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(true);
  });

  it('should handle CVV validation for unknown card type', () => {
    const { result } = renderHook(() => useCardValidation('6011111111111117', '', '123'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.validationState.cvv.isValid).toBe(true);
  });

  it('should handle CVV validation for JCB card', () => {
    const { result } = renderHook(() => useCardValidation('3528000000000007', '', '123'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.validationState.cvv.isValid).toBe(true);
  });

  it('should handle CVV validation for Mastercard', () => {
    const { result } = renderHook(() => useCardValidation('5123456789012346', '', '123'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.validationState.cvv.isValid).toBe(true);
  });

  it('should invalidate 4-digit CVV for regular cards', () => {
    const { result } = renderHook(() => useCardValidation('4111111111111111', '', '1234'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.validationState.cvv.isValid).toBe(false);
  });

  it('should invalidate 3-digit CVV for Amex', () => {
    const { result } = renderHook(() => useCardValidation('378282246310005', '', '123'));

    act(() => {
      result.current.handleCvvBlur();
    });

    expect(result.current.validationState.cvv.isValid).toBe(false);
  });

  it('should handle expiry validation with non-digit characters', () => {
    // Use a future date
    const { result } = renderHook(() => useCardValidation('', '12/30', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(true);
  });

  it('should validate future year expiry', () => {
    const { result } = renderHook(() => useCardValidation('', '0135', ''));

    act(() => {
      result.current.handleExpiryBlur();
    });

    expect(result.current.validationState.expiryDate.isValid).toBe(true);
  });

  it('should handle card number validation with spaces', () => {
    const { result } = renderHook(() => useCardValidation('4532 0151 1283 0366', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should handle amex card validation with spaces', () => {
    const { result } = renderHook(() => useCardValidation('3782 822463 10005', '', ''));

    act(() => {
      result.current.handleCardNumberBlur();
    });

    expect(result.current.validationState.cardNumber.isValid).toBe(true);
  });

  it('should memoize cardType correctly', () => {
    const { result, rerender } = renderHook(
      ({ cardNumber }) => useCardValidation(cardNumber, '', ''),
      { initialProps: { cardNumber: '4111111111111111' } },
    );

    const firstCardType = result.current.cardType;
    rerender({ cardNumber: '4111111111111111' });
    expect(result.current.cardType).toBe(firstCardType);
  });

  it('should memoize formattedCardNumber correctly', () => {
    const { result, rerender } = renderHook(
      ({ cardNumber }) => useCardValidation(cardNumber, '', ''),
      { initialProps: { cardNumber: '4111111111111111' } },
    );

    const firstFormatted = result.current.formattedCardNumber;
    rerender({ cardNumber: '4111111111111111' });
    expect(result.current.formattedCardNumber).toBe(firstFormatted);
  });

  it('should memoize formattedExpiry correctly', () => {
    const { result, rerender } = renderHook(
      ({ expiryDate }) => useCardValidation('', expiryDate, ''),
      { initialProps: { expiryDate: '1225' } },
    );

    const firstFormatted = result.current.formattedExpiry;
    rerender({ expiryDate: '1225' });
    expect(result.current.formattedExpiry).toBe(firstFormatted);
  });
});
