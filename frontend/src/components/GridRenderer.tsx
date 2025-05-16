import React, { useState } from 'react'
import { Box, Button, Select, MenuItem, TextField, Typography } from '@mui/material'
import { colors } from '../theme'
import { GridItem, BlockchainQuery } from '../types'
import HighlightRegion from './HighlightRegion'
import { 
  GRID_ROWS, 
  GRID_COLS, 
  CELL_WIDTH, 
  CELL_HEIGHT,
  ITEM_TYPES,
  ITEM_WIDTH,
  ITEM_HEIGHT,
  ITEM_MARGIN
} from '../constants'

interface GridRendererProps {
  items: Record<string, GridItem>
  highlightRegion?: {
    x: number
    y: number
    isValid: boolean
  } | null
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onClick?: () => void
  onSelectItem?: (id: string) => void
  selectedItem?: string | null
  onContextMenu?: (e: React.MouseEvent, id: string) => void
  onItemDragStart?: (e: React.DragEvent) => void
  itemValues: Record<string, string>
  onItemValueChange: (id: string, value: string) => void
  blockchainQueries?: Record<string, BlockchainQuery>
  onExecuteQuery?: (queryId: string) => void
  enableEdits?: boolean
}

interface GridItemRendererProps {
  item: GridItem
  onSelect?: (id: string) => void
  isSelected?: boolean
  onContextMenu?: (e: React.MouseEvent, id: string) => void
  onDragStart?: (e: React.DragEvent) => void
  value?: string
  onValueChange: (value: string) => void
  onExecuteQuery?: (queryId: string) => void
  enableEdits?: boolean
}

const MoveHandle: React.FC<{
  visible: boolean
  onDragStart: (e: React.DragEvent) => void
}> = ({ visible, onDragStart }) => (
  <Box
    draggable
    onDragStart={onDragStart}
    sx={{
      position: 'absolute',
      top: '-15px',
      left: `${ITEM_WIDTH / 2 - 20}px`,
      width: '40px',
      height: '25px',
      bgcolor: colors.background.input,
      borderRadius: '4px',
      cursor: 'move',
      zIndex: 1000,
      display: visible ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    :::
  </Box>
)

const GridItemRenderer: React.FC<GridItemRendererProps> = ({
  item,
  onSelect,
  isSelected,
  onContextMenu,
  onDragStart,
  value = '',
  onValueChange,
  onExecuteQuery,
  enableEdits = false
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleSelectChange = (event: any) => {
    onValueChange(event.target.value)
  }

  const baseStyle = {
    position: 'absolute',
    left: `${item.position.y * CELL_WIDTH}px`,
    top: `${item.position.x * CELL_HEIGHT}px`,
    width: `${ITEM_WIDTH}px`,
    height: `${ITEM_HEIGHT}px`,
    margin: `${ITEM_MARGIN}px`,
    cursor: 'pointer',
    outline: isSelected ? `2px solid ${colors.primary.main}` : 'none'
  }

  const buttonSx = {
    width: '100%',
    height: '100%',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    backgroundColor: colors.primary.main,
    '&:hover': {
      backgroundColor: colors.primary.dark
    }
  }

  const renderContent = () => {
    switch (item.type) {
      case ITEM_TYPES.BUTTON:
        return (
          <Button
            variant="contained"
            sx={buttonSx}
            onClick={() => {
              if (item.content?.triggers) {
                item.content.triggers.forEach(triggerId => {
                  onExecuteQuery?.(triggerId)
                })
              }
            }}
          >
            {item.content?.text || 'Button'}
          </Button>
        )

      case ITEM_TYPES.DROPDOWN:
        return (
          <Select
            value={value || item.content?.options?.[0] || ''}
            onChange={handleSelectChange}
            fullWidth
          >
            {item.content?.options?.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        )

      case ITEM_TYPES.TEXTBOX:
        return (
          <TextField
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={item.content?.placeholder}
            fullWidth
          />
        )

      case ITEM_TYPES.TEXT:
        return (
          <Typography
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background.input,
              borderRadius: 1
            }}
          >
            {item.content?.text || 'Text'}
          </Typography>
        )

      default:
        return null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event from reaching grid container
    onSelect?.(item.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu?.(e, item.id)
  }

  return (
    <Box
      sx={baseStyle}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderContent()}
      {enableEdits && isHovered && (
        <MoveHandle
          visible={isHovered}
          onDragStart={(e) => {
            e.dataTransfer.setData('moveFrom', item.id)
            onDragStart?.(e)
          }}
        />
      )}
    </Box>
  )
}

const GridGuidelines: React.FC<{ showGridlines: boolean }> = ({ showGridlines }) => {
  const lines = []
  
  // Vertical lines
  for (let i = 0; i <= GRID_COLS; i++) {
    lines.push(
      <Box
        key={`v${i}`}
        sx={{
          position: 'absolute',
          left: `${i * CELL_WIDTH + 3}px`,
          top: 3,
          width: '2px',
          height: '100%',
          bgcolor: showGridlines ? colors.text.lightOpacity : 'transparent'
        }}
      />
    )
  }

  // Horizontal lines
  for (let i = 0; i <= GRID_ROWS; i++) {
    lines.push(
      <Box
        key={`h${i}`}
        sx={{
          position: 'absolute',
          left: 3,
          top: `${i * CELL_HEIGHT + 3}px`,
          width: '100%',
          height: '2px',
          bgcolor: showGridlines ? colors.text.lightOpacity : 'transparent'
        }}
      />
    )
  }

  return <>{lines}</>
}

const GridRenderer: React.FC<GridRendererProps> = ({
  items,
  highlightRegion = null,
  enableEdits = false,
  onDragOver,
  onDrop,
  onDragLeave,
  onClick,
  onSelectItem,
  selectedItem,
  onContextMenu,
  onItemDragStart,
  itemValues,
  onItemValueChange,
  onExecuteQuery
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const showGridlines = isHovered || highlightRegion !== null

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        '& > div': {
          position: 'relative',
          width: enableEdits ? `${CELL_WIDTH * (GRID_COLS + 10)}px` : '100%',
          height: enableEdits ? `${CELL_HEIGHT * (GRID_ROWS + 10)}px` : '100%',
          padding: enableEdits ? '40px' : 0,
          backgroundColor: enableEdits ? colors.background.paper : 'transparent'
        }
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${CELL_WIDTH * GRID_COLS}px`,
            height: `${CELL_HEIGHT * GRID_ROWS}px`,
            backgroundColor: colors.background.default,
            borderRadius: 1
          }}
        >
          {enableEdits && <GridGuidelines showGridlines={showGridlines} />}
          {highlightRegion && (
            <HighlightRegion region={highlightRegion} />
          )}
          {Object.values(items).map((item) => (
            <GridItemRenderer
              key={item.id}
              item={item}
              onSelect={onSelectItem}
              isSelected={selectedItem === item.id}
              onContextMenu={onContextMenu}
              onDragStart={onItemDragStart}
              value={itemValues[item.id]}
              onValueChange={(value) => onItemValueChange(item.id, value)}
              onExecuteQuery={onExecuteQuery}
              enableEdits={enableEdits}
            />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default GridRenderer
