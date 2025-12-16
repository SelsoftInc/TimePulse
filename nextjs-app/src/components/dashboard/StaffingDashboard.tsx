import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, TrendingUp, TrendingDown, Users, DollarSign, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { API_BASE } from '@/config/api';
import { useAuth } from '../../contexts/AuthContext';
import ChartWidget from './ChartWidget';
import "./StaffingDashboard.css";

// Types
interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  client: string;
  weekEnding: string;
  hours: number;
  overtimeHours?: number;
  billRate: number;
  payRate: number;
  approved: boolean;
}

interface Invoice {
  id: string;
  client: string;
  employeeId: string;
  employeeName: string;
  period: string;
  issuedOn: string;
  dueOn: string;
  amount: number;
  status: "open" | "paid" | "overdue";
}

interface Employee {
  id: string;
  name: string;
  active: boolean;
}

interface ARAging {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
}

const StaffingDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Auth checks with safety - match your structure
  const currentUserId = user?.id || '';
  const currentUserRole = (user?.role as 'owner'|'admin'|'manager'|'employee') || 'employee';
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';
  
  // State
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd")});
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Scope control state - match your structure
  const [scope, setScope] = useState<'company' | 'employee'>(isAdmin ? 'company' : 'employee');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Helper function to build query string
  const buildQueryString = (params: Record<string, any>) => {
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return filtered ? `?${filtered}` : '';
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Match your exact parameter structure
        const from = dateRange.from ? format(new Date(dateRange.from), 'yyyy-MM-dd') : undefined;
        const to = dateRange.to ? format(new Date(dateRange.to), 'yyyy-MM-dd') : undefined;
        const q = searchTerm || undefined;
        const client = selectedClient !== '' ? selectedClient : undefined;

        const params = {
          from, to, client, q,
          scope,                                        // 'company' | 'employee'
          employeeId: scope === 'employee' ? selectedEmployeeId : undefined,
          excludeUserId: isAdmin ? currentUserId : undefined,    // hide the owner's own timesheets
        };

        const queryString = buildQueryString(params);

        const [timesheetsRes, invoicesRes, employeesRes] = await Promise.all([
          fetch(`${API_BASE}/timesheets${queryString}`),
          fetch(`${API_BASE}/invoices${queryString}`),
          fetch(`${API_BASE}/employees`),
        ]);

        const [timesheetsData, invoicesData, employeesData] = await Promise.all([
          timesheetsRes.json(),
          invoicesRes.json(),
          employeesRes.json(),
        ]);

        setTimesheets(timesheetsData.timesheets || timesheetsData || []);
        setInvoices(invoicesData.invoices || invoicesData || []);
        setEmployees(employeesData.employees || employeesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, selectedClient, searchTerm, scope, selectedEmployeeId, isAdmin, currentUserId]);

  // Computed values
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter(ts => 
      ts.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ts.client.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [timesheets, searchTerm]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const totalRevenue = useMemo(() => {
    return filteredInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [filteredInvoices]);

  const totalCost = useMemo(() => {
    return filteredTimesheets
      .filter(ts => ts.approved)
      .reduce((sum, ts) => {
        const regularCost = ts.hours * ts.payRate;
        const overtimeCost = (ts.overtimeHours || 0) * ts.payRate * 1.5;
        return sum + regularCost + overtimeCost;
      }, 0);
  }, [filteredTimesheets]);

  const margin = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  const arAging: ARAging = useMemo(() => {
    const now = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };

    filteredInvoices
      .filter(inv => inv.status === "open" || inv.status === "overdue")
      .forEach(inv => {
        const dueDate = new Date(inv.dueOn);
        const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 0) aging.current += inv.amount;
        else if (daysDiff <= 30) aging.days30 += inv.amount;
        else if (daysDiff <= 60) aging.days60 += inv.amount;
        else if (daysDiff <= 90) aging.days90 += inv.amount;
        else aging.over90 += inv.amount;
      });

    return aging;
  }, [filteredInvoices]);

  const revenueByEmployee = useMemo(() => {
    const employeeRevenue: { [key: string]: { id: string; name: string; revenue: number; cost: number } } = {};

    filteredTimesheets
      .filter(ts => ts.approved)
      .forEach(ts => {
        if (!employeeRevenue[ts.employeeId]) {
          employeeRevenue[ts.employeeId] = { 
            id: ts.employeeId, 
            name: ts.employeeName, 
            revenue: 0, 
            cost: 0 
          };
        }
        
        const revenue = ts.hours * ts.billRate + (ts.overtimeHours || 0) * ts.billRate * 1.5;
        const cost = ts.hours * ts.payRate + (ts.overtimeHours || 0) * ts.payRate * 1.5;
        
        employeeRevenue[ts.employeeId].revenue += revenue;
        employeeRevenue[ts.employeeId].cost += cost;
      });

    return Object.values(employeeRevenue).sort((a, b) => b.revenue - a.revenue);
  }, [filteredTimesheets]);

  // Drill-down functionality - match your structure
  const handleEmployeeClick = (employeeId: string) => {
    setScope('employee');
    setSelectedEmployeeId(employeeId);
  };

  // Chart drill-down handler
  const handleChartClick = (data: any) => {
    const payload = data?.activePayload?.[0]?.payload;
    if (payload?.id) {
      setScope('employee');
      setSelectedEmployeeId(payload.id);
    }
  };

  const monthlyData = useMemo(() => {
    const months = [];
    const revenue = [];
    const cost = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = format(date, "MMM");
      months.push(monthName);

      const monthRevenue = filteredInvoices
        .filter(inv => {
          const invDate = new Date(inv.issuedOn);
          return inv.status === "paid" && 
                 invDate.getMonth() === date.getMonth() && 
                 invDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      const monthCost = filteredTimesheets
        .filter(ts => {
          const tsDate = new Date(ts.weekEnding);
          return ts.approved && 
                 tsDate.getMonth() === date.getMonth() && 
                 tsDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, ts) => {
          const regularCost = ts.hours * ts.payRate;
          const overtimeCost = (ts.overtimeHours || 0) * ts.payRate * 1.5;
          return sum + regularCost + overtimeCost;
        }, 0);

      revenue.push(monthRevenue);
      cost.push(monthCost);
    }

    return { months, revenue, cost };
  }, [filteredInvoices, filteredTimesheets]);

  // Utility functions
  const currency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"}).format(amount);
  };

  const downloadCSV = (filename: string, data: any[]) => {
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clients = useMemo(() => {
    const clientSet = new Set([
      ...timesheets.map(ts => ts.client),
      ...invoices.map(inv => inv.client)
    ]);
    return Array.from(clientSet).sort();
  }, [timesheets, invoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safety check for user object
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Please log in to view the dashboard</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {scope === 'company' 
              ? 'Monitor your staffing business performance' 
              : selectedEmployeeId 
                ? `Viewing data for ${employees.find(e => e && e.id === selectedEmployeeId)?.name || 'selected employee'}`
                : 'Choose an employee to view detailed status'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Scope Control - match your exact structure */}
          <div className="inline-flex rounded-xl border overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm ${
                scope === 'company' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setScope('company')}
            >
              Company
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${
                scope === 'employee' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setScope('employee')}
            >
              Employee
            </button>
          </div>

          {/* Employee Select - only when Employee scope */}
          {scope === 'employee' && (
            <div className="relative">
              <button
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                className="flex items-center justify-between w-[240px] px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                disabled={scope !== 'employee'}
              >
                <span className="text-sm">
                  {selectedEmployeeId 
                    ? (employees.find(e => e && e.id === selectedEmployeeId)?.name || 'Choose employee...')
                    : 'Choose employee...'
                  }
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showEmployeeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  {employees.filter(e => e && e.active).map(employee => (
                    <button
                      key={employee.id}
                      onClick={() => {
                        setSelectedEmployeeId(employee.id);
                        setShowEmployeeDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{employee.name || 'Unknown Employee'}</span>
                      {selectedEmployeeId === employee.id && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Filters */}
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Timesheet Status - Moved to top */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Timesheet Status</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600">Total Timesheets</p>
            <p className="text-2xl font-bold text-blue-900">{filteredTimesheets.length}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-900">
              {filteredTimesheets.filter(ts => ts.approved).length}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">
              {filteredTimesheets.filter(ts => !ts.approved).length}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-600">Total Hours</p>
            <p className="text-2xl font-bold text-purple-900">
              {filteredTimesheets.reduce((sum, ts) => sum + ts.hours + (ts.overtimeHours || 0), 0).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{currency(totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+12.5%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">{currency(totalCost)}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            <span className="text-red-600">+8.2%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Margin</p>
              <p className="text-2xl font-bold text-gray-900">{currency(margin)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-purple-600 font-medium">{marginPercent.toFixed(1)}%</span>
            <span className="text-gray-500 ml-1">margin</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.filter(e => e.active).length}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-indigo-600 mr-1" />
            <span className="text-indigo-600">+2 this month</span>
            <span className="text-gray-500 ml-1">new hires</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Cost by Employee</h3>
          {revenueByEmployee.length > 0 ? (
            <ChartWidget
              type="bar"
              data={[
                {
                  label: "Revenue",
                  data: revenueByEmployee.map(emp => emp.revenue || 0),
                  color: "#10b981"
                },
                {
                  label: "Cost",
                  data: revenueByEmployee.map(emp => emp.cost || 0),
                  color: "#ef4444"
                }
              ]}
              labels={revenueByEmployee.map(emp => emp.name || 'Unknown')}
              height={300}
              showLegend={true}
              onClick={handleChartClick}
              employeeData={revenueByEmployee}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Margin Trend</h3>
          {monthlyData.revenue.length > 0 ? (
            <ChartWidget
              type="line"
              data={[
                {
                  label: "Revenue",
                  data: monthlyData.revenue,
                  color: "#3b82f6"
                },
                {
                  label: "Margin",
                  data: monthlyData.revenue.map((rev, i) => (rev || 0) - (monthlyData.cost[i] || 0)),
                  color: "#8b5cf6"
                }
              ]}
              labels={monthlyData.months}
              height={300}
              showLegend={true}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* A/R Aging */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">A/R Aging</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Current</p>
            <p className="text-xl font-bold text-green-600">{currency(arAging.current)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">1-30 Days</p>
            <p className="text-xl font-bold text-yellow-600">{currency(arAging.days30)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">31-60 Days</p>
            <p className="text-xl font-bold text-orange-600">{currency(arAging.days60)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">61-90 Days</p>
            <p className="text-xl font-bold text-red-600">{currency(arAging.days90)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">90+ Days</p>
            <p className="text-xl font-bold text-red-800">{currency(arAging.over90)}</p>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timesheets */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Timesheets</h3>
              <button
                onClick={() => {
                  const rows = filteredTimesheets.map(ts => ({
                    Employee: ts.employeeName,
                    Client: ts.client,
                    "Week Ending": format(new Date(ts.weekEnding), "MMM d, yyyy"),
                    Hours: ts.hours + (ts.overtimeHours ? ` (+${ts.overtimeHours} OT)` : ""),
                    "Bill Rate": ts.billRate,
                    "Pay Rate": ts.payRate,
                    Revenue: ts.hours * ts.billRate + (ts.overtimeHours || 0) * ts.billRate * 1.5,
                    Approved: ts.approved ? "Yes" : "No"
                  }));
                  downloadCSV('timesheets.csv', rows);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Week Ending</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimesheets.slice(0, 8).map(ts => {
                  const rev = ts.hours * ts.billRate + (ts.overtimeHours || 0) * ts.billRate * 1.5;
                  return (
                    <tr key={ts.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{ts.employeeName}</td>
                      <td className="p-4">{ts.client}</td>
                      <td className="p-4">{format(new Date(ts.weekEnding), "MMM d, yyyy")}</td>
                      <td className="p-4">{ts.hours}{ts.overtimeHours ? ` (+${ts.overtimeHours} OT)` : ""}</td>
                      <td className="p-4 font-medium">{currency(rev)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ts.approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {ts.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
              <button
                onClick={() => {
                  const rows = filteredInvoices.map(inv => ({
                    Client: inv.client,
                    Employee: inv.employeeName,
                    Period: inv.period,
                    Amount: inv.amount,
                    "Issued On": format(new Date(inv.issuedOn), "MMM d, yyyy"),
                    "Due On": format(new Date(inv.dueOn), "MMM d, yyyy"),
                    Status: inv.status
                  }));
                  downloadCSV('invoices.csv', rows);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="p-4">Client</th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Due</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.slice(0, 8).map(inv => (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{inv.client}</td>
                    <td className="p-4">{inv.employeeName}</td>
                    <td className="p-4">{inv.period}</td>
                    <td className="p-4 font-medium">{currency(inv.amount)}</td>
                    <td className="p-4">{format(new Date(inv.dueOn), "MMM d")}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : 
                        inv.status === "open" ? "bg-blue-50 text-blue-700" : 
                        "bg-rose-50 text-rose-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffingDashboard;
