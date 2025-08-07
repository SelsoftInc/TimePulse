/**
 * Database Models and Connection Setup
 * Using Sequelize ORM with PostgreSQL
 */

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Database connection configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'timepulse_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Define Models
const models = {};

// =============================================
// TENANT MODEL
// =============================================
models.Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'tenant_name'
  },
  legalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'legal_name'
  },
  subdomain: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  contactAddress: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'contact_address'
  },
  invoiceAddress: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'invoice_address'
  },
  contactInfo: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'contact_info'
  },
  taxInfo: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'tax_info'
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  onboardedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'onboarded_at'
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// =============================================
// USER MODEL
// =============================================
models.User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'must_change_password'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'employee', 'accountant', 'hr'),
    defaultValue: 'employee'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  department: {
    type: DataTypes.STRING(100)
  },
  title: {
    type: DataTypes.STRING(100)
  },
  managerId: {
    type: DataTypes.UUID,
    field: 'manager_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'email']
    }
  ]
});

// =============================================
// EMPLOYEE MODEL
// =============================================
models.Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  employeeId: {
    type: DataTypes.STRING(50),
    field: 'employee_id'
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name'
  },
  email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  department: {
    type: DataTypes.STRING(100)
  },
  title: {
    type: DataTypes.STRING(100)
  },
  managerId: {
    type: DataTypes.UUID,
    field: 'manager_id',
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date'
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'hourly_rate'
  },
  salaryAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'salary_amount'
  },
  salaryType: {
    type: DataTypes.ENUM('hourly', 'salary', 'contract'),
    defaultValue: 'hourly',
    field: 'salary_type'
  },
  contactInfo: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'contact_info'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated'),
    defaultValue: 'active'
  }
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'employee_id'],
      where: {
        employee_id: {
          [Sequelize.Op.ne]: null
        }
      }
    }
  ]
});

// =============================================
// CLIENT MODEL
// =============================================
models.Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  clientName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'client_name'
  },
  legalName: {
    type: DataTypes.STRING(255),
    field: 'legal_name'
  },
  contactPerson: {
    type: DataTypes.STRING(255),
    field: 'contact_person'
  },
  email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(50)
  },
  billingAddress: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'billing_address'
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'shipping_address'
  },
  taxId: {
    type: DataTypes.STRING(50),
    field: 'tax_id'
  },
  paymentTerms: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    field: 'payment_terms'
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'hourly_rate'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// =============================================
// ONBOARDING LOG MODEL
// =============================================
models.OnboardingLog = sequelize.define('OnboardingLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  sourceFile: {
    type: DataTypes.STRING(255),
    field: 'source_file'
  },
  onboardingData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'onboarding_data'
  },
  usersCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'users_created'
  },
  employeesCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'employees_created'
  },
  clientsCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'clients_created'
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'failed'),
    defaultValue: 'completed'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message'
  }
}, {
  tableName: 'onboarding_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// =============================================
// ASSOCIATIONS
// =============================================

// Tenant associations
models.Tenant.hasMany(models.User, { foreignKey: 'tenantId', as: 'users' });
models.Tenant.hasMany(models.Employee, { foreignKey: 'tenantId', as: 'employees' });
models.Tenant.hasMany(models.Client, { foreignKey: 'tenantId', as: 'clients' });
models.Tenant.hasMany(models.OnboardingLog, { foreignKey: 'tenantId', as: 'onboardingLogs' });

// User associations
models.User.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
models.User.belongsTo(models.User, { foreignKey: 'managerId', as: 'manager' });
models.User.hasMany(models.User, { foreignKey: 'managerId', as: 'subordinates' });

// Employee associations
models.Employee.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
models.Employee.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
models.Employee.belongsTo(models.Employee, { foreignKey: 'managerId', as: 'manager' });
models.Employee.hasMany(models.Employee, { foreignKey: 'managerId', as: 'subordinates' });

// Client associations
models.Client.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Onboarding Log associations
models.OnboardingLog.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// =============================================
// DATABASE CONNECTION AND SYNC
// =============================================

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Skip auto-sync since schema is already applied
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: true });
    //   console.log('📊 Database models synchronized.');
    // }
    
    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// =============================================
// TENANT CONTEXT HELPER
// =============================================

const setTenantContext = (tenantId) => {
  return sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);
};

const getTenantBySubdomain = async (subdomain) => {
  return await models.Tenant.findOne({
    where: { subdomain },
    include: [
      {
        model: models.User,
        as: 'users',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
      },
      {
        model: models.Employee,
        as: 'employees',
        attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'title', 'status']
      }
    ]
  });
};

// =============================================
// EXPORTS
// =============================================

module.exports = {
  sequelize,
  models,
  connectDB,
  setTenantContext,
  getTenantBySubdomain,
  Sequelize
};
