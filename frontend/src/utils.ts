import { GRID_COLS, GRID_ROWS } from "./constants"

export const getGridKey = (x: number, y: number) => `${x}-${y}`

export const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

export const sortComparator = (a: any, b: any, order: 'asc' | 'desc') => {
  if (!a || !b) return 0

  return order === 'asc'
    ? a < b ? -1 : 1
    : b < a ? -1 : 1
}

export const isWithinGrid = (x: number, y: number) =>
  x >= 0 && x < GRID_ROWS && y >= 0 && y < GRID_COLS

export const getAuthHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*\s*)auth_token\s*\=\s*([^]*).*$)|^.*$/, "$1")}`
})

export const generateId = (type: string, existingIds: string[]) => {
  const typePrefix = type.toLowerCase()
  const typeIds = existingIds
    .filter(id => id.startsWith(typePrefix))
    .map(id => {
      const num = parseInt(id.replace(typePrefix, ''))
      return isNaN(num) ? 0 : num
    })

  const nextNum = typeIds.length > 0 ? Math.max(...typeIds) + 1 : 1
  return `${typePrefix}${nextNum}`
}
