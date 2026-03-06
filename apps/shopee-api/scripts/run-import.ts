import { importComplete } from './import-complete'

// Chạy script import
importComplete().catch((error) => {
  console.error('Error running import:', error)
  process.exit(1)
})
