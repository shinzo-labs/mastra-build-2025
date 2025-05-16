import * as yup from 'yup'
import { Dashboard } from '../models/main/Dashboard'
import { logger } from '../logger'
import { writeFileRelative, unlinkSyncRelative, readFileRelative } from '../utils'
import { Op, WhereOptions } from 'sequelize'
import { UserStars } from '../models/main/UserStars'

const MAX_NAME_LENGTH = 100

export const createDashboardSchema = yup.object({
  name: yup.string()
    .required()
    .min(1, 'Name cannot be empty')
    .max(MAX_NAME_LENGTH, `Name cannot be longer than ${MAX_NAME_LENGTH} characters`),
  visibility: yup.string()
    .required()
    .oneOf(['private', 'public'] as const, 'Visibility must be either private or public'),
  config: yup.mixed()
    .required()
    .test('is-valid-json', 'Invalid JSON configuration', value => {
      try {
        JSON.stringify(value)
        return true
      } catch {
        return false
      }
    })
}).required()

export const createDashboard = async (userUuid: string, request: yup.InferType<typeof createDashboardSchema>) => {
  try {
    const dashboard = await Dashboard.create({
      owner_uuid: userUuid,
      name: request.name,
      visibility: request.visibility,
      stars_count: 0,
      execution_count: 0
    })

    writeFileRelative(`${dashboard.uuid}.json`, JSON.stringify(request.config))

    return {
      response: {
        uuid: dashboard.uuid,
        owner_uuid: dashboard.owner_uuid,
        name: dashboard.name,
        visibility: dashboard.visibility,
        stars_count: dashboard.stars_count,
        execution_count: dashboard.execution_count,
        config: request.config
      },
      status: 200
    }

  } catch (error) {
    logger.error({ message: 'Dashboard creation error', error })
    return {
      response: 'Error creating dashboard',
      error: true,
      status: 500
    }
  }
}

export const updateDashboardSchema = yup.object({
  uuid: yup.string()
    .required()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID format'),
  name: yup.string()
    .min(1, 'Name cannot be empty')
    .max(MAX_NAME_LENGTH, `Name cannot be longer than ${MAX_NAME_LENGTH} characters`),
  visibility: yup.string()
    .oneOf(['private', 'public'] as const, 'Visibility must be either private or public'),
  config: yup.mixed()
    .test('is-valid-json', 'Invalid JSON configuration', value => {
      try {
        JSON.stringify(value)
        return true
      } catch {
        return false
      }
    })
}).required()

export const updateDashboard = async (userUuid: string, request: yup.InferType<typeof updateDashboardSchema>) => {
  try {
    // Find and verify ownership
    const dashboard = await Dashboard.findOne({
      where: {
        uuid: request.uuid,
        owner_uuid: userUuid
      }
    })

    if (!dashboard) {
      return {
        response: 'Dashboard not found or access denied',
        error: true,
        status: 404
      }
    }

    // Update dashboard record if fields changed
    const updates: Partial<Dashboard> = {}
    if (request.name) updates.name = request.name
    if (request.visibility) updates.visibility = request.visibility
   
    if (Object.keys(updates).length > 0) {
      await dashboard.update(updates)
    }

    // Update config file if provided
    if (request.config) {
      writeFileRelative(`${dashboard.uuid}.json`, JSON.stringify(request.config))
    }

    return {
      response: {
        uuid: dashboard.uuid,
        owner_uuid: dashboard.owner_uuid,
        name: dashboard.name,
        visibility: dashboard.visibility,
        stars_count: dashboard.stars_count,
        execution_count: dashboard.execution_count,
        config: request.config
      },
      status: 200
    }

  } catch (error) {
    logger.error({ message: 'Dashboard update error', error })
    return {
      response: 'Error updating dashboard',
      error: true,
      status: 500
    }
  }
}

export const deleteDashboardSchema = yup.object({
  uuid: yup.string()
    .required()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID format')
}).required()

export const deleteDashboard = async (userUuid: string, request: yup.InferType<typeof deleteDashboardSchema>) => {
  try {
    // Find and verify ownership
    const dashboard = await Dashboard.findOne({
      where: {
        uuid: request.uuid,
        owner_uuid: userUuid
      }
    })

    if (!dashboard) {
      return {
        response: 'Dashboard not found or access denied',
        error: true,
        status: 404
      }
    }

    // Delete the JSON file first
    try {
      unlinkSyncRelative(`${dashboard.uuid}.json`)
    } catch (error) {
      logger.error({ message: 'Error deleting dashboard file', error })
    }

    // Delete the dashboard record
    await dashboard.destroy()

    return {
      response: {
        uuid: dashboard.uuid,
        deleted: true
      },
      status: 200
    }

  } catch (error) {
    logger.error({ message: 'Dashboard deletion error', error })
    return {
      response: 'Error deleting dashboard',
      error: true,
      status: 500
    }
  }
}

const addIsStarredToDashboard = async (dashboard: Dashboard, userUuid: string) => {
  const star = await UserStars.findOne({
    where: {
      user_uuid: userUuid,
      dashboard_uuid: dashboard.uuid
    }
  });
 
  return {
    ...dashboard.get({ plain: true }),
    isStarred: !!star
  };
};

export const readDashboardSchema = yup.object({
  uuid: yup.string()
    .required()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID format')
}).required()



export const readDashboard = async (userUuid: string, request: yup.InferType<typeof readDashboardSchema>) => {
  try {
    const dashboard = await Dashboard.findOne({
      where: {
        uuid: request.uuid,
        [Op.or]: [
          { visibility: 'public' },
          { owner_uuid: userUuid }
        ]
      }
    });

    if (!dashboard) {
      return {
        response: 'Dashboard not found or access denied',
        error: true,
        status: 404
      };
    }

    const dashboardWithStar = await addIsStarredToDashboard(dashboard, userUuid);
   
    // Add config data
    let config = {};
    try {
      const configStr = readFileRelative(`${dashboard.uuid}.json`).toString();
      config = JSON.parse(configStr);
    } catch (error) {
      logger.error({ message: 'Error reading dashboard config', error });
      return {
        response: 'Error reading dashboard configuration',
        error: true,
        status: 500
      };
    }

    return {
      response: {
        ...dashboardWithStar,
        config
      },
      status: 200
    };
  } catch (error) {
    logger.error({ message: 'Dashboard fetch error', error })
    return {
      response: 'Error fetching dashboard',
      error: true,
      status: 500
    }
  }
}

export const toggleStarSchema = yup.object({
  uuid: yup.string()
    .required()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID format')
}).required()

export const toggleStar = async (userUuid: string, request: yup.InferType<typeof toggleStarSchema>) => {
  try {
    // Find dashboard and verify it exists
    const dashboard = await Dashboard.findOne({
      where: {
        uuid: request.uuid,
        [Op.or]: [
          { visibility: 'public' },
          {
            visibility: 'private',
            owner_uuid: userUuid
          }
        ]
      }
    })

    if (!dashboard) {
      return {
        response: 'Dashboard not found or access denied',
        error: true,
        status: 404
      }
    }

    // Find existing star
    const existingStar = await UserStars.findOne({
      where: {
        user_uuid: userUuid,
        dashboard_uuid: dashboard.uuid
      }
    })

    if (existingStar) {
      // Remove star
      await existingStar.destroy()
      await dashboard.update({ stars_count: dashboard.stars_count - 1 })
    } else {
      // Add star
      await UserStars.create({
        user_uuid: userUuid,
        dashboard_uuid: dashboard.uuid
      })
      await dashboard.update({ stars_count: dashboard.stars_count + 1 })
    }

    return {
      response: {
        uuid: dashboard.uuid,
        stars_count: dashboard.stars_count,
        isStarred: !existingStar
      },
      status: 200
    }

  } catch (error) {
    logger.error({ message: 'Star toggle error', error })
    return {
      response: 'Error toggling star',
      error: true,
      status: 500
    }
  }
}

export const listDashboardsSchema = yup.object({
  // Filters
  visibility: yup.string()
    .oneOf(['private', 'public'] as const),
  minStars: yup.number()
    .min(0),
  minExecutions: yup.number()
    .min(0),
  ownerUuid: yup.string()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID format'),
  nameSearch: yup.string()
    .min(1),
  // Sorting
  sortBy: yup.string()
    .oneOf(['stars', 'executions', 'name'] as const),
  sortOrder: yup.string()
    .oneOf(['asc', 'desc'] as const)
    .default('desc'),
  // Pagination
  page: yup.number()
    .min(1)
    .default(1),
  pageSize: yup.number()
    .min(1)
    .max(100)
    .default(20)
}).required()

export const listDashboards = async (userUuid: string, request: yup.InferType<typeof listDashboardsSchema>) => {
  try {
    const where: WhereOptions = {}

    // Visibility filter
    if (request.visibility === 'private') {
      where.visibility = 'private'
      where.owner_uuid = userUuid
    } else if (request.visibility === 'public') {
      where.visibility = 'public'
    } else {
      // Show public + user's private
      (where as any)[Op.or] = [
        { visibility: 'public' },
        {
          visibility: 'private',
          owner_uuid: userUuid
        }
      ]
    }

    // Other filters
    if (request.minStars) {
      where.stars_count = { [Op.gte]: request.minStars }
    }
    if (request.minExecutions) {
      where.execution_count = { [Op.gte]: request.minExecutions }
    }
    if (request.ownerUuid) {
      where.owner_uuid = request.ownerUuid
    }
    if (request.nameSearch) {
      where.name = { [Op.iLike]: `%${request.nameSearch}%` }
    }

    const offset = (request.page - 1) * request.pageSize;

    // Determine sort column and direction
    const order: [string, string][] = []
    if (request.sortBy === 'stars') {
      order.push(['stars_count', request.sortOrder])
    } else if (request.sortBy === 'executions') {
      order.push(['execution_count', request.sortOrder])
    } else if (request.sortBy === 'name') {
      order.push(['name', request.sortOrder])
    }
    order.push(['created_at', 'desc']) // Secondary sort

    logger.debug({ where })
    // Fetch dashboards
    const { count, rows } = await Dashboard.findAndCountAll({
      where,
      order,
      limit: request.pageSize,
      offset,
      attributes: [
        'uuid', 'name', 'owner_uuid', 'visibility',
        'stars_count', 'execution_count', 'created_at'
      ]
    })

    const dashboardsWithStars = await Promise.all(
      rows.map(d => addIsStarredToDashboard(d, userUuid))
    );

    return {
      response: {
        dashboards: dashboardsWithStars,
        pagination: {
          total: count,
          page: request.page,
          pageSize: request.pageSize,
          totalPages: Math.ceil(count / request.pageSize)
        }
      },
      status: 200
    }

  } catch (error) {
    logger.error({ message: 'Dashboard list error', error })
    return {
      response: 'Error listing dashboards',
      error: true,
      status: 500
    }
  }
}
