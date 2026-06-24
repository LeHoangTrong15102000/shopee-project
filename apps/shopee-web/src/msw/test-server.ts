/**
 * Shared MSW server instance for vitest.
 *
 * Both vitest.setup.js (which calls server.listen() in beforeAll) and individual
 * test files that need to add per-test handlers can import this module to get the
 * same SetupServer instance.  Tests should call server.use(...handlers) — never
 * server.listen() or server.close() — since the lifecycle is managed centrally by
 * the setup file.
 */
import { setupServer } from 'msw/node'

export const server = setupServer()
