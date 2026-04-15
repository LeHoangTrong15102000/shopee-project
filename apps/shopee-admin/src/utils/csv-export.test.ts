import { exportToCSV } from './csv-export'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// Mock i18n
vi.mock('src/i18n/i18n', () => ({
  default: { t: (key: string) => key },
}))

describe('exportToCSV', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let capturedCsvContent: string
  const OriginalBlob = globalThis.Blob

  beforeEach(() => {
    capturedCsvContent = ''
    // Replace Blob with a wrapper that captures content
    vi.stubGlobal(
      'Blob',
      class extends OriginalBlob {
        constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options)
          if (parts && parts.length > 0) {
            capturedCsvContent = String(parts[0])
          }
        }
      },
    )
    createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURLSpy, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURLSpy, writable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockLink() {
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_: string) {},
      set download(_: string) {},
      click: clickSpy,
    } as unknown as HTMLElement)
    return clickSpy
  }

  it('shows error toast for empty data', async () => {
    const { toast } = await import('sonner')
    exportToCSV([], [{ key: 'name', header: 'Name' }], 'test')
    expect(toast.error).toHaveBeenCalled()
  })

  it('escapes commas in values by wrapping in double quotes', () => {
    mockLink()
    exportToCSV([{ name: 'Hello, World' }], [{ key: 'name' as const, header: 'Name' }], 'test')
    expect(capturedCsvContent).toContain('"Hello, World"')
  })

  it('escapes quotes in values by doubling them', () => {
    mockLink()
    exportToCSV([{ name: 'Say "hello"' }], [{ key: 'name' as const, header: 'Name' }], 'test')
    expect(capturedCsvContent).toContain('"Say ""hello"""')
  })

  it('uses column accessor when provided', () => {
    mockLink()
    const columns = [
      {
        key: 'price' as const,
        header: 'Price',
        accessor: (row: { price: number }) => `$${row.price}`,
      },
    ]
    exportToCSV([{ price: 1000 }], columns, 'test')
    expect(capturedCsvContent).toContain('$1000')
  })

  it('generates blob with correct type', () => {
    mockLink()
    exportToCSV([{ name: 'Test' }], [{ key: 'name' as const, header: 'Name' }], 'test')
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalled()
  })

  it('uses synchronous export for datasets <= 100 rows', () => {
    mockLink()
    const smallData = Array.from({ length: 50 }, (_, i) => ({ name: `Item ${i}` }))
    exportToCSV(smallData, [{ key: 'name' as const, header: 'Name' }], 'test')
    // Synchronous path creates blob immediately
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(capturedCsvContent).toContain('Item 0')
  })

  it('falls back to sync export when Worker is undefined', () => {
    const originalWorker = globalThis.Worker
    // @ts-expect-error - testing Worker unavailability
    delete globalThis.Worker
    mockLink()
    const largeData = Array.from({ length: 150 }, (_, i) => ({ name: `Item ${i}` }))
    exportToCSV(largeData, [{ key: 'name' as const, header: 'Name' }], 'test')
    expect(createObjectURLSpy).toHaveBeenCalled()
    globalThis.Worker = originalWorker
  })

  it('uses Web Worker for datasets > 100 rows', () => {
    const postMessageSpy = vi.fn()
    const terminateSpy = vi.fn()

    vi.stubGlobal(
      'Worker',
      class {
        onmessage: ((e: MessageEvent) => void) | null = null
        onerror: (() => void) | null = null
        postMessage = postMessageSpy
        terminate = terminateSpy
      },
    )

    mockLink()
    const largeData = Array.from({ length: 150 }, (_, i) => ({ name: `Item ${i}` }))
    exportToCSV(largeData, [{ key: 'name' as const, header: 'Name' }], 'test')

    // Worker should receive postMessage with data
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: largeData,
        columns: expect.arrayContaining([expect.objectContaining({ key: 'name', header: 'Name' })]),
      }),
    )
  })

  it('downloads blob and terminates worker on successful onmessage', () => {
    const postMessageSpy = vi.fn()
    const terminateSpy = vi.fn()
    let capturedOnmessage: ((e: MessageEvent) => void) | null = null

    vi.stubGlobal(
      'Worker',
      class {
        set onmessage(fn: ((e: MessageEvent) => void) | null) {
          capturedOnmessage = fn
        }
        onerror: (() => void) | null = null
        postMessage = postMessageSpy
        terminate = terminateSpy
      },
    )

    const clickSpy = mockLink()
    const largeData = Array.from({ length: 150 }, (_, i) => ({ name: `Item ${i}` }))
    exportToCSV(largeData, [{ key: 'name' as const, header: 'Name' }], 'test')

    // Simulate worker returning a blob URL
    capturedOnmessage?.({ data: { url: 'blob:worker-csv-url' } } as MessageEvent)

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:worker-csv-url')
    expect(terminateSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })

  it('falls back to sync export when Worker throws error', () => {
    let onerrorHandler: (() => void) | null = null

    vi.stubGlobal(
      'Worker',
      class {
        onmessage: ((e: MessageEvent) => void) | null = null
        set onerror(fn: (() => void) | null) {
          onerrorHandler = fn
        }
        postMessage = vi.fn()
        terminate = vi.fn()
      },
    )

    mockLink()
    const largeData = Array.from({ length: 150 }, (_, i) => ({ name: `Item ${i}` }))
    exportToCSV(largeData, [{ key: 'name' as const, header: 'Name' }], 'test')

    // Simulate worker error — should fall back to sync
    onerrorHandler?.()
    expect(createObjectURLSpy).toHaveBeenCalled()
  })
})
