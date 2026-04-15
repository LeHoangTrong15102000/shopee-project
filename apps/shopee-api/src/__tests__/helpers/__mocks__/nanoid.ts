let counter = 0
export const nanoid = (size?: number): string => {
  counter++
  return `mock-nanoid-${counter}-${Date.now()}`
}
