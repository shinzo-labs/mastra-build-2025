import { ITEM_TYPES } from './constants'

export interface BlockchainQuery {
  id: string
  address: string
  functionSignature: string
  network: string
  networkEnv: string
  params: {
    source: 'GridItem' | 'Constant'
    value: string
  }[]
}

export interface Dashboard {
  config?: {
    blockchainQueries: Record<string, BlockchainQuery>
    gridItems: Record<string, GridItem>
  }
  created_at: string
  execution_count: number
  isStarred?: boolean
  name: string
  stars_count: number
  uuid: string
  visibility?: string
}

export interface DashboardConfig {
  blockchainQueries: Record<string, BlockchainQuery>
  gridItems: Record<string, GridItem>
}

export interface DashboardView {
  config?: DashboardConfig
  isStarred?: boolean
  name: string
  stars_count: number
}

export type GridItemType = typeof ITEM_TYPES[keyof typeof ITEM_TYPES]

export interface GridItem {
  content?: {
    options?: string[]
    placeholder?: string
    text?: string
    triggers?: string[]
  }
  id: string
  position: { x: number, y: number }
  type: GridItemType
}

export interface HighlightRegion {
  isValid: boolean
  x: number
  y: number
}

export interface NetworkList {
  [network: string]: string[]
}

export enum PanelType {
  Code = 'code',
  Components = 'components',
  Settings = 'settings'
}

export interface DraggableItemProps {
  id: string
  handleDragStart: (event: React.DragEvent) => void
  style?: React.CSSProperties
  icon: React.ReactNode
  label: string
}

export interface CreatePageProps {
  userUuid: string | null
  networks: NetworkList
}

export interface ContextMenuState {
  mouseX: number
  mouseY: number
  itemKey: string
}
