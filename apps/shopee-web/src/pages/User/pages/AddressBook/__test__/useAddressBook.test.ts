import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAddressBook } from '../useAddressBook';
import { toast } from 'react-toastify';
import addressApi from 'src/apis/address.api';
import { Address } from 'src/types/checkout.type';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('src/apis/address.api', () => ({
  default: {
    getAddresses: vi.fn(),
    deleteAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
  },
}));

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    useSensor: vi.fn((sensor) => sensor),
    useSensors: vi.fn((...sensors) => sensors),
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    closestCenter: vi.fn((args) => []),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const mockAddress1: Address = {
  _id: 'addr1',
  userId: 'user1',
  fullName: 'John Doe',
  phone: '0123456789',
  street: '123 Main St',
  district: 'District 1',
  province: 'Ho Chi Minh',
  provinceId: 'hcm',
  districtId: 'dist1',
  ward: 'Ward 1',
  wardId: 'ward1',
  isDefault: true,
  addressType: 'home',
  label: '',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockAddress2: Address = {
  _id: 'addr2',
  userId: 'user1',
  fullName: 'Jane Smith',
  phone: '0987654321',
  street: '456 Oak Ave',
  district: 'District 2',
  province: 'Hanoi',
  provinceId: 'hn',
  districtId: 'dist2',
  ward: 'Ward 2',
  wardId: 'ward2',
  isDefault: false,
  addressType: 'office',
  label: 'Office',
  createdAt: '2024-01-02',
  updatedAt: '2024-01-02',
};

const mockAddress3: Address = {
  _id: 'addr3',
  userId: 'user1',
  fullName: 'Bob Johnson',
  phone: '0111222333',
  street: '789 Pine Rd',
  district: 'District 3',
  province: 'Da Nang',
  provinceId: 'dn',
  districtId: 'dist3',
  ward: 'Ward 3',
  wardId: 'ward3',
  isDefault: false,
  addressType: 'other',
  label: 'Other',
  createdAt: '2024-01-03',
  updatedAt: '2024-01-03',
};

describe('useAddressBook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingAddress).toBeNull();
    expect(result.current.deletingAddressId).toBeNull();
    expect(result.current.searchQuery).toBe('');
    expect(result.current.filterType).toBe('all');
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.showBulkDeleteConfirm).toBe(false);
    expect(result.current.activeId).toBeNull();
  });

  it('should fetch and display addresses', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.rawAddresses).toHaveLength(2);
      expect(result.current.filteredAddresses).toHaveLength(2);
    });
  });

  it('should separate default and other addresses', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.defaultAddress).toEqual(mockAddress1);
      expect(result.current.otherAddresses).toHaveLength(2);
      expect(result.current.otherAddresses).toContainEqual(mockAddress2);
      expect(result.current.otherAddresses).toContainEqual(mockAddress3);
    });
  });

  it('should filter addresses by search query - name', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.setSearchQuery('bob');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
      expect(result.current.filteredAddresses[0]._id).toBe('addr3');
    });
  });

  it('should filter addresses by search query - phone', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.setSearchQuery('0987654321');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
      expect(result.current.filteredAddresses[0]._id).toBe('addr2');
    });
  });

  it('should filter addresses by search query - street', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.setSearchQuery('oak');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
      expect(result.current.filteredAddresses[0]._id).toBe('addr2');
    });
  });

  it('should filter addresses by type', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.setFilterType('office');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
      expect(result.current.filteredAddresses[0]._id).toBe('addr2');
    });
  });

  it('should filter addresses by type - default to home', async () => {
    const addressWithoutType = { ...mockAddress1, addressType: undefined };
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [addressWithoutType as any] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
    });

    act(() => {
      result.current.setFilterType('home');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
    });
  });

  it('should combine search and type filters', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.setSearchQuery('jane');
      result.current.setFilterType('office');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
      expect(result.current.filteredAddresses[0]._id).toBe('addr2');
    });
  });

  it('should calculate address counts by type', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.addressCounts).toEqual({
        all: 3,
        home: 1,
        office: 1,
        other: 1,
      });
    });
  });

  it('should handle add new address', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleAddNew();
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.editingAddress).toBeNull();
  });

  it('should handle edit address', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleEdit(mockAddress1);
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.editingAddress).toEqual(mockAddress1);
  });

  it('should handle form close', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleEdit(mockAddress1);
    });

    act(() => {
      result.current.handleFormClose();
    });

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingAddress).toBeNull();
  });

  it('should handle form success for new address', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleAddNew();
    });

    act(() => {
      result.current.handleFormSuccess();
    });

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingAddress).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Thêm địa chỉ thành công', {
      autoClose: 1000,
      position: 'top-center',
    });
  });

  it('should handle form success for editing address', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleEdit(mockAddress1);
    });

    act(() => {
      result.current.handleFormSuccess();
    });

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingAddress).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Cập nhật địa chỉ thành công', {
      autoClose: 1000,
      position: 'top-center',
    });
  });

  it('should handle delete address', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleDelete('addr1');
    });

    expect(result.current.deletingAddressId).toBe('addr1');
  });

  it('should confirm delete address', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1] } },
    } as any);
    vi.mocked(addressApi.deleteAddress).mockResolvedValue({ data: { success: true } } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleDelete('addr1');
    });

    act(() => {
      result.current.confirmDelete();
    });

    await waitFor(() => {
      expect(addressApi.deleteAddress).toHaveBeenCalledWith('addr1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Xóa địa chỉ thành công', {
        autoClose: 1000,
        position: 'top-center',
      });
      expect(result.current.deletingAddressId).toBeNull();
    });
  });

  it('should not delete if deletingAddressId is null', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.confirmDelete();
    });

    expect(addressApi.deleteAddress).not.toHaveBeenCalled();
  });

  it('should handle set default address', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);
    vi.mocked(addressApi.setDefaultAddress).mockResolvedValue({ data: { success: true } } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleSetDefault('addr2');
    });

    await waitFor(() => {
      expect(addressApi.setDefaultAddress).toHaveBeenCalledWith('addr2');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Đặt địa chỉ mặc định thành công', {
        autoClose: 1000,
        position: 'top-center',
      });
    });
  });

  it('should toggle selection mode', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(true);

    act(() => {
      result.current.toggleSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(false);
  });

  it('should toggle select individual address', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.handleToggleSelect('addr1');
    });

    expect(result.current.selectedIds.has('addr1')).toBe(true);

    act(() => {
      result.current.handleToggleSelect('addr1');
    });

    expect(result.current.selectedIds.has('addr1')).toBe(false);
  });

  it('should select all non-default addresses', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.selectedIds.has('addr2')).toBe(true);
    expect(result.current.selectedIds.has('addr3')).toBe(true);
    expect(result.current.selectedIds.has('addr1')).toBe(false);
  });

  it('should deselect all when all are selected', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedIds.size).toBe(2);

    act(() => {
      result.current.handleSelectAll();
    });

    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should handle bulk delete', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleBulkDelete();
    });

    expect(result.current.showBulkDeleteConfirm).toBe(true);
  });

  it('should confirm bulk delete', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);
    vi.mocked(addressApi.deleteAddress).mockResolvedValue({ data: { success: true } } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.handleToggleSelect('addr2');
      result.current.handleToggleSelect('addr3');
    });

    act(() => {
      result.current.confirmBulkDelete();
    });

    await waitFor(() => {
      expect(addressApi.deleteAddress).toHaveBeenCalledWith('addr2');
      expect(addressApi.deleteAddress).toHaveBeenCalledWith('addr3');
    });

    await waitFor(() => {
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.isSelectionMode).toBe(false);
      expect(result.current.showBulkDeleteConfirm).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Đã xóa 2 địa chỉ', {
        autoClose: 1000,
        position: 'top-center',
      });
    });
  });

  it('should handle drag start', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.handleDragStart({ active: { id: 'addr2' } } as any);
    });

    expect(result.current.activeId).toBe('addr2');
    expect(result.current.activeAddress).toEqual(mockAddress2);
  });

  it('should handle drag cancel', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.handleDragStart({ active: { id: 'addr1' } } as any);
    });

    act(() => {
      result.current.handleDragCancel();
    });

    expect(result.current.activeId).toBeNull();
  });

  it('should handle drag end and swap addresses', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.otherAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'addr2' },
        over: { id: 'addr3' },
      } as any);
    });

    expect(result.current.activeId).toBeNull();
  });

  it('should not swap if over is null', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.otherAddresses).toHaveLength(1);
    });

    const initialOrder = result.current.otherAddresses;

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'addr2' },
        over: null,
      } as any);
    });

    expect(result.current.otherAddresses).toEqual(initialOrder);
  });

  it('should not swap if active and over are the same', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.otherAddresses).toHaveLength(1);
    });

    const initialOrder = result.current.otherAddresses;

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'addr2' },
        over: { id: 'addr2' },
      } as any);
    });

    expect(result.current.otherAddresses).toEqual(initialOrder);
  });

  it('should handle collision detection', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.otherAddresses).toHaveLength(2);
    });

    const collisions = result.current.swapOnlyCollision({} as any);
    expect(Array.isArray(collisions)).toBe(true);
  });

  it('should update ordered addresses when new address is added', async () => {
    vi.mocked(addressApi.getAddresses)
      .mockResolvedValueOnce({
        data: { data: { addresses: [mockAddress1] } },
      } as any)
      .mockResolvedValueOnce({
        data: { data: { addresses: [mockAddress1, mockAddress2] } },
      } as any);

    const { result, rerender } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.rawAddresses).toHaveLength(1);
    });

    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    act(() => {
      result.current.handleFormSuccess();
    });

    await waitFor(() => {
      expect(result.current.rawAddresses).toHaveLength(2);
    });
  });

  it('should handle empty search query', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.setSearchQuery('   ');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });
  });

  it('should filter by district', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.setSearchQuery('district 2');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
      expect(result.current.filteredAddresses[0]._id).toBe('addr2');
    });
  });

  it('should filter by province', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.setSearchQuery('da nang');
    });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(1);
      expect(result.current.filteredAddresses[0]._id).toBe('addr3');
    });
  });

  it('should handle drag end with invalid indices', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.otherAddresses).toHaveLength(1);
    });

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'invalid-id' },
        over: { id: 'addr2' },
      } as any);
    });

    expect(result.current.activeId).toBeNull();
  });

  it('should maintain ordered addresses when addresses are removed', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.rawAddresses).toHaveLength(3);
    });

    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);
    vi.mocked(addressApi.deleteAddress).mockResolvedValue({ data: { success: true } } as any);

    act(() => {
      result.current.handleDelete('addr3');
    });

    act(() => {
      result.current.confirmDelete();
    });

    await waitFor(() => {
      expect(result.current.rawAddresses).toHaveLength(2);
    });
  });

  it('should use rawAddresses when orderedAddresses is empty', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });
  });

  it('should handle setDeletingAddressId', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.setDeletingAddressId('addr1');
    });

    expect(result.current.deletingAddressId).toBe('addr1');

    act(() => {
      result.current.setDeletingAddressId(null);
    });

    expect(result.current.deletingAddressId).toBeNull();
  });

  it('should handle setShowBulkDeleteConfirm', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    act(() => {
      result.current.setShowBulkDeleteConfirm(true);
    });

    expect(result.current.showBulkDeleteConfirm).toBe(true);

    act(() => {
      result.current.setShowBulkDeleteConfirm(false);
    });

    expect(result.current.showBulkDeleteConfirm).toBe(false);
  });

  it('should clear selectedIds when toggling selection mode', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.handleToggleSelect('addr2');
    });

    expect(result.current.selectedIds.size).toBe(1);

    act(() => {
      result.current.toggleSelectionMode();
    });

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.isSelectionMode).toBe(true);
  });

  it('should handle activeAddress when activeId is null', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    expect(result.current.activeAddress).toBeNull();
  });

  it('should count addresses with undefined addressType as home', async () => {
    const addressWithoutType = { ...mockAddress1, addressType: undefined };
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [addressWithoutType as any, mockAddress2] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.addressCounts).toEqual({
        all: 2,
        home: 1,
        office: 1,
        other: 0,
      });
    });
  });

  it('should handle collision detection with valid address IDs', async () => {
    const { closestCenter } = await import('@dnd-kit/core');
    vi.mocked(closestCenter).mockReturnValue([
      { id: 'addr2', data: {} },
      { id: 'addr3', data: {} },
      { id: 'invalid-id', data: {} },
    ] as any);

    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.otherAddresses).toHaveLength(2);
    });

    const collisions = result.current.swapOnlyCollision({} as any);
    expect(collisions).toHaveLength(2);
    expect(collisions.some((c) => c.id === 'addr2')).toBe(true);
    expect(collisions.some((c) => c.id === 'addr3')).toBe(true);
    expect(collisions.some((c) => c.id === 'invalid-id')).toBe(false);
  });

  it('should handle drag end with default address present', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.defaultAddress).toEqual(mockAddress1);
      expect(result.current.otherAddresses).toHaveLength(2);
    });

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'addr2' },
        over: { id: 'addr3' },
      } as any);
    });

    expect(result.current.activeId).toBeNull();
  });

  it('should handle drag end without default address', async () => {
    const nonDefaultAddr1 = { ...mockAddress1, isDefault: false };
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [nonDefaultAddr1, mockAddress2, mockAddress3] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.defaultAddress).toBeUndefined();
      expect(result.current.otherAddresses).toHaveLength(3);
    });

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'addr1' },
        over: { id: 'addr2' },
      } as any);
    });

    expect(result.current.activeId).toBeNull();
  });

  it('should return sensors from useSensors', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    expect(result.current.sensors).toBeDefined();
  });

  it('should return deleteMutation', () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    expect(result.current.deleteMutation).toBeDefined();
  });

  it('should handle loading state', () => {
    vi.mocked(addressApi.getAddresses).mockImplementation(() => new Promise(() => {}) as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle multiple address additions in ordered list', async () => {
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1] } },
    } as any);

    const { result } = renderHook(() => useAddressBook(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.rawAddresses).toHaveLength(1);
    });

    const newAddress = { ...mockAddress2, _id: 'addr4' };
    vi.mocked(addressApi.getAddresses).mockResolvedValue({
      data: { data: { addresses: [mockAddress1, newAddress] } },
    } as any);

    act(() => {
      result.current.handleFormSuccess();
    });

    await waitFor(() => {
      expect(result.current.rawAddresses).toHaveLength(2);
    });
  });
});
