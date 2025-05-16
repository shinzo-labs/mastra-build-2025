import { useState, useEffect } from 'react'
import { Typography, TextField, Button, Box, IconButton, Select, MenuItem, Chip } from '@mui/material'
import { Trash2, X } from 'lucide-react'
import { GridItem, BlockchainQuery } from '../types'
import { colors, spacing } from '../theme'

interface EditPanelProps {
  item: GridItem
  onClose: () => void
  onUpdate: (updatedItem: GridItem) => void
  blockchainQueries: Record<string, BlockchainQuery>
  gridItems: Record<string, GridItem>
}

const editPanelStyle = {
  position: 'fixed',
  right: 0,
  top: 0,
  width: '300px',
  height: '100vh',
  background: colors.background.paper,
  padding: spacing.lg,
  boxShadow: `-2px 0 5px ${colors.background.overlay}`,
  zIndex: 1001
} as const

export const EditPanel: React.FC<EditPanelProps> = ({ item, onClose, onUpdate, blockchainQueries, gridItems }) => {
  if (!item) return null

  const [editedId, setEditedId] = useState(item.id)
  const [idError, setIdError] = useState('')

  useEffect(() => {
    setEditedId(item.id)
  }, [item.id])

  const handleClose = () => {
    setEditedId('')
    setIdError('')
    onClose()
  }

  const validateId = (value: string) => {
    if (value.includes(' ')) return 'Id cannot contain spaces'
    if (value === '') return 'Id is required'
    if (value !== item.id && (
      Object.keys(blockchainQueries).some(s => s === value) ||
      Object.values(gridItems).some(g => g.id === value && g !== item)
    )) {
      return 'Id must be unique across all components'
    }
    return ''
  }

  useEffect(() => {
    setIdError(validateId(editedId))
  }, [editedId])

  const handleSaveId = () => {
    const error = validateId(editedId)
    if (error) {
      setIdError(error)
      return
    }
    onUpdate({ ...item, id: editedId })
    setIdError('')
  }

  const handleUpdate = (updates: Partial<GridItem['content']>) => {
    onUpdate({ ...item, content: { ...item.content, ...updates } })
  }

  const renderFields = () => {
    switch (item.type) {
      case 'button':
        return (
          <div>
            <TextField
              label="Text"
              value={item.content?.text || ''}
              onChange={(e) => handleUpdate({ text: e.target.value })}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Triggers:</Typography>
            <Select
              fullWidth
              multiple
              value={item.content?.triggers || []}
              onChange={(e) => handleUpdate({ triggers: e.target.value as string[] })}
              sx={{ mb: spacing.md }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected).map(value => <Chip key={value} label={value} size="small" />)}
                </Box>
              )}
            >
              {Object.keys(blockchainQueries).map(id => (<MenuItem key={id} value={id}>{id}</MenuItem>))}
            </Select>
          </div>
        )

      case 'text':
        return (
          <TextField
            label="Value"
            value={item.content?.text || ''}
            onChange={(e) => handleUpdate({ text: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={3}
          />
        )

      case 'dropdown':
        return (
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Options:</Typography>
            {(item.content?.options || []).map((option, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(item.content?.options || [])]
                    newOptions[index] = e.target.value
                    handleUpdate({ options: newOptions })
                  }}
                />
                <IconButton
                  color="error"
                  onClick={() => {
                    const newOptions = [...(item.content?.options || [])]
                    newOptions.splice(index, 1)
                    handleUpdate({ options: newOptions })
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="contained"
              onClick={() => {
                const newOptions = [...(item.content?.options || []), 'New Option']
                handleUpdate({ options: newOptions })
              }}
            >
              Add Option
            </Button>
          </div>
        )

      case 'textbox':
        return (
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Placeholder:</Typography>
            <TextField
              fullWidth
              value={item.content?.placeholder || ''}
              onChange={(e) => handleUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder Text"
              sx={{ mb: spacing.md }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={editPanelStyle}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: spacing.md }}>
        <Typography variant="h6">Edit {item.type}</Typography>
        <IconButton onClick={handleClose} size="small">
          <X size={16} />
        </IconButton>
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>ID:</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={editedId}
            onChange={(e) => setEditedId(e.target.value)}
            error={!!idError}
            helperText={idError}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveId}
            disabled={editedId === item.id || !!idError || !editedId.trim()}
          >
            Save
          </Button>
        </Box>
      </Box>
      {renderFields()}
    </div>
  )
}
