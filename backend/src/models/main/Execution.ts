import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { dbClient } from "../../dbClient"
import { User } from "./User"
import { Dashboard } from "./Dashboard"

export class Execution extends CommonModel {
  public user_uuid!: string
  public dashboard_uuid!: string
  public blockchain!: string
  public signed_data_payload!: any
  public gas_used!: number
  public status!: 'pending' | 'completed' | 'failed'
}

Execution.init(
  {
    ...commonFields,
    user_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'uuid'
      }
    },
    dashboard_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Dashboard,
        key: 'uuid'
      }
    },
    blockchain: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    signed_data_payload: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    gas_used: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(9),
      allowNull: false,
      validate: {
        isIn: [['pending', 'completed', 'failed']]
      }
    }
  },
  {
    tableName: "execution",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)
