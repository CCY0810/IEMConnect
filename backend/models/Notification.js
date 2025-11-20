import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "notifications",
    timestamps: false, // We're using created_at manually
    indexes: [
      {
        fields: ["user_id"],
        name: "idx_notifications_user_id",
      },
      {
        fields: ["created_at"],
        name: "idx_notifications_created_at",
      },
      {
        fields: ["user_id", "is_read"],
        name: "idx_notifications_user_read",
      },
    ],
  }
);

// Define associations
Notification.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

User.hasMany(Notification, {
  foreignKey: "user_id",
  as: "notifications",
});

export default Notification;

