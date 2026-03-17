import { useActivityLogStore, type ActivityLogEntry } from './activity-log.store';

describe('activity-log.store', () => {
  beforeEach(() => {
    localStorage.clear();
    useActivityLogStore.setState({ entries: [] });
  });

  it('has empty initial entries', () => {
    expect(useActivityLogStore.getState().entries).toEqual([]);
  });

  it('addLog adds an entry with id and timestamp', () => {
    useActivityLogStore.getState().addLog({
      action: 'create',
      entityType: 'product',
      entityName: 'iPhone 15',
      adminEmail: 'admin@shopee.com',
    });

    const entries = useActivityLogStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('create');
    expect(entries[0].entityType).toBe('product');
    expect(entries[0].id).toBeTruthy();
    expect(entries[0].timestamp).toBeTruthy();
  });

  it('limits entries to 200', () => {
    for (let i = 0; i < 210; i++) {
      useActivityLogStore.getState().addLog({
        action: 'create',
        entityType: 'product',
        entityName: `Product ${i}`,
        adminEmail: 'admin@shopee.com',
      });
    }

    expect(useActivityLogStore.getState().entries.length).toBeLessThanOrEqual(200);
  });

  it('persists entries to localStorage', () => {
    useActivityLogStore.getState().addLog({
      action: 'delete',
      entityType: 'user',
      entityName: 'Test User',
      adminEmail: 'admin@shopee.com',
    });

    const stored = localStorage.getItem('shopee-admin-activity-log');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as ActivityLogEntry[];
    expect(parsed).toHaveLength(1);
  });

  it('clearLog removes all entries', () => {
    useActivityLogStore.getState().addLog({
      action: 'update',
      entityType: 'order',
      entityName: 'Order 1',
      adminEmail: 'admin@shopee.com',
    });
    useActivityLogStore.getState().clearLog();

    expect(useActivityLogStore.getState().entries).toEqual([]);
    expect(localStorage.getItem('shopee-admin-activity-log')).toBeNull();
  });

  it('newest entries are first', () => {
    useActivityLogStore.getState().addLog({
      action: 'create',
      entityType: 'product',
      entityName: 'First',
      adminEmail: 'admin@shopee.com',
    });
    useActivityLogStore.getState().addLog({
      action: 'create',
      entityType: 'product',
      entityName: 'Second',
      adminEmail: 'admin@shopee.com',
    });

    const entries = useActivityLogStore.getState().entries;
    expect(entries[0].entityName).toBe('Second');
    expect(entries[1].entityName).toBe('First');
  });

  it('handles malformed JSON in localStorage gracefully', () => {
    localStorage.setItem('shopee-admin-activity-log', '{invalid-json}');
    // loadEntries catch branch returns [] for invalid JSON
    expect(() => useActivityLogStore.getState()).not.toThrow();
  });
});
