import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TableSortLabel, Menu, MenuItem, Checkbox } from '@mui/material'
import { useState } from 'react'
import { Filter, Star } from 'lucide-react'
import { colors, spacing } from '../theme'
import { sortComparator } from '../utils'

interface TableRowData {
  uuid: string
  isStarred?: boolean
  [key: string]: any
}

const getUniqueValues = (column: string, tableData: TableRowData[]) => {
  return Array.from(new Set(tableData.map(d => d[column])))
}

interface FilterTableProps {
  title: string
  onSelectRow: (uuid: string) => void
  onStarClick: (uuid: string) => void
  tableColumns: { id: string, label: string }[]
  tableData: TableRowData[]
}

const FilterTable = ({ title, onSelectRow, onStarClick, tableColumns, tableData }: FilterTableProps) => {
  const [orderBy, setOrderBy] = useState('stars_count')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [filterColumn, setFilterColumn] = useState('')
  const [filters, setFilters] = useState<{ [key: string]: Set<string> }>({})

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>, column: string) => {
    setFilterAnchorEl(event.currentTarget)
    setFilterColumn(column)
  }

  const handleFilterChange = (value: string) => {
    const currentFilters = filters[filterColumn] || new Set()
    const newFilters = new Set(currentFilters)
    newFilters.has(value)
      ? newFilters.delete(value)
      : newFilters.add(value)
    setFilters({ ...filters, [filterColumn]: newFilters })
  }

  const processedData = tableData.filter(d => (
    Object.entries(filters).every(([column, values]) => {
      if (values.size === 0) return true
      return values.has(String(d[column as keyof typeof d]))
    })
  )).sort((a, b) => sortComparator(a, b, order))

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'  // Hide overflow
      }}
    >
      <Typography variant="h4" gutterBottom>{title}</Typography>
      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 1,  // Take remaining space
          overflow: 'auto',  // Enable scrolling within table
          bgcolor: colors.background.paper,
          mb: spacing.lg
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '50px' }}></TableCell>
              {tableColumns.map((column) => (
                <TableCell key={column.id}>
                  <Box display="flex" alignItems="center">
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, column.id)}
                      sx={{
                        ml: spacing.xs,
                        color: filters[column.id]?.size ? 'primary.main' : 'text.primary'
                      }}
                    >
                      <Filter size={16} />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData.map((d) => (
              <TableRow
                key={d.uuid}
                onClick={() => onSelectRow(d.uuid)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: 'inherit',
                  '&:hover': { bgcolor: colors.background.hover }
                }}
              >
                <TableCell>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation()
                      onStarClick(d.uuid)
                    }}
                    sx={{ color: colors.gold }}
                  >
                    <Star
                      size={16}
                      fill={d.isStarred ? colors.gold : 'none'}
                    />
                  </IconButton>
                </TableCell>
                {tableColumns.map((column) => (
                  <TableCell key={column.id}>{d[column.id as keyof typeof d]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        {filterColumn && getUniqueValues(filterColumn, tableData).map((value) => (
          <MenuItem
            key={String(value)}
            onClick={() => handleFilterChange(String(value))}
            sx={{
              py: spacing.xs,
              px: spacing.sm
            }}
          >
            <Checkbox
              checked={filters[filterColumn]?.has(String(value)) || false}
              color="primary"
              size="small"
            />
            {value}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default FilterTable
