import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import EventRegistration from "./EventRegistration.js";

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    registration_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "event_registrations",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    marked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    method: {
      type: DataTypes.ENUM("QR", "Code", "Manual"),
      allowNull: false,
    },
  },
  {
    tableName: "attendance",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["registration_id"],
        name: "unique_registration_attendance",
      },
    ],
  }
);

// Define associations
Attendance.belongsTo(EventRegistration, {
  foreignKey: "registration_id",
  as: "registration",
});

export default Attendance;
