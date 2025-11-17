import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    director_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    director_matric: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    director_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    director_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    targeted_participants: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Upcoming", "Open", "Completed"),
      defaultValue: "Upcoming",
    },
    poster_file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paperwork_file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attendance_code: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    attendance_status: {
      type: DataTypes.ENUM("Pending", "Active", "Closed"),
      defaultValue: "Pending",
      allowNull: false,
    },
    attendance_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attendance_stopped_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "events",
    timestamps: true,
    underscored: true,
  }
);

export default Event;
