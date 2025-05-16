import React, { useState, useEffect, useCallback } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { Star } from 'lucide-react'
import { colors } from '../theme'
import { dashboardService } from '../backendService'
import { DashboardView } from '../types'
import GridRenderer from '../components/GridRenderer'

interface ViewPageProps {
  userUuid: string | null
  dashboardUuid: string
}

const ViewPage: React.FC<ViewPageProps> = ({ userUuid, dashboardUuid }) => {
  const [dashboard, setDashboard] = useState<DashboardView | null>(null)
  const [itemValues, setItemValues] = useState<Record<string, string>>({})

  const fetchDashboard = useCallback(async () => {
    try {
      if (!userUuid) return
      const response = await dashboardService.read(dashboardUuid)
      if (!response.error && response.body) setDashboard(response.body)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }, [userUuid, dashboardUuid])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleStarClick = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!dashboard) return

    try {
      const response = await dashboardService.toggleStar(dashboardUuid)
      if (!response.error && response.body) {
        const stars_count = response.body.stars_count
        const isStarred = response.body.isStarred
        setDashboard(prev => prev ? {
          ...prev,
          stars_count,
          isStarred
        } : null)
      }
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }

  if (!dashboard) return null

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{dashboard.name}</Typography>
        <IconButton
          onClick={handleStarClick}
          sx={{ ml: 2, color: colors.gold }}
        >
          <Star
            size={24}
            fill={dashboard.isStarred ? colors.gold : 'none'}
          />
        </IconButton>
        <Typography sx={{ ml: 1, color: colors.text.secondary }}>
          {dashboard.stars_count}
        </Typography>
      </Box>

      <Box sx={{
        flex: 1,
        position: 'relative',
        bgcolor: colors.background.default,
        borderRadius: 1,
        overflow: 'auto'
      }}>
        <GridRenderer
          items={dashboard.config?.gridItems || {}}
          itemValues={itemValues}
          onItemValueChange={(id, value) => setItemValues(prev => ({ ...prev, [id]: value }))}
          enableEdits={false}
        />
      </Box>
    </Box>
  )
}

export default ViewPage
