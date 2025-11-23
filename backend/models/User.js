import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("member", "admin"),
      defaultValue: "member",
    },
    membership_number: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    // New profile fields
    matric_number: {
      type: DataTypes.STRING(9),
      allowNull: false,
    },
    faculty: {
      type: DataTypes.ENUM(
        "Azman Hashim International Business School (AHIBS)",
        "Faculty of Artificial Intelligence (FAI)",
        "Faculty of Built Environment and Surveying",
        "Faculty of Chemical & Energy Engineering",
        "Faculty of Computing",
        "Faculty of Educational Sciences and Technology (FEST)",
        "Faculty of Electrical Engineering",
        "Faculty of Management",
        "Faculty of Mechanical Engineering",
        "Faculty of Science",
        "Faculty of Social Sciences and Humanities",
        "Malaysia-Japan International Institute of Technology (MJIIT)"
      ),
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    two_fa_code_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    two_fa_code_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    // IMPORTANT: Indexes are defined here for documentation/reference only
    // They should NOT be auto-created by Sequelize
    // All indexes must be created via SQL migrations to prevent duplicates
    indexes: [
      {
        unique: true,
        fields: ["email"],
        name: "unique_email",
        // Prevent Sequelize from trying to create this automatically
        // The index should already exist in the database via migration
      },
      {
        unique: true,
        fields: ["matric_number"],
        name: "unique_matric_number",
        // Prevent Sequelize from trying to create this automatically
        // The index should already exist in the database via migration
      },
    ],
    // Explicitly tell Sequelize not to modify the schema
    freezeTableName: true,
  }
);

export default User;
