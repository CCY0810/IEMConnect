/**
 * AdminInvite Model
 * Tracks admin invitation tokens for secure admin registration
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AdminInvite = sequelize.define(
  "AdminInvite",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    used_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "admin_invites",
    timestamps: true,
  }
);

export default AdminInvite;
