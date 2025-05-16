import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { dbClient } from "../../dbClient"
import { User } from "./User"
import { Dashboard } from "./Dashboard"

export class UserStars extends CommonModel {
  public user_uuid!: string
  public dashboard_uuid!: string
}

UserStars.init(
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
    }
  },
  {
    tableName: "user_stars",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main',
    indexes: [
      {
        unique: true,
        fields: ['user_uuid', 'dashboard_uuid']
      }
    ]
  }
)
