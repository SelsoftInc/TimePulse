const express = require("express");
const router = express.Router();
const {
  withTenant,
  withTenantAndEmployee,
  getCompanyKPIs,
  getEmployeeKPIs,
  getARAging,
  getRevenueByEmployee,
  getRevenueTrend,
  prisma,
} = require("../db/prisma");

// GET /api/dashboard-prisma - Main dashboard data with Company/Employee scope
router.get("/", async (req, res) => {
  try {
    const { scope = "company", employeeId, from, to, tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    if (scope === "employee" && !employeeId) {
      return res
        .status(400)
        .json({ error: "Employee ID required for employee scope" });
    }

    // Execute queries in parallel with proper tenant context
    const [
      kpisResult,
      arAgingResult,
      revenueByEmployeeResult,
      revenueTrendResult,
    ] = await Promise.all([
      // KPIs based on scope
      scope === "employee"
        ? withTenantAndEmployee(tenantId, employeeId, () =>
            getEmployeeKPIs(tenantId, employeeId, from, to)
          )
        : withTenant(tenantId, () => getCompanyKPIs(tenantId, from, to)),

      // AR Aging (company scope only)
      scope === "company"
        ? withTenant(tenantId, () => getARAging(tenantId, from, to))
        : Promise.resolve([
            { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 },
          ]),

      // Revenue by Employee (company scope only)
      scope === "company"
        ? withTenant(tenantId, () => getRevenueByEmployee(tenantId, from, to))
        : Promise.resolve([]),

      // Revenue Trend
      withTenant(tenantId, () => getRevenueTrend(tenantId, from, to)),
    ]);

    // Helper function to convert BigInt to number and Date to string
    const convertBigInt = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return Number(obj);
      if (obj instanceof Date) return obj.toISOString().split("T")[0]; // Convert to YYYY-MM-DD
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (typeof obj === "object") {
        // Check if it's a Date-like object (has getTime method)
        if (obj.getTime && typeof obj.getTime === "function") {
          return new Date(obj).toISOString().split("T")[0];
        }
        // Check if it's a Prisma date object with specific structure
        if (obj.constructor && obj.constructor.name === "Date") {
          return obj.toISOString().split("T")[0];
        }
        // Check if it's an object with date-like properties
        if (
          obj.year !== undefined &&
          obj.month !== undefined &&
          obj.day !== undefined
        ) {
          return `${obj.year}-${String(obj.month).padStart(2, "0")}-${String(
            obj.day
          ).padStart(2, "0")}`;
        }
        // Handle Decimal objects from Prisma
        if (obj.constructor && obj.constructor.name === "Decimal") {
          return Number(obj.toString());
        }
        // Handle Prisma Decimal objects with s, e, d structure
        if (obj.s !== undefined && obj.e !== undefined && obj.d !== undefined) {
          return Number(obj.toString());
        }
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertBigInt(value);
        }
        return converted;
      }
      return obj;
    };

    // Format response
    const response = {
      scope,
      employeeId: scope === "employee" ? employeeId : null,
      dateRange: {
        from: from || null,
        to: to || null,
      },
      kpis: convertBigInt(kpisResult[0] || {}),
      arAging:
        scope === "company" ? convertBigInt(arAgingResult[0] || {}) : null,
      revenueByEmployee:
        scope === "company" ? convertBigInt(revenueByEmployeeResult) : null,
      revenueTrend: convertBigInt(revenueTrendResult),
    };

    res.json(response);
  } catch (error) {
    console.error("Dashboard Prisma API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/dashboard-prisma/employees - Get employees for dropdown
router.get("/employees", async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    const employees = await withTenant(tenantId, async () => {
      return prisma.employees.findMany({
        where: {
          tenant_id: tenantId,
          status: "active",
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          department: true,
          title: true,
          status: true,
        },
        orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
      });
    });

    // Format the response to match the expected structure
    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email,
      department: emp.department,
      title: emp.title,
      status: emp.status,
    }));

    res.json({ employees: formattedEmployees });
  } catch (error) {
    console.error("Dashboard Employees Prisma API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/dashboard-prisma/refresh - Refresh materialized view (admin only)
router.post("/refresh", async (req, res) => {
  try {
    // Check if user is admin (you might want to add proper auth middleware)
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await withTenant(tenantId, async () => {
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW mv_staffing_daily`;
    });

    res.json({ message: "Materialized view refreshed successfully" });
  } catch (error) {
    console.error("Refresh Materialized View Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
