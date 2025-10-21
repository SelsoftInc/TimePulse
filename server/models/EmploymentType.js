const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const EmploymentType = sequelize.define(
    "EmploymentType",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "tenant_id",
        references: {
          model: "tenants",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "employment_types",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["tenant_id", "name"],
        },
        {
          fields: ["tenant_id"],
        },
      ],
    }
  );

  return EmploymentType;
};
