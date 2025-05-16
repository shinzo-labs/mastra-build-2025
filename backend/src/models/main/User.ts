import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { dbClient } from "../../dbClient"

export class User extends CommonModel {
  public wallet_address!: string
  public last_active!: Date
  public login_message!: string
  public login_signature!: string
}

User.init(
  {
    ...commonFields,
    wallet_address: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    last_active: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    login_message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    login_signature: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "user",
    sequelize: dbClient,
    timestamps: false,
    schema: 'main'
  }
)
