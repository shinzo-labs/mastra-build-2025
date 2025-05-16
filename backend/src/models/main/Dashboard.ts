import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { dbClient } from "../../dbClient"
import { User } from "./User"

export class Dashboard extends CommonModel {
  public owner_uuid!: string
  public name!: string
  public stars_count!: number
  public visibility!: 'private' | 'public'
  public execution_count!: number
}

Dashboard.init(
  {
    ...commonFields,
    owner_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'uuid'
      }
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    stars_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    visibility: {
      type: DataTypes.STRING(7),
      allowNull: false,
      validate: {
        isIn: [['private', 'public']]
      }
    },
    execution_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: "dashboard",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)
