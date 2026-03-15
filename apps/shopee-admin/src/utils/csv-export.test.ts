import { exportToCSV } from './csv-export';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock i18n
vi.mock('src/i18n/i18n', () => ({
  default: { t: (key: string) => key },
}));

describe('exportToCSV', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let capturedCsvContent: string;
  const OriginalBlob = globalThis.Blob;

  beforeEach(() => {
    capturedCsvContent = '';
    // Replace Blob with a wrapper that captures content
    vi.stubGlobal('Blob', class extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (parts && parts.length > 0) {
          capturedCsvContent = String(parts[0]);
        }
      }
    });
    createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURLSpy, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURLSpy, writable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockLink() {
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_: string) {},
      set download(_: string) {},
      click: clickSpy,
    } as unknown as HTMLElement);
    return clickSpy;
  }

  it('shows error toast for empty data', async () => {
    const { toast } = await import('sonner');
    exportToCSV([], [{ key: 'name', header: 'Name' }], 'test');
    expect(toast.error).toHaveBeenCalled();
  });

  it('escapes commas in values by wrapping in double quotes', () => {
    mockLink();
    exportToCSV([{ name: 'Hello, World' }], [{ key: 'name' as const, header: 'Name' }], 'test');
    expect(capturedCsvContent).toContain('"Hello, World"');
  });

  it('escapes quotes in values by doubling them', () => {
    mockLink();
    exportToCSV([{ name: 'Say "hello"' }], [{ key: 'name' as const, header: 'Name' }], 'test');
    expect(capturedCsvContent).toContain('"Say ""hello"""');
  });

  it('uses column accessor when provided', () => {
    mockLink();
    const columns = [{ key: 'price' as const, header: 'Price', accessor: (row: { price: number }) => `$${row.price}` }];
    exportToCSV([{ price: 1000 }], columns, 'test');
    expect(capturedCsvContent).toContain('$1000');
  });

  it('generates blob with correct type', () => {
    mockLink();
    exportToCSV([{ name: 'Test' }], [{ key: 'name' as const, header: 'Name' }], 'test');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });
});
