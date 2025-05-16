import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '../backendService'
import { Dashboard } from '../types'
import FilterTable from '../components/FilterTable'

interface ExplorePageProps {
  userUuid: string | null
  onSelectDashboard: (uuid: string) => void
}

const ExplorePage = ({ userUuid, onSelectDashboard }: ExplorePageProps) => {
  const [dashboardData, setDashboardData] = useState<Dashboard[]>([])

  const fetchDashboards = useCallback(async () => {
    try {
      if (!userUuid) return
      const data = await dashboardService.list()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboards:', error)
    }
  }, [userUuid])

  const handleStarClick = useCallback(async (uuid: string) => {
    try {
      const response = await dashboardService.toggleStar(uuid)
      if (!response.error) {
        setDashboardData(prev => prev.map(d =>
          d.uuid === uuid ? {
            ...d,
            isStarred: response.body?.isStarred,
            stars_count: response.body?.stars_count ?? d.stars_count
          } : d
        ))
      }
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }, [])

  useEffect(() => {
    if (userUuid) fetchDashboards()
  }, [fetchDashboards, userUuid])

  const tableColumns = [
    { id: 'name', label: 'Title' },
    { id: 'stars_count', label: 'Stars' },
    { id: 'execution_count', label: 'Executions' }
  ]

  return (
    <FilterTable
      title="Explore Dashboards"
      onSelectRow={onSelectDashboard}
      onStarClick={handleStarClick}
      tableColumns={tableColumns}
      tableData={dashboardData}
    />
  )
}

export default ExplorePage
