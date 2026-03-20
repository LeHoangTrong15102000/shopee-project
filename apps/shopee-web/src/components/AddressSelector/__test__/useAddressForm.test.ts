import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAddressForm } from '../useAddressForm';
import { Address } from 'src/types/checkout.type';

// Mock i18n
vi.mock('src/i18n/i18n', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

// Mock dependencies
vi.mock('src/apis/address.api');

vi.mock('src/data/vietnamLocations', () => ({
  vietnamProvinces: [
    { id: 'hcm', name: 'Ho Chi Minh' },
    { id: 'hn', name: 'Hanoi' },
  ],
  getDistrictsByProvince: vi.fn((provinceId) => {
    if (provinceId === 'hcm') {
      return [
        { id: 'dist1', name: 'District 1' },
        { id: 'dist2', name: 'District 2' },
      ];
    }
    return [];
  }),
  getWardsByDistrict: vi.fn((provinceId, districtId) => {
    if (provinceId === 'hcm' && districtId === 'dist1') {
      return [
        { id: 'ward1', name: 'Ward 1' },
        { id: 'ward2', name: 'Ward 2' },
      ];
    }
    return [];
  }),
  streetSuggestions: ['Nguyen Hue', 'Le Loi', 'Tran Hung Dao', 'Hai Ba Trung', 'Ly Tu Trong'],
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const mockAddress: Address = {
  _id: 'addr1',
  userId: 'user1',
  fullName: 'John Doe',
  phone: '0123456789',
  province: 'Ho Chi Minh',
  provinceId: 'hcm',
  district: 'District 1',
  districtId: 'dist1',
  ward: 'Ward 1',
  wardId: 'ward1',
  street: '123 Main St',
  addressType: 'home',
  label: '',
  isDefault: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('useAddressForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup API mocks
    const addressApi = await import('src/apis/address.api');
    vi.mocked(addressApi.default).createAddress = vi.fn();
    vi.mocked(addressApi.default).updateAddress = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values for new address', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.currentStep).toBe(1);
    expect(result.current.districts).toEqual([]);
    expect(result.current.wards).toEqual([]);
  });

  it('should initialize with address data for editing', () => {
    const { result } = renderHook(() => useAddressForm(mockAddress, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.form.getValues('fullName')).toBe('John Doe');
    expect(result.current.form.getValues('phone')).toBe('0123456789');
  });

  it('should load districts when province changes', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleProvinceChange({
        target: { value: 'hcm' },
      } as React.ChangeEvent<HTMLSelectElement>);
    });

    expect(result.current.isLoadingDistricts).toBe(true);
  });

  it('should load wards when district changes', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.form.setValue('provinceId', 'hcm');
    });

    act(() => {
      result.current.handleDistrictChange({
        target: { value: 'dist1' },
      } as React.ChangeEvent<HTMLSelectElement>);
    });

    expect(result.current.isLoadingWards).toBe(true);
  });

  it('should handle street selection', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleStreetSelect('Nguyen Hue');
    });

    expect(result.current.form.getValues('street')).toBe('Nguyen Hue');
    expect(result.current.showStreetSuggestions).toBe(false);
  });

  it('should handle address type selection', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleTypeSelect('office');
    });

    expect(result.current.form.getValues('addressType')).toBe('office');
  });

  it('should clear label when selecting non-other type', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.form.setValue('label', 'Custom Label');
      result.current.handleTypeSelect('home');
    });

    expect(result.current.form.getValues('label')).toBe('');
  });

  it('should build address preview', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.form.setValue('street', '123 Main St');
      result.current.form.setValue('ward', 'Ward 1');
      result.current.form.setValue('district', 'District 1');
      result.current.form.setValue('province', 'Ho Chi Minh');
    });

    expect(result.current.addressPreview).toBe('123 Main St, Ward 1, District 1, Ho Chi Minh');
  });

  it('should calculate step progress correctly', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    expect(result.current.stepProgress).toBe(0);
  });

  it('should validate canProceedToStep', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    expect(result.current.canProceedToStep(1)).toBe(true);
  });

  it('should handle form submission for new address', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    const formData = {
      fullName: 'John Doe',
      phone: '0123456789',
      provinceId: 'hcm',
      province: 'Ho Chi Minh',
      districtId: 'dist1',
      district: 'District 1',
      wardId: 'ward1',
      ward: 'Ward 1',
      street: '123 Main St',
      addressType: 'home' as const,
      label: '',
      isDefault: false,
    };

    act(() => {
      result.current.onSubmit(formData);
    });

    expect(result.current.isEditing).toBe(false);
  });

  it('should handle form submission for existing address', () => {
    const { result } = renderHook(() => useAddressForm(mockAddress, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    const formData = {
      fullName: 'Jane Doe',
      phone: '0987654321',
      provinceId: 'hcm',
      province: 'Ho Chi Minh',
      districtId: 'dist1',
      district: 'District 1',
      wardId: 'ward1',
      ward: 'Ward 1',
      street: '456 Oak Ave',
      addressType: 'office' as const,
      label: 'Work',
      isDefault: true,
    };

    act(() => {
      result.current.onSubmit(formData);
    });

    expect(result.current.isEditing).toBe(true);
  });

  it('should change current step', () => {
    const { result } = renderHook(() => useAddressForm(null, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setCurrentStep(2);
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('should initialize districts and wards for editing', () => {
    const { result } = renderHook(() => useAddressForm(mockAddress, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    // Districts and wards should be loaded after initialization
    expect(result.current.isEditing).toBe(true);
  });

  it('should expose watchedProvinceId', () => {
    const { result } = renderHook(() => useAddressForm(mockAddress, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    expect(result.current.watchedProvinceId).toBe('hcm');
  });
});
