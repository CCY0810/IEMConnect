import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Event from "./Event.js";

/**
 * Feedback Model
 * Stores participant feedback for events they have attended.
 * One feedback per user per event is enforced by unique constraint.
 */
const Feedback = sequelize.define(
  "Feedback",
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
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "events",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "feedback",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "event_id"],
        name: "unique_user_event_feedback",
      },
      {
        fields: ["event_id"],
        name: "idx_feedback_event_id",
      },
      {
        fields: ["user_id"],
        name: "idx_feedback_user_id",
      },
      {
        fields: ["created_at"],
        name: "idx_feedback_created_at",
      },
      {
        fields: ["rating"],
        name: "idx_feedback_rating",
      },
    ],
  }
);

// Define associations
Feedback.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Feedback.belongsTo(Event, {
  foreignKey: "event_id",
  as: "event",
});

export default Feedback;
