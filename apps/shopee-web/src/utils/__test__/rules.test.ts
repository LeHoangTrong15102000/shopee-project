import { describe, it, expect, vi } from 'vitest';
import {
  loginSchema,
  registerSchema,
  baseUserSchema,
  inputNumberSchema,
  baseSchema,
  getRules,
  userSchema,
  schema,
} from '../rules';

describe('loginSchema', () => {
  it('passes with valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('fails with empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('fails with invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('fails with short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '12345' });
    expect(result.success).toBe(false);
  });

  it('fails with empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('passes with valid data and matching passwords', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('fails with mismatched passwords', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '654321',
    });
    expect(result.success).toBe(false);
  });

  it('fails with empty confirm_password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('baseUserSchema', () => {
  it('passes with valid optional fields', () => {
    const result = baseUserSchema.safeParse({
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      address: 'Quận 1, HCM',
    });
    expect(result.success).toBe(true);
  });

  it('passes with empty object (all optional)', () => {
    const result = baseUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('fails with name exceeding 160 chars', () => {
    const result = baseUserSchema.safeParse({ name: 'a'.repeat(161) });
    expect(result.success).toBe(false);
  });

  it('fails with phone exceeding 20 chars', () => {
    const result = baseUserSchema.safeParse({ phone: '0'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('fails with future date_of_birth', () => {
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const result = baseUserSchema.safeParse({ date_of_birth: futureDate });
    expect(result.success).toBe(false);
  });
});

describe('inputNumberSchema (priceSchema)', () => {
  it('fails when price_max < price_min', () => {
    const result = inputNumberSchema.safeParse({ price_min: '100', price_max: '50' });
    expect(result.success).toBe(false);
  });

  it('passes when price_min < price_max', () => {
    const result = inputNumberSchema.safeParse({ price_min: '50', price_max: '100' });
    expect(result.success).toBe(true);
  });

  it('fails when both are empty', () => {
    const result = inputNumberSchema.safeParse({ price_min: '', price_max: '' });
    expect(result.success).toBe(false);
  });
});

describe('baseSchema', () => {
  it('validates email field', () => {
    const emailOnly = baseSchema.pick({ email: true });
    expect(emailOnly.safeParse({ email: 'valid@email.com' }).success).toBe(true);
    expect(emailOnly.safeParse({ email: 'invalid' }).success).toBe(false);
  });

  it('validates password field', () => {
    const pwOnly = baseSchema.pick({ password: true });
    expect(pwOnly.safeParse({ password: '123456' }).success).toBe(true);
    expect(pwOnly.safeParse({ password: '12345' }).success).toBe(false);
  });

  it('validates name field', () => {
    const nameOnly = baseSchema.pick({ name: true });
    expect(nameOnly.safeParse({ name: 'Product Name' }).success).toBe(true);
    expect(nameOnly.safeParse({ name: '' }).success).toBe(false);
    expect(nameOnly.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('validates optional price fields', () => {
    const priceOnly = baseSchema.pick({ price_min: true, price_max: true });
    expect(priceOnly.safeParse({ price_min: '100' }).success).toBe(true);
    expect(priceOnly.safeParse({}).success).toBe(true);
  });
});

describe('getRules', () => {
  it('returns email validation rules', () => {
    const rules = getRules();
    expect(rules.email).toBeDefined();
    expect(rules.email?.required).toBeDefined();
    expect(rules.email?.pattern).toBeDefined();
    expect(rules.email?.maxLength?.value).toBe(160);
    expect(rules.email?.minLength?.value).toBe(5);
  });

  it('returns password validation rules', () => {
    const rules = getRules();
    expect(rules.password).toBeDefined();
    expect(rules.password?.required).toBeDefined();
    expect(rules.password?.maxLength?.value).toBe(160);
    expect(rules.password?.minLength?.value).toBe(6);
  });

  it('returns confirm_password validation rules without getValues', () => {
    const rules = getRules();
    expect(rules.confirm_password).toBeDefined();
    expect(rules.confirm_password?.required).toBeDefined();
    expect(rules.confirm_password?.validate).toBeUndefined();
  });

  it('returns confirm_password validation rules with getValues', () => {
    const mockGetValues = vi.fn((field: string) => {
      if (field === 'password') return '123456';
      return '';
    });
    const rules = getRules(mockGetValues);
    expect(rules.confirm_password?.validate).toBeDefined();
  });

  it('validates confirm_password matches password', () => {
    const mockGetValues = vi.fn((field: string) => {
      if (field === 'password') return '123456';
      return '';
    });
    const rules = getRules(mockGetValues);
    const validateFn = rules.confirm_password?.validate as (value: string) => boolean | string;
    expect(validateFn('123456')).toBe(true);
    expect(validateFn('654321')).not.toBe(true);
  });
});

describe('schema (full schema with refinements)', () => {
  it('validates confirm_password matches password', () => {
    const result = schema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '123456',
      price_min: '100',
      price_max: '200',
      name: 'Product',
    });
    expect(result.success).toBe(true);
  });

  it('fails when confirm_password does not match', () => {
    const result = schema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '654321',
      name: 'Product',
    });
    expect(result.success).toBe(false);
  });

  it('validates price_min and price_max', () => {
    const result = schema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '123456',
      price_min: '200',
      price_max: '100',
      name: 'Product',
    });
    expect(result.success).toBe(false);
  });

  it('fails when both prices are empty', () => {
    const result = schema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '123456',
      price_min: '',
      price_max: '',
      name: 'Product',
    });
    expect(result.success).toBe(false);
  });
});

describe('userSchema', () => {
  it('validates new_password matches confirm_password', () => {
    const result = userSchema.safeParse({
      name: 'John Doe',
      new_password: '123456',
      confirm_password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('fails when new_password does not match confirm_password', () => {
    const result = userSchema.safeParse({
      name: 'John Doe',
      new_password: '123456',
      confirm_password: '654321',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty passwords', () => {
    const result = userSchema.safeParse({
      name: 'John Doe',
      password: '',
      new_password: '',
      confirm_password: '',
    });
    expect(result.success).toBe(true);
  });

  it('validates avatar max length', () => {
    const result = userSchema.safeParse({
      avatar: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('validates address max length', () => {
    const result = userSchema.safeParse({
      address: 'a'.repeat(161),
    });
    expect(result.success).toBe(false);
  });
});

describe('inputNumberSchema - additional tests', () => {
  it('passes when only price_min is provided', () => {
    const result = inputNumberSchema.safeParse({ price_min: '100', price_max: '' });
    expect(result.success).toBe(true);
  });

  it('passes when only price_max is provided', () => {
    const result = inputNumberSchema.safeParse({ price_min: '', price_max: '200' });
    expect(result.success).toBe(true);
  });

  it('passes when prices are equal', () => {
    const result = inputNumberSchema.safeParse({ price_min: '100', price_max: '100' });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema - additional tests', () => {
  it('fails with email too short', () => {
    const result = loginSchema.safeParse({ email: 'a@b.c', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('fails with email too long', () => {
    const result = loginSchema.safeParse({
      email: 'a'.repeat(160) + '@test.com',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('fails with password too long', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'a'.repeat(161) });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema - additional tests', () => {
  it('fails with short confirm_password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '12345',
    });
    expect(result.success).toBe(false);
  });
});
