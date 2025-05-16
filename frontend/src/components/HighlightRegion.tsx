import React from 'react'
import { Box } from '@mui/material'
import { colors } from '../theme'
import { HighlightRegion as HighlightRegionType } from '../types'
import { ITEM_MARGIN, ITEM_HEIGHT, ITEM_WIDTH, CELL_HEIGHT, CELL_WIDTH } from '../constants'

interface HighlightRegionProps { region: HighlightRegionType }

const HighlightRegion: React.FC<HighlightRegionProps> = ({ region }) => {
  const style = {
    position: 'absolute',
    left: `${region.y * CELL_WIDTH}px`,
    top: `${region.x * CELL_HEIGHT}px`,
    width: `${ITEM_WIDTH}px`,
    height: `${ITEM_HEIGHT}px`,
    margin: `${ITEM_MARGIN}px`,
    borderRadius: '4px',
    border: `2px solid ${region.isValid ? colors.success.main : colors.error.main}`,
    backgroundColor: region.isValid ? colors.success.light : colors.error.light,
    pointerEvents: 'none',
    zIndex: 999
  } as const

  return <Box sx={style} />
}

export default HighlightRegion
