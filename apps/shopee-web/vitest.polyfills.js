/// <reference types="vitest" />

// Polyfill Web Streams APIs for vmForks VM context compatibility.
// Node.js 18+ has these as globals, but Vitest's vmForks VM contexts
// do not inherit them. MSW's @mswjs/interceptors requires TransformStream
// for brotli-decompress.ts.
import { TransformStream, ReadableStream, WritableStream } from 'node:stream/web'

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream
}
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream
}
if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream
}
