const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ImplementationPartner = sequelize.define(
    "ImplementationPartner",
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
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      legalName: {
        type: DataTypes.STRING(255),
        field: "legal_name",
      },
      contactPerson: {
        type: DataTypes.STRING(255),
        field: "contact_person",
      },
      email: {
        type: DataTypes.STRING(255),
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      address: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      category: {
        type: DataTypes.STRING(50),
        defaultValue: "implementation_partner",
      },
      specialization: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "pending"),
        defaultValue: "active",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "implementation_partners",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["tenant_id", "name"],
        },
        {
          fields: ["tenant_id", "status"],
        },
      ],
    }
  );

  return ImplementationPartner;
};
