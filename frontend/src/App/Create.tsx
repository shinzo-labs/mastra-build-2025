import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Typography, TextField, Button, MenuItem, IconButton, Box, Tooltip, Menu, Select, Container } from '@mui/material'
import { Square, ChevronDown, Type, Trash2, Layers, Plus, Pencil, Settings, Link2, Play, Save } from 'lucide-react'
import MonacoEditor from '@monaco-editor/react'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { colors, spacing, theme, typography } from '../theme'
import { dashboardService, blockchainService } from '../backendService'
import { EditPanel } from '../components/EditPanel'
import { generateId, getGridKey, isWithinGrid } from '../utils'
import { BlockchainQuery, GridItem, GridItemType, HighlightRegion } from '../types'
import GridRenderer from '../components/GridRenderer'
import {
  GRID_ROWS,
  GRID_COLS,
  CELL_WIDTH,
  CELL_HEIGHT,
  ITEM_WIDTH,
  ITEM_HEIGHT,
  ITEM_MARGIN,
  ITEM_TYPES
} from '../constants'
import {
  DraggableItemProps,
  CreatePageProps,
  ContextMenuState,
} from '../types'

const createStyle = (styles: React.CSSProperties): React.CSSProperties => styles

const gridItemStyle = createStyle({
  width: `${ITEM_WIDTH}px`,
  height: `${ITEM_HEIGHT}px`,
  margin: `${ITEM_MARGIN}px`
})

const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  handleDragStart,
  icon,
  label
}) => (
  <div
    id={id}
    draggable
    onDragStart={handleDragStart}
    style={{
      ...gridItemStyle,
      backgroundColor: colors.background.input,
      cursor: 'grab'
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: typography.sizes.sm,
        padding: '8px 8px'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = colors.gray.medium}
      onMouseOut={(e) => e.currentTarget.style.background = colors.gray.dark}
    >
      {icon}
      <span>{label}</span>
    </div>
  </div>
)

// Add new enum for panel types
enum PanelType {
  Components = 'components',
  Code = 'code',
  Blockchain = 'blockchain',
  Settings = 'settings'
}

const itemDefaultContent: Record<string, { text?: string, options?: string[], placeholder?: string }> = {
  [ITEM_TYPES.BUTTON]: { text: 'Button' },
  [ITEM_TYPES.DROPDOWN]: { options: ['Option 1', 'Option 2', 'Option 3'] },
  [ITEM_TYPES.TEXT]: { text: 'Text' },
  [ITEM_TYPES.TEXTBOX]: { placeholder: 'Enter placeholder text...' },
}

const validateQueryId = (id: string, currentId: string, queries: Record<string, BlockchainQuery>) => {
  if (id === currentId) return ''
  if (id.includes(' ')) return 'ID cannot contain spaces'
  if (id === '') return 'ID is required'
  if (Object.keys(queries).includes(id)) return 'ID must be unique'
  return ''
}

const CreatePage = ({ userUuid, networks }: CreatePageProps) => {
  const [gridItems, setGridItems] = useState<{ [key: string]: GridItem }>({})
  const [gridItemValues, setGridItemValues] = useState<Record<string, string>>({})
  const [gridOccupancy, setGridOccupancy] = useState<{ [key: string]: string }>({}) // grid keys = `${x}-${y}`
  const [highlightRegion, setHighlightRegion] = useState<HighlightRegion | null>(null)
  const [dashboards, setDashboards] = useState<Array<{ uuid: string, name: string }>>([])
  const [currentDashboard, setCurrentDashboard] = useState<{ uuid: string, name: string } | null>(null)
  const [showNewDashboard, setShowNewDashboard] = useState(false)
  const [newDashboardName, setNewDashboardName] = useState('')
  const [editingDashboardName, setEditingDashboardName] = useState('')
  const [activePanel, setActivePanel] = useState<PanelType>(PanelType.Components)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [blockchainQueries, setBlockchainQueries] = useState<Record<string, BlockchainQuery>>({})
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null)
  const [editingQueryId, setEditingQueryId] = useState('')
  const [queryResults, setQueryResults] = useState<Record<string, string>>({})
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')

  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleDragStart: React.DragEventHandler = (event) => {
    event.dataTransfer.setData('text/plain', event.currentTarget.id)
  }

  const handleMoveDragStart: React.DragEventHandler = (event) => {
    const itemKey = event.currentTarget.parentElement?.id
    if (!itemKey || !gridItems[itemKey]) return

    event.dataTransfer.setData('moveFrom', itemKey)
    event.dataTransfer.setData('text/plain', gridItems[itemKey].id)
  }

  const isDroppable = (x: number, y: number, moveFrom?: string) => {
    if (!isWithinGrid(x, y)) return false

    const gridKey = getGridKey(x, y)
    const occupyingItemId = gridOccupancy[gridKey]

    return !occupyingItemId || occupyingItemId === moveFrom
  }

  const handleDrop = (event: React.DragEvent, x: number, y: number) => {
    event.preventDefault()
    const moveFrom = event.dataTransfer.getData('moveFrom')
    const componentId = event.dataTransfer.getData('text/plain')

    if (!isDroppable(x, y, moveFrom)) return

    const gridKey = getGridKey(x, y)

    if (moveFrom) {
      const movedItem = gridItems[moveFrom]
      if (!movedItem) return

      const oldPos = getGridKey(movedItem.position.x, movedItem.position.y)
      setGridOccupancy(prev => {
        const next = { ...prev }
        delete next[oldPos]
        next[gridKey] = moveFrom
        return next
      })

      setGridItems(prev => ({ ...prev, [moveFrom]: { ...movedItem, position: { x, y } } }))
    } else {
      const type = componentId as GridItemType
      const newId = generateId(type, Object.values(gridItems).map(item => item.id))
      const newItem: GridItem = {
        id: newId,
        type,
        position: { x, y },
        content: itemDefaultContent[type]
      }

      setGridItems(prev => ({ ...prev, [newId]: newItem }))
      setGridOccupancy(prev => ({ ...prev, [gridKey]: newId }))
    }
    setHighlightRegion(null)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const { x, y } = calculateGridPosition(event, rect)

    if (isWithinGrid(x, y)) {
      const moveFrom = event.dataTransfer?.getData('moveFrom')
      const isValid = isDroppable(x, y, moveFrom)
      setHighlightRegion({ x, y, isValid })
    } else {
      setHighlightRegion(null)
    }
  }

  const handleUpdateItem = (updatedItem: GridItem) => {
    if (!editingItem) return

    setGridItems(prev => {
      const newItems = { ...prev }
      if (updatedItem.id !== editingItem) {
        delete newItems[editingItem]
        newItems[updatedItem.id] = updatedItem
      } else {
        newItems[editingItem] = updatedItem
      }
      return newItems
    })

    if (updatedItem.id !== editingItem) setEditingItem(updatedItem.id)
  }

  const handleContextMenu = (event: React.MouseEvent, itemKey: string) => {
    event.preventDefault()
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, itemKey })
  }

  const handleDeleteItem = useCallback((itemId: string) => {
    const item = gridItems[itemId]
    if (!item) return

    const gridKey = getGridKey(item.position.x, item.position.y)
    setGridOccupancy(prev => {
      const next = { ...prev }
      delete next[gridKey]
      return next
    })

    setGridItems(prev => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })

    setContextMenu(null)
  }, [gridItems])

  const calculateGridPosition = (event: React.DragEvent, rect: DOMRect) => ({
    x: Math.floor((event.clientY - rect.top) / CELL_HEIGHT),
    y: Math.floor((event.clientX - rect.left) / CELL_WIDTH)
  })

  const handleAddQuery = () => {
    const newId = generateId('query', Object.keys(blockchainQueries))
    const networkList = Object.keys(networks)
    const newQuery: BlockchainQuery = {
      id: newId,
      address: '',
      functionSignature: '',
      network: networkList[0],
      networkEnv: networks[networkList[0]][0] || '',
      params: []
    }
    setBlockchainQueries(prev => ({ ...prev, [newId]: newQuery }))
  }

  const handleQueryUpdate = (queryId: string, updates: Partial<BlockchainQuery>) => {
    setBlockchainQueries(prev => ({ ...prev, [queryId]: { ...prev[queryId], ...updates } }))
  }

  const handleDeleteQuery = (queryId: string) => {
    setBlockchainQueries(prev => {
      const next = { ...prev }
      delete next[queryId]
      return next
    })
    if (selectedQuery === queryId) setSelectedQuery(null)
  }

  const handleExecuteQuery = async (queryId: string) => {
    try {
      const query = blockchainQueries[queryId]
      const params = query.params.map(param =>
        param.source === 'GridItem'
          ? gridItemValues[param.value] || ''
          : param.value
      )

      const response = await blockchainService.callBlockchain({
        address: query.address,
        functionSignature: query.functionSignature,
        network: query.network,
        networkEnv: query.networkEnv,
        params
      })

      const resultJson = JSON.stringify(response.body, null, 2)
      setQueryResults(prev => ({ ...prev, [queryId]: resultJson }))
    } catch (error) {
      console.error('Error executing query:', error)
      const errorJson = JSON.stringify({ error: 'Failed to execute query' }, null, 2)
      setQueryResults(prev => ({ ...prev, [queryId]: errorJson }))
    }
  }

  const handleVisibilityChange = async (visibility: 'private' | 'public') => {
    if (!currentDashboard) return
    try {
      await dashboardService.update(currentDashboard.uuid, { visibility })
      setVisibility(visibility)
    } catch (error) {
      console.error('Error updating visibility:', error)
    }
  }

  const handleUpdateQueryId = (oldId: string, newId: string) => {
    if (oldId === newId) return

    setBlockchainQueries(prev => {
      const next = { ...prev }
      const query = { ...next[oldId], id: newId }
      delete next[oldId]
      next[newId] = query
      return next
    })

    if (selectedQuery === oldId) setSelectedQuery(newId)
  }

  const renderPanel = () => {
    switch (activePanel) {
      case PanelType.Components:
        return (
          <>
            <Typography variant="h6" sx={{ mb: spacing.md }}>Components</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <DraggableItem
                id={ITEM_TYPES.BUTTON}
                handleDragStart={handleDragStart}
                icon={<Square size={16} />}
                label="Button"
              />
              <DraggableItem
                id={ITEM_TYPES.DROPDOWN}
                handleDragStart={handleDragStart}
                icon={<ChevronDown size={16} />}
                label="Dropdown"
              />
              <DraggableItem
                id={ITEM_TYPES.TEXTBOX}
                handleDragStart={handleDragStart}
                icon={<Type size={16} />}
                label="Text Box"
              />
              <DraggableItem
                id={ITEM_TYPES.TEXT}
                handleDragStart={handleDragStart}
                icon={<Type size={16} />}
                label="Text"
              />
            </Box>
          </>
        )
      case PanelType.Blockchain:
        return (
          <>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: spacing.md
            }}>
              <Typography variant="h6">Blockchain Queries</Typography>
              <IconButton onClick={handleAddQuery} size="small">
                <Plus size={16} />
              </IconButton>
            </Box>
            <Box sx={{ mb: spacing.lg }}>
              {Object.values(blockchainQueries).map((query) => {
                const isEditing = editingQueryId === query.id
                const error = isEditing ? validateQueryId(editingQueryId, query.id, blockchainQueries) : ''
                return (
                  <Box
                    key={query.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      bgcolor: selectedQuery === query.id ? colors.background.input : 'transparent',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: colors.background.hover }
                    }}
                    onClick={(e: React.MouseEvent) => !isEditing && setSelectedQuery(query.id)}
                  >
                    {isEditing ? (
                      <Box
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        sx={{ flex: 1 }}
                      >
                        <TextField
                          autoFocus
                          size="small"
                          value={editingQueryId}
                          error={!!error}
                          helperText={error}
                          onChange={(e) => setEditingQueryId(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !error) {
                              handleUpdateQueryId(query.id, editingQueryId)
                              setEditingQueryId('')
                            } else if (e.key === 'Escape') {
                              setEditingQueryId('')
                            }
                            e.stopPropagation()
                          }}
                          fullWidth
                        />
                      </Box>
                    ) : (
                      <Typography sx={{ flex: 1 }}>{query.id}</Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isEditing && !error) {
                          handleUpdateQueryId(query.id, editingQueryId)
                          setEditingQueryId('')
                        } else {
                          setEditingQueryId(query.id)
                        }
                      }}
                      disabled={isEditing && !!error}
                    >
                      {
                        isEditing
                          ? <Save size={16} color={error ? colors.error.main : colors.success.main} />
                          : <Pencil size={16} />
                      }
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteQuery(query.id)
                      }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                )
              })}
            </Box>
            {selectedQuery && (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Select
                    value={blockchainQueries[selectedQuery].network}
                    onChange={(e) => {
                      const network = e.target.value
                      handleQueryUpdate(selectedQuery, { network, networkEnv: networks[network]?.[0] || '' })
                    }}
                    fullWidth
                    size="small"
                    label="Network"
                  >
                    {Object.keys(networks).map(network => (
                      <MenuItem key={network} value={network}>{network}</MenuItem>
                    ))}
                  </Select>
                  <Select
                    value={blockchainQueries[selectedQuery].networkEnv}
                    onChange={(e) => handleQueryUpdate(selectedQuery, { networkEnv: e.target.value })}
                    fullWidth
                    size="small"
                    label="Network Environment"
                  >
                    {networks[blockchainQueries[selectedQuery].network]?.map(env => (
                      <MenuItem key={env} value={env}>{env}</MenuItem>
                    ))}
                  </Select>
                  <TextField
                    label="Contract Address"
                    value={blockchainQueries[selectedQuery].address}
                    onChange={(e) => handleQueryUpdate(selectedQuery, { address: e.target.value })}
                    placeholder="0x..."
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Function Signature"
                    value={blockchainQueries[selectedQuery].functionSignature}
                    onChange={(e) => handleQueryUpdate(selectedQuery, { functionSignature: e.target.value })}
                    placeholder="Ex: transfer(address,uint256)"
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Parameters</Typography>
                    {blockchainQueries[selectedQuery].params.map((param, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Select
                          value={param.source}
                          onChange={(e) => {
                            const newParams = [...blockchainQueries[selectedQuery].params]
                            newParams[index] = { source: e.target.value as 'GridItem' | 'Constant', value: '' }
                            handleQueryUpdate(selectedQuery, { params: newParams })
                          }}
                          size="small"
                          sx={{ width: '35%' }}
                        >
                          <MenuItem value="GridItem">Grid Item</MenuItem>
                          <MenuItem value="Constant">Constant</MenuItem>
                        </Select>
                        {param.source === 'GridItem' ? (
                          <Select
                            value={param.value}
                            onChange={(e) => {
                              const newParams = [...blockchainQueries[selectedQuery].params]
                              newParams[index] = { ...param, value: e.target.value }
                              handleQueryUpdate(selectedQuery, { params: newParams })
                            }}
                            size="small"
                            sx={{ width: '55%' }}
                          >
                            {Object.values(gridItems).map(item => (
                              <MenuItem key={item.id} value={item.id}>{item.id}</MenuItem>
                            ))}
                          </Select>
                        ) : (
                          <TextField
                            value={param.value}
                            onChange={(e) => {
                              const newParams = [...blockchainQueries[selectedQuery].params]
                              newParams[index] = { ...param, value: e.target.value }
                              handleQueryUpdate(selectedQuery, { params: newParams })
                            }}
                            size="small"
                            sx={{ width: '55%' }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newParams = blockchainQueries[selectedQuery].params.filter((_, i) => i !== index)
                            handleQueryUpdate(selectedQuery, { params: newParams })
                          }}
                          sx={{ width: '10%' }}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        const newParams = [...blockchainQueries[selectedQuery].params, { source: 'Constant' as const, value: '' }]
                        handleQueryUpdate(selectedQuery, { params: newParams })
                      }}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      Add Parameter
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Response</Typography>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        if (!selectedQuery) return
                        try {
                          const query = blockchainQueries[selectedQuery]
                          const params = query.params.map(param =>
                            param.source === 'GridItem'
                              ? gridItemValues[param.value] || ''
                              : param.value
                          )

                          const response = await blockchainService.callBlockchain({
                            address: query.address,
                            functionSignature: query.functionSignature,
                            network: query.network,
                            networkEnv: query.networkEnv,
                            params
                          })

                          const resultJson = JSON.stringify(response.body, null, 2)
                          setQueryResults(prev => ({ ...prev, [selectedQuery]: resultJson }))
                        } catch (error) {
                          console.error('Error executing query:', error)
                          const errorJson = JSON.stringify({ error: 'Failed to execute query' }, null, 2)
                          setQueryResults(prev => ({ ...prev, [selectedQuery]: errorJson }))
                        }
                      }}
                    >
                      <Play size={16} />
                    </IconButton>
                  </Box>
                  <MonacoEditor
                    height="200px"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={queryResults[selectedQuery] || '// Response will appear here'}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 12,
                      readOnly: true
                    }}
                  />
                </Box>
              </>
            )}
          </>
        )
      case PanelType.Settings:
        return (
          <>
            <Typography variant="h6" sx={{ mb: spacing.md }}>Settings</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Dashboard Name</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={editingDashboardName}
                  onChange={(e) => setEditingDashboardName(e.target.value)}
                  error={dashboards.some(d => d.name === editingDashboardName && d.uuid !== currentDashboard?.uuid)}
                  helperText={
                    dashboards.some(d => d.name === editingDashboardName && d.uuid !== currentDashboard?.uuid)
                      ? 'Name already exists'
                      : ''
                  }
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => updateDashboardName(editingDashboardName)}
                  disabled={
                    !editingDashboardName.trim() ||
                    editingDashboardName === currentDashboard?.name ||
                    dashboards.some(d => d.name === editingDashboardName && d.uuid !== currentDashboard?.uuid)
                  }
                >
                  Save
                </Button>
              </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Visibility:</Typography>
              <Select
                fullWidth
                size="small"
                value={visibility}
                onChange={(e) => handleVisibilityChange(e.target.value as 'private' | 'public')}
              >
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </Box>
            <Button
              variant="contained"
              color="error"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!currentDashboard}
            >
              Delete Dashboard
            </Button>
          </>
        )
      default:
        return null
    }
  }

  const fetchDashboards = useCallback(async () => {
    try {
      if (!userUuid) return
      const data = await dashboardService.list({ owner_uuid: userUuid })
      setDashboards(data)
    } catch (error) {
      console.error('Error fetching dashboards:', error)
    }
  }, [userUuid])

  const loadDashboard = useCallback(async (uuid: string) => {
    try {
      const data = await dashboardService.read(uuid)
      if (!data.error) {
        setGridItems(data.body?.config?.gridItems ?? {})
        setBlockchainQueries(data.body?.config?.blockchainQueries ?? {})
        setVisibility((data.body?.visibility as 'private' | 'public') ?? 'private')

        const occupancy: { [key: string]: string } = {}
        Object.entries(data.body?.config?.gridItems ?? {}).forEach(([itemId, item]) => {
          const gridKey = getGridKey(item.position.x, item.position.y)
          occupancy[gridKey] = itemId
        })
        setGridOccupancy(occupancy)

        setCurrentDashboard({ uuid, name: data.body?.name ?? '' })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }, [])

  const saveDashboard = useCallback(async () => {
    if (!currentDashboard) return
    try {
      await dashboardService.update(currentDashboard.uuid, { config: { gridItems, blockchainQueries } })
    } catch (error) {
      console.error('Error saving dashboard:', error)
    }
  }, [currentDashboard, gridItems, blockchainQueries])

  const createDashboard = useCallback(async () => {
    try {
      setGridItems({})
      setBlockchainQueries({})

      const response = await dashboardService.create(newDashboardName)
      if (!response.error && response.body) {
        await fetchDashboards()
        setCurrentDashboard({ uuid: response.body.uuid, name: newDashboardName })
        setShowNewDashboard(false)
        setNewDashboardName('')
      }
    } catch (error) {
      console.error('Error creating dashboard:', error)
    }
  }, [newDashboardName, fetchDashboards])

  const deleteDashboard = useCallback(async () => {
    if (!currentDashboard) return

    try {
      await dashboardService.delete(currentDashboard.uuid)
      setCurrentDashboard(null)
      setGridItems({})
      await fetchDashboards()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting dashboard:', error)
    }
  }, [currentDashboard, fetchDashboards])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    console.log('handleResizeStart', isResizing)
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = sidebarWidth
  }, [sidebarWidth])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const delta = e.clientX - startXRef.current
    const newWidth = Math.max(200, Math.min(800, startWidthRef.current + delta))

    // Prevent text selection during resize
    e.preventDefault()

    requestAnimationFrame(() => {
      console.log('handleResizeMove', isResizing, newWidth)
      setSidebarWidth(newWidth)
    })
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    console.log('handleResizeEnd', isResizing)
    setIsResizing(false)
  }, [])

  const updateDashboardName = useCallback(async (name: string) => {
    if (!currentDashboard || name === currentDashboard.name) return

    try {
      await dashboardService.update(currentDashboard.uuid, { name })
      setCurrentDashboard(prev => prev ? { ...prev, name } : null)
      await fetchDashboards()
    } catch (error) {
      console.error('Error updating dashboard name:', error)
    }
  }, [currentDashboard, fetchDashboards])

  useEffect(() => {
    if (userUuid) fetchDashboards()
  }, [fetchDashboards, userUuid])

  useEffect(() => {
    if (currentDashboard) {
      const timeoutId = setTimeout(saveDashboard, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [currentDashboard, gridItems, saveDashboard])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  useEffect(() => {
    if (currentDashboard) setEditingDashboardName(currentDashboard.name)
  }, [currentDashboard])

  return (
    <Container sx={{
      margin: 0, flex: 1, padding: 0, bgcolor: colors.background.paper,
      [theme.breakpoints.up('xs')]: {
        width: '100%',
        maxWidth: '100%',
      },
    }}>
      <Box sx={{ p: 2, borderBottom: 2, borderColor: 'divider' }}>
        <Select
          value={currentDashboard?.uuid ?? ''}
          onChange={(e) => {
            if (e.target.value === 'new') setShowNewDashboard(true)
            else if (e.target.value) loadDashboard(e.target.value)
          }}
          sx={{ width: 300 }}
        >
          <MenuItem value="new" sx={{ fontStyle: 'italic' }}>Create New Dashboard</MenuItem>
          {dashboards.map(d => <MenuItem key={d.uuid} value={d.uuid}>{d.name}</MenuItem>)}
        </Select>
      </Box>
      <div style={{ position: 'relative', flex: 1 }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{
            width: '48px',
            height: '100%',
            backgroundColor: colors.background.paper,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: spacing.sm,
            gap: spacing.sm,
            borderRight: `1px solid ${colors.background.input}`
          }}>
            <Tooltip title="Components" placement="right">
              <IconButton
                onClick={() => setActivePanel(PanelType.Components)}
                sx={{
                  backgroundColor: activePanel === PanelType.Components ?
                    colors.background.input : 'transparent',
                  width: '32px',
                  height: '32px',
                  mb: spacing.sm
                }}
              >
                <Layers size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Blockchain Queries" placement="right">
              <IconButton
                onClick={() => setActivePanel(PanelType.Blockchain)}
                sx={{
                  backgroundColor: activePanel === PanelType.Blockchain ?
                    colors.background.input : 'transparent',
                  width: '32px',
                  height: '32px',
                  mb: spacing.sm
                }}
              >
                <Link2 size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings" placement="right">
              <IconButton
                onClick={() => setActivePanel(PanelType.Settings)}
                sx={{
                  backgroundColor: activePanel === PanelType.Settings ?
                    colors.background.input : 'transparent',
                  width: '32px',
                  height: '32px',
                  mb: spacing.sm
                }}
              >
                <Settings size={20} />
              </IconButton>
            </Tooltip>
          </div>
          <div style={{
            position: 'relative',
            width: `${sidebarWidth}px`,
            maxWidth: '800px',
            backgroundColor: colors.background.paper,
            padding: spacing.md,
            overflowY: 'auto',
            borderRight: `1px solid ${colors.background.input}`,
            transition: 'none',
            flexShrink: 0
          }}>
            {renderPanel()}
            <div
              style={{
                width: '4px',
                height: '100%',
                background: colors.background.input,
                cursor: 'col-resize',
                position: 'absolute',
                right: 0,
                top: 0,
                userSelect: 'none',
                touchAction: 'none'
              }}
              onMouseDown={handleResizeStart}
            />
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            width: `${CELL_WIDTH * GRID_COLS}px`,
            height: `${CELL_HEIGHT * GRID_ROWS}px`,
            backgroundColor: colors.background.default
          }}>
            <GridRenderer
              items={gridItems}
              onSelectItem={(id) => setEditingItem(id)}
              selectedItem={editingItem}
              onContextMenu={handleContextMenu}
              onItemDragStart={handleMoveDragStart}
              highlightRegion={highlightRegion}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const { x, y } = calculateGridPosition(e, rect)
                if (isWithinGrid(x, y)) handleDrop(e, x, y)
                setHighlightRegion(null)
              }}
              onDragLeave={() => setHighlightRegion(null)}
              onClick={() => setEditingItem(null)}
              itemValues={gridItemValues}
              onItemValueChange={(itemId, value) => setGridItemValues(prev => ({ ...prev, [itemId]: value }))}
              blockchainQueries={blockchainQueries}
              onExecuteQuery={handleExecuteQuery}
              enableEdits={true}
            />
          </div>
        </div>
        {!currentDashboard && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background.overlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Typography variant="h6" color="text.secondary">
              Please select or create a dashboard to begin
            </Typography>
          </div>
        )}
      </div>
      {editingItem && gridItems[editingItem] && (
        <EditPanel
          item={gridItems[editingItem]}
          onClose={() => setEditingItem(null)}
          onUpdate={handleUpdateItem}
          blockchainQueries={blockchainQueries}
          gridItems={gridItems}
        />
      )}
      <Dialog open={showNewDashboard} onClose={() => setShowNewDashboard(false)}>
        <DialogTitle>Create New Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dashboard Name"
            fullWidth
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
            error={dashboards.some(d => d.name === newDashboardName)}
            helperText={dashboards.some(d => d.name === newDashboardName) ?
              'Name already exists' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewDashboard(false)}>Cancel</Button>
          <Button
            onClick={createDashboard}
            disabled={!newDashboardName || dashboards.some(d => d.name === newDashboardName)}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Delete Dashboard?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this dashboard? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={deleteDashboard} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => {
          if (contextMenu) {
            setEditingItem(contextMenu.itemKey)
            setContextMenu(null)
          }
        }}>
          Inspect
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu) handleDeleteItem(contextMenu.itemKey)
        }}>
          Delete
        </MenuItem>
      </Menu>
    </Container>
  )
}

export default CreatePage
