/**
 * Database Models and Connection Setup
 * Using Sequelize ORM with PostgreSQL
 */

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Load database configuration based on environment
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const isLocal = env === 'development' || process.env.USE_LOCAL_DB === 'true';
  
  if (isLocal) {
    const localConfig = require('../config/database.local.js');
    return localConfig.development;
  } else {
    const remoteConfig = require('../config/database.remote.js');
    return remoteConfig[env] || remoteConfig.production;
  }
};

const dbConfig = getDbConfig();
console.log(`🔧 Using ${process.env.NODE_ENV === 'development' ? 'LOCAL' : 'REMOTE'} database configuration`);

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

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
  logo: {
    type: DataTypes.TEXT, // Store base64 encoded image
    allowNull: true
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
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
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
  // Removed clientId, vendorId, implPartnerId as these columns don't exist in current schema
  // clientId: {
  //   type: DataTypes.UUID,
  //   allowNull: true,
  //   field: 'client_id',
  //   references: {
  //     model: 'clients',
  //     key: 'id'
  //   }
  // },
  // vendorId: {
  //   type: DataTypes.UUID,
  //   allowNull: true,
  //   field: 'vendor_id',
  //   references: {
  //     model: 'vendors',
  //     key: 'id'
  //   }
  // },
  // implPartnerId: {
  //   type: DataTypes.UUID,
  //   allowNull: true,
  //   field: 'impl_partner_id',
  //   references: {
  //     model: 'vendors',
  //     key: 'id'
  //   }
  // },
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
  clientType: {
    type: DataTypes.STRING(20),
    defaultValue: 'external',
    field: 'client_type',
    validate: {
      isIn: [['internal', 'external']]
    }
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
// Removed client association as client_id column doesn't exist in current schema
// models.Employee.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });

// Client associations
models.Client.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// =============================================
// VENDOR MODEL
// =============================================
models.Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    references: { model: 'tenants', key: 'id' }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING(255),
    field: 'contact_person'
  },
  email: {
    type: DataTypes.STRING(255),
    validate: { isEmail: true },
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
  },
  status: {
    type: DataTypes.ENUM('active','inactive','pending'),
    defaultValue: 'active'
  },
  totalSpent: {
    type: DataTypes.DECIMAL(12,2),
    defaultValue: 0,
    field: 'total_spent'
  },
  address: { type: DataTypes.STRING(255) },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  zip: { type: DataTypes.STRING(20) },
  country: { type: DataTypes.STRING(100) },
  website: { type: DataTypes.STRING(255) },
  paymentTerms: { type: DataTypes.STRING(50), field: 'payment_terms' },
  contractStart: { type: DataTypes.DATEONLY, field: 'contract_start' },
  contractEnd: { type: DataTypes.DATEONLY, field: 'contract_end' },
  notes: { type: DataTypes.TEXT }
}, {
  tableName: 'vendors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Vendor associations (added after model definition)
models.Tenant.hasMany(models.Vendor, { foreignKey: 'tenantId', as: 'vendors' });
models.Vendor.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
// Removed Employee-Vendor associations as vendor columns don't exist in current schema
// models.Employee.belongsTo(models.Vendor, { foreignKey: 'vendorId', as: 'vendor' });
// models.Employee.belongsTo(models.Vendor, { foreignKey: 'implPartnerId', as: 'implPartner' });

// =============================================
// TIMESHEET MODEL
// =============================================
models.Timesheet = sequelize.define('Timesheet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
    references: { model: 'tenants', key: 'id' }
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
    references: { model: 'employees', key: 'id' }
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'client_id',
    references: { model: 'clients', key: 'id' }
  },
  weekStart: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'week_start'
  },
  weekEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'week_end'
  },
  dailyHours: {
    // { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
    type: DataTypes.JSONB,
    defaultValue: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    field: 'daily_hours'
  },
  totalHours: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 0,
    field: 'total_hours'
  },
  status: {
    type: DataTypes.ENUM('draft','submitted','approved','rejected'),
    defaultValue: 'draft'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'submitted_at'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at'
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reviewer_id',
    references: { model: 'users', key: 'id' }
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
    references: { model: 'users', key: 'id' }
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  }
}, {
  tableName: 'timesheets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['tenant_id','employee_id','week_start','week_end'] }
  ]
});

// Onboarding Log associations
models.OnboardingLog.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Timesheet associations
models.Tenant.hasMany(models.Timesheet, { foreignKey: 'tenantId', as: 'timesheets' });
models.Employee.hasMany(models.Timesheet, { foreignKey: 'employeeId', as: 'timesheets' });
models.Client.hasMany(models.Timesheet, { foreignKey: 'clientId', as: 'timesheets' });
models.Timesheet.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
models.Timesheet.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
models.Timesheet.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
models.Timesheet.belongsTo(models.User, { foreignKey: 'reviewerId', as: 'reviewer' });
models.Timesheet.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });

// =============================================
// DATABASE CONNECTION AND SYNC
// =============================================

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // For development, sync database schema (disabled to use existing schema)
    if (false && process.env.NODE_ENV === 'development') {
      try {
        // Drop dependent views before sync
        await sequelize.query('DROP VIEW IF EXISTS tenant_dashboard CASCADE;');
        console.log('🔄 Dropped dependent views for sync.');
      } catch (viewError) {
        console.log('ℹ️ No views to drop or already dropped.');
      }
      
      // Use force: false and alter: false for safer sync
      // This will create tables if they don't exist but won't alter existing ones
      await sequelize.sync({ force: false, alter: false });
      console.log('📊 Database models synchronized.');
      
      // Recreate views after sync
      try {
        await sequelize.query(`
          CREATE OR REPLACE VIEW tenant_dashboard AS
          SELECT 
              t.id,
              t.tenant_name,
              t.subdomain,
              COUNT(DISTINCT u.id) as total_users,
              COUNT(DISTINCT e.id) as total_employees,
              COUNT(DISTINCT c.id) as total_clients
          FROM tenants t
          LEFT JOIN users u ON t.id = u.tenant_id
          LEFT JOIN employees e ON t.id = e.tenant_id
          LEFT JOIN clients c ON t.id = c.tenant_id
          GROUP BY t.id, t.tenant_name, t.subdomain;
        `);
        console.log('🔄 Recreated tenant_dashboard view.');
      } catch (viewError) {
        console.log('⚠️ Could not recreate views:', viewError.message);
      }
    } else {
      console.log('📊 Using existing database schema (sync disabled for production).');
    }
    
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
