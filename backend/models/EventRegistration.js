import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Event from "./Event.js";

const EventRegistration = sequelize.define(
  "EventRegistration",
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
    registration_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("registered", "cancelled", "attended"),
      defaultValue: "registered",
      allowNull: false,
    },
  },
  {
    tableName: "event_registrations",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "event_id"],
        name: "unique_user_event_registration",
      },
      {
        fields: ["event_id"],
      },
      {
        fields: ["user_id"],
      },
    ],
  }
);

// Define associations
EventRegistration.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

EventRegistration.belongsTo(Event, {
  foreignKey: "event_id",
  as: "event",
});

export default EventRegistration;
