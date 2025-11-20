import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  extractTimesheetData,
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice,
} from "../../services/engineService";
import {
  validateExtractedData,
} from "../../services/timesheetExtractor";
import { API_BASE } from "../../config/api";
import axios from "axios";
import OvertimeConfirmationModal from "./OvertimeConfirmationModal";
import "./Timesheet.css";

const TimesheetSubmit = () => {
  const { subdomain, weekId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isEmployee, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [week, setWeek] = useState("");
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [clientHours, setClientHours] = useState([]);
  const [holidayHours, setHolidayHours] = useState({
    holiday: Array(7).fill(0),
    timeOff: Array(7).fill(0),
  });
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState([]); // Local files to upload
  const [uploadedFiles, setUploadedFiles] = useState([]); // Files already uploaded to S3
  const [uploadingFiles, setUploadingFiles] = useState([]); // Files currently uploading
  const [previewImages, setPreviewImages] = useState([]);

  // AI Processing state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProcessedData, setAiProcessedData] = useState(null);
  const [showAiUpload, setShowAiUpload] = useState(false);
  const [uploadedAiFile, setUploadedAiFile] = useState(null);

  // Auto-conversion state
  const [autoConvertToInvoice, setAutoConvertToInvoice] = useState(true);
  const [conversionProcessing, setConversionProcessing] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Employee selection for non-employee roles
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // Approver/Reviewer selection
  const [selectedApprover, setSelectedApprover] = useState("");
  const [availableApprovers, setAvailableApprovers] = useState([]);

  // External timesheet file state (for external clients)
  const [externalTimesheetFile, setExternalTimesheetFile] = useState(null);

  // Overtime confirmation state
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeDays, setOvertimeDays] = useState([]);
  const [overtimeComment, setOvertimeComment] = useState("");

  // Camera capture state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  // Function to determine current client type based on clients with hours
  const getCurrentClientType = () => {
    // Always show internal form (full timesheet table) for all users
    // This ensures consistent UI across all employees
    return "internal";
  };

  const clientType = getCurrentClientType();
  console.log(
    "📊 Current clientType:",
    clientType,
    "clientHours:",
    clientHours.length
  );

  // Mock data removed - using clientHours state instead

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      setIsMobile(
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        )
      );
    };

    checkMobile();

    // Load timesheet data if weekId is provided
    const loadTimesheetData = async () => {
      setLoading(true);
      try {
        // Fetch real client data from API
        const tenantId = user?.tenantId;
        if (!tenantId) {
          console.error("No tenant ID found");
          return;
        }

        try {
          console.log("🔍 Fetching clients for tenantId:", tenantId);
          const response = await axios.get(
            `${API_BASE}/api/clients?tenantId=${tenantId}`
          );
          console.log(" Clients API response:", response.data);

          if (response.data.success && response.data.clients) {
            // Map clients from API response
            // Backend returns 'name' field, we need to map it to 'clientName' for display
            console.log(" User email:", user.email);

            let clientData = [];

            // Check if user is Selvakumar - show only Cognizant
            if (
              user.email === "selvakumar@selsoftinc.com" ||
              user.email.includes("selvakumar")
            ) {
              // Show only Cognizant
              const cognizant = response.data.clients.find(
                (c) => c.name === "Cognizant" || c.clientName === "Cognizant"
              );
              if (cognizant) {
                // Validate cognizant.id - only use if it's a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (cognizant.id && uuidRegex.test(cognizant.id)) {
                  // Use 'name' field from API and map to 'clientName'
                  clientData = [
                    {
                      id: cognizant.id,
                      clientName: cognizant.name || "Cognizant", // Fixed: use 'name' from API
                      project: (cognizant.name || "Cognizant") + " Project",
                      hourlyRate: cognizant.hourlyRate || 0,
                      clientType: cognizant.clientType || "internal",
                      hours: Array(7).fill(0),
                    },
                  ];
                } else {
                  console.warn(`⚠️ Cognizant client has invalid ID: "${cognizant.id}". Skipping.`);
                  clientData = [];
                }
                console.log(
                  " Showing only Cognizant for Selvakumar:",
                  clientData
                );
              } else {
                console.error(" Cognizant not found in clients list");
                console.error("Available clients:", response.data.clients);
                // Fallback to all clients
                // Validate client.id - only include if it's a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                clientData = response.data.clients
                  .filter((client) => client.id && uuidRegex.test(client.id))
                  .map((client) => ({
                    id: client.id,
                    clientName: client.name || "Unknown Client", // Fixed: use 'name' from API
                    project: (client.name || "Unknown") + " Project",
                    hourlyRate: client.hourlyRate || 0,
                    clientType: client.clientType || "internal",
                    hours: Array(7).fill(0),
                  }));
              }
            } else {
              // For other users, show all clients
              console.log(" Showing all clients for other users");
              // Validate client.id - only include if it's a valid UUID
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              clientData = response.data.clients
                .filter((client) => client.id && uuidRegex.test(client.id))
                .map((client) => ({
                  id: client.id,
                  clientName: client.name || "Unknown Client", // Fixed: use 'name' from API
                  project: (client.name || "Unknown") + " Project",
                  hourlyRate: client.hourlyRate || 0,
                  clientType: client.clientType || "internal",
                  hours: Array(7).fill(0),
                }));
            }

            console.log(" Final clientHours to be set:", clientData);
            setClientHours(clientData);
          } else {
            console.error(" Clients API returned no data");
          }
        } catch (error) {
          console.error("❌ Error fetching clients:", error);
          console.error(
            "Error details:",
            error.response?.data || error.message
          );
          // Fallback to empty array
          setClientHours([]);
        }

        // Load available employees for non-employee roles
        if (!isEmployee()) {
          try {
            console.log("🔍 Fetching employees...");
            const employeesResponse = await axios.get(
              `${API_BASE}/api/employees?tenantId=${tenantId}`
            );
            console.log("📥 Employees API response:", employeesResponse.data);

            if (
              employeesResponse.data.success &&
              employeesResponse.data.employees
            ) {
              // Filter out admin users - they don't submit timesheets
              const employees = employeesResponse.data.employees
                .filter((emp) => emp.role !== "admin")
                .map((emp) => ({
                  id: emp.id,
                  name: `${emp.firstName} ${emp.lastName}`,
                  email: emp.email,
                  department: emp.department || "N/A",
                  role: emp.role,
                }));
              setAvailableEmployees(employees);
              console.log(
                "✅ Loaded employees (excluding admins):",
                employees.length
              );
            } else {
              console.warn("⚠️ No employees found in response");
              setAvailableEmployees([]);
            }
          } catch (error) {
            console.error("❌ Error fetching employees:", error);
            setAvailableEmployees([]);
          }
        }

        // Load available approvers (admins and managers)
        try {
          console.log("🔍 Fetching approvers...");
          const approversResponse = await axios.get(
            `${API_BASE}/api/timesheets/reviewers?tenantId=${tenantId}`
          );
          console.log("📥 Approvers API response:", approversResponse.data);

          if (
            approversResponse.data.success &&
            approversResponse.data.reviewers
          ) {
            setAvailableApprovers(approversResponse.data.reviewers);
            console.log(
              "✅ Loaded approvers:",
              approversResponse.data.reviewers.length
            );
          }
        } catch (error) {
          console.error("❌ Error fetching approvers:", error);
        }

        // Generate available weeks dynamically
        const generateAvailableWeeks = () => {
          const weeks = [];
          const today = new Date();

          // Helper function to get the start of the week (Monday)
          const getWeekStart = (date) => {
            const weekStart = new Date(date);
            const dayOfWeek = date.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            weekStart.setDate(weekStart.getDate() + mondayOffset);
            weekStart.setHours(0, 0, 0, 0);
            return weekStart;
          };

          const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, "0");
            const month = date
              .toLocaleString("en-US", { month: "short" })
              .toUpperCase();
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
          };

          const currentWeekStart = getWeekStart(today);
          const earliestWeekStart = new Date(currentWeekStart);
          earliestWeekStart.setMonth(earliestWeekStart.getMonth() - 4);

          let cursor = new Date(currentWeekStart);
          while (cursor >= earliestWeekStart) {
            const weekStart = new Date(cursor);
            const weekEnd = new Date(cursor);
            weekEnd.setDate(weekStart.getDate() + 6);

            const weekValue = `${formatDate(weekStart)} To ${formatDate(
              weekEnd
            )}`;

            const weeksAgo = Math.round(
              (currentWeekStart.getTime() - weekStart.getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            );
            const isOld = weeksAgo > 4;

            weeks.push({
              value: weekValue,
              label: weekValue,
              status: isOld ? "completed" : "pending",
              readonly: isOld,
            });

            cursor.setDate(cursor.getDate() - 7);
          }

          return weeks.reverse(); // Most recent first (current week at top)
        };

        const mockAvailableWeeks = generateAvailableWeeks();

        setAvailableWeeks(mockAvailableWeeks);

        // If weekId is provided, load existing timesheet data from API
        if (weekId) {
          try {
            console.log('🔍 Loading timesheet by ID:', weekId);
            const response = await axios.get(`${API_BASE}/api/timesheets/${weekId}`, {
              params: { tenantId }
            });
            
            if (response.data.success && response.data.timesheet) {
              const ts = response.data.timesheet;
              console.log('✅ Loaded timesheet:', ts);
              
              // Set week range
              const weekRange = `${new Date(ts.weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} To ${new Date(ts.weekEnd).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
              setWeek(weekRange);
              setSelectedWeek(weekRange);
              
              // Set read-only based on status
              setIsReadOnly(ts.status === 'approved' || ts.status === 'rejected');
              
              // Set notes
              if (ts.notes) setNotes(ts.notes);
              
              // Load attachments from timesheet
              if (ts.attachments && Array.isArray(ts.attachments) && ts.attachments.length > 0) {
                setUploadedFiles(ts.attachments);
              } else if (ts.attachments && typeof ts.attachments === 'string') {
                try {
                  const parsed = JSON.parse(ts.attachments);
                  if (Array.isArray(parsed)) {
                    setUploadedFiles(parsed);
                  }
                } catch (e) {
                  console.error('Error parsing attachments:', e);
                }
              }
              
              // Load daily hours if available
              if (ts.dailyHours) {
                console.log('📊 Loading dailyHours:', ts.dailyHours);
                
                // Parse dailyHours and populate clientHours
                const parsedHours = typeof ts.dailyHours === 'string' 
                  ? JSON.parse(ts.dailyHours) 
                  : ts.dailyHours;
                
                console.log('📊 Parsed hours:', parsedHours);
                
                // Check if parsedHours is in the format { mon: X, tue: Y, ... }
                const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                const isDailyFormat = daysOfWeek.some(day => parsedHours.hasOwnProperty(day));
                
                if (isDailyFormat) {
                  // Format: { mon: 8, tue: 8, wed: 8, ... }
                  // Convert to array format for display
                  const hoursArray = daysOfWeek.map(day => parseFloat(parsedHours[day] || 0));
                  console.log('📊 Hours array:', hoursArray);
                  
                  // If we have client data, update it; otherwise create a default client entry
                  if (clientHours.length > 0) {
                    const updatedClientHours = clientHours.map((client, index) => {
                      if (index === 0) {
                        // Update first client with the hours
                        return { ...client, hours: hoursArray };
                      }
                      return client;
                    });
                    setClientHours(updatedClientHours);
                  } else {
                    // Create a default client entry with the hours
                    // Validate clientId - only use if it's a valid UUID
                    let validClientId = null;
                    if (ts.clientId) {
                      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                      if (uuidRegex.test(ts.clientId)) {
                        validClientId = ts.clientId;
                      }
                    }
                    setClientHours([{
                      id: validClientId,
                      clientId: validClientId,
                      clientName: ts.client?.clientName || 'Client',
                      hours: hoursArray
                    }]);
                  }
                } else {
                  // Format: { "clientName": { hours: [...], clientId: "..." }, ... }
                  // Update client hours with loaded data
                  if (clientHours.length > 0) {
                    const updatedClientHours = clientHours.map(client => {
                      const clientKey = Object.keys(parsedHours).find(key => 
                        key.includes(client.clientName) || parsedHours[key].clientId === client.id
                      );
                      if (clientKey && parsedHours[clientKey]) {
                        return {
                          ...client,
                          hours: parsedHours[clientKey].hours || Array(7).fill(0)
                        };
                      }
                      return client;
                    });
                    setClientHours(updatedClientHours);
                  } else {
                    // Create client entries from parsedHours
                    const newClientHours = Object.entries(parsedHours).map(([clientName, data]) => ({
                      id: data.clientId || clientName,
                      clientId: data.clientId || clientName,
                      clientName: clientName,
                      hours: data.hours || Array(7).fill(0)
                    }));
                    if (newClientHours.length > 0) {
                      setClientHours(newClientHours);
                    }
                  }
                }
              }
            } else {
              console.error('❌ Failed to load timesheet');
              toast.error('Failed to load timesheet data');
            }
          } catch (error) {
            console.error('❌ Error loading timesheet:', error);
            toast.error('Failed to load timesheet data');
          }
        } else {
          // Find and set current week from available weeks
          const currentWeek = mockAvailableWeeks.find((week) => {
            // Find the week that contains today's date
            const today = new Date();
            const [startStr, endStr] = week.value.split(" To ");

            // Parse start date
            const startParts = startStr.split("-");
            const startDate = new Date(
              parseInt(startParts[2]), // year
              new Date(Date.parse(startParts[1] + " 1, 2000")).getMonth(), // month
              parseInt(startParts[0]) // day
            );

            // Parse end date
            const endParts = endStr.split("-");
            const endDate = new Date(
              parseInt(endParts[2]), // year
              new Date(Date.parse(endParts[1] + " 1, 2000")).getMonth(), // month
              parseInt(endParts[0]) // day
            );

            return today >= startDate && today <= endDate;
          });

          if (currentWeek) {
            setWeek(currentWeek.value);
            setSelectedWeek(currentWeek.value);
            setIsReadOnly(currentWeek.readonly || false);
          } else {
            // Fallback to first available week if current week not found
            const firstWeek = mockAvailableWeeks[0];
            if (firstWeek) {
              setWeek(firstWeek.value);
              setSelectedWeek(firstWeek.value);
              setIsReadOnly(firstWeek.readonly || false);
            }
          }
        }
      } catch (error) {
        console.error("Error loading timesheet data:", error);
        toast.error("Failed to load timesheet data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTimesheetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId]); // Fixed: Only depend on weekId to avoid infinite loops

  // Navigate to previous week
  const navigateToPreviousWeek = async () => {
    if (!selectedWeek || !user?.tenantId) return;
    
    try {
      // Parse current week start date
      const [startStr] = selectedWeek.split(" To ");
      const startDate = parseWeekDate(startStr);
      
      // Calculate previous week (7 days before)
      const previousWeekDate = new Date(startDate);
      previousWeekDate.setDate(previousWeekDate.getDate() - 7);
      
      // Load timesheet for previous week using new API endpoint
      const employeeId = isEmployee() ? user.id : selectedEmployee;
      if (!employeeId) {
        toast.error("Please select an employee first");
        return;
      }
      
      const response = await axios.get(
        `${API_BASE}/api/timesheets/week/${previousWeekDate.toISOString().split('T')[0]}`,
        { params: { tenantId: user.tenantId, employeeId } }
      );
      
      if (response.data.success) {
        if (response.data.timesheet) {
          // Navigate to existing timesheet
          navigate(`/${subdomain}/timesheets/submit/${response.data.timesheet.id}`);
        } else {
          // New week - create week string and load
          const { weekStart, weekEnd } = response.data;
          const weekValue = `${formatWeekDate(weekStart)} To ${formatWeekDate(weekEnd)}`;
          await loadWeekTimesheet(weekValue);
        }
      }
    } catch (error) {
      console.error('Error navigating to previous week:', error);
      toast.error('Failed to load previous week');
    }
  };

  // Navigate to next week
  const navigateToNextWeek = async () => {
    if (!selectedWeek || !user?.tenantId) return;
    
    try {
      // Parse current week start date
      const [startStr] = selectedWeek.split(" To ");
      const startDate = parseWeekDate(startStr);
      
      // Calculate next week (7 days after)
      const nextWeekDate = new Date(startDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      
      // Load timesheet for next week using new API endpoint
      const employeeId = isEmployee() ? user.id : selectedEmployee;
      if (!employeeId) {
        toast.error("Please select an employee first");
        return;
      }
      
      const response = await axios.get(
        `${API_BASE}/api/timesheets/week/${nextWeekDate.toISOString().split('T')[0]}`,
        { params: { tenantId: user.tenantId, employeeId } }
      );
      
      if (response.data.success) {
        if (response.data.timesheet) {
          // Navigate to existing timesheet
          navigate(`/${subdomain}/timesheets/submit/${response.data.timesheet.id}`);
        } else {
          // New week - create week string and load
          const { weekStart, weekEnd } = response.data;
          const weekValue = `${formatWeekDate(weekStart)} To ${formatWeekDate(weekEnd)}`;
          await loadWeekTimesheet(weekValue);
        }
      }
    } catch (error) {
      console.error('Error navigating to next week:', error);
      toast.error('Failed to load next week');
    }
  };

  // Helper to format date for week display
  const formatWeekDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper to parse week date string
  const parseWeekDate = (dateStr) => {
    const parts = dateStr.split("-");
    const day = parseInt(parts[0]);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames.indexOf(parts[1]);
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  };

  // Load timesheet for a specific week
  const loadWeekTimesheet = async (weekValue) => {
    if (!weekValue || !user?.tenantId) return;
    
    setLoading(true);
    try {
      // Parse week dates
      const [startStr] = weekValue.split(" To ");
      const startDate = parseWeekDate(startStr);
      
      // Get timesheet for this week
      const employeeId = isEmployee() ? user.id : selectedEmployee;
      if (!employeeId) {
        toast.error("Please select an employee first");
        return;
      }
      
      const response = await axios.get(
        `${API_BASE}/api/timesheets/week/${startDate.toISOString().split('T')[0]}`,
        { params: { tenantId: user.tenantId, employeeId } }
      );
      
      if (response.data.success) {
        if (response.data.timesheet) {
          // Navigate to existing timesheet
          navigate(`/${subdomain}/timesheets/submit/${response.data.timesheet.id}`);
        } else {
          // New week - update selected week and clear form
          setSelectedWeek(weekValue);
          setWeek(weekValue);
          setClientHours(
            clientHours.map((client) => ({
              ...client,
              hours: Array(7).fill(0),
            }))
          );
          setHolidayHours({
            holiday: Array(7).fill(0),
            timeOff: Array(7).fill(0),
          });
          setNotes("");
          setUploadedFiles([]);
          setAttachments([]);
          setPreviewImages([]);
          setIsReadOnly(false);
        }
      }
    } catch (error) {
      console.error('Error loading week timesheet:', error);
      toast.error('Failed to load week timesheet');
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = async (selectedWeekValue) => {
    setSelectedWeek(selectedWeekValue);
    setWeek(selectedWeekValue);
    await loadWeekTimesheet(selectedWeekValue);

    // Clear AI processed data when week changes
    setAiProcessedData(null);
    setShowAiUpload(false);

    // Check if selected week is read-only
    const selectedWeekData = availableWeeks.find(
      (w) => w.value === selectedWeekValue
    );
    if (selectedWeekData && selectedWeekData.readonly) {
      setIsReadOnly(true);
    } else {
      setIsReadOnly(false);
    }
  };

  const handleClientHourChange = (clientIndex, dayIndex, value) => {
    const newClientHours = [...clientHours];
    newClientHours[clientIndex].hours[dayIndex] =
      value === "" ? 0 : Math.min(24, Math.max(0, parseFloat(value)));
    setClientHours(newClientHours);
  };

  const handleHolidayHourChange = (type, dayIndex, value) => {
    const newHolidayHours = { ...holidayHours };
    newHolidayHours[type] = [...newHolidayHours[type]];
    newHolidayHours[type][dayIndex] =
      value === "" ? 0 : Math.min(24, Math.max(0, parseFloat(value)));
    setHolidayHours(newHolidayHours);
  };

  const getTotalHoursForDay = (dayIndex) => {
    const clientTotal = clientHours.reduce(
      (sum, client) => sum + (client.hours[dayIndex] || 0),
      0
    );
    const holidayTotal =
      (holidayHours.holiday[dayIndex] || 0) +
      (holidayHours.timeOff[dayIndex] || 0);
    return clientTotal + holidayTotal;
  };

  const getTotalHoursForClient = (clientIndex) => {
    return (
      clientHours[clientIndex]?.hours.reduce(
        (sum, hours) => sum + (hours || 0),
        0
      ) || 0
    );
  };

  const getGrandTotal = () => {
    const clientTotal = clientHours.reduce(
      (sum, client) =>
        sum +
        client.hours.reduce((clientSum, hours) => clientSum + (hours || 0), 0),
      0
    );
    const holidayTotal =
      holidayHours.holiday.reduce((sum, hours) => sum + (hours || 0), 0) +
      holidayHours.timeOff.reduce((sum, hours) => sum + (hours || 0), 0);
    return clientTotal + holidayTotal;
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleCameraCapture = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    setShowCamera(false);
  };

  const handleFiles = async (files) => {
    const filesArray = Array.from(files);
    
    // Validate files first
    for (const file of filesArray) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 10MB`);
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "text/plain",
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Allowed: images, PDF, Word, Excel, CSV, TXT`);
        return;
      }
    }

    // If we have a timesheet ID, upload files to S3 immediately
    if (weekId) {
      await uploadFilesToS3(filesArray);
    } else {
      // Store files locally for upload when timesheet is created
      setAttachments((prev) => [...prev, ...filesArray]);
      
      // Create previews for images
      filesArray.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviewImages((prev) => [...prev, {
              file: file.name,
              url: e.target.result,
              type: file.type,
            }]);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Auto-convert to invoice if enabled and file is an image or document
    if (autoConvertToInvoice && filesArray.length > 0) {
      const file = filesArray[0];
      if (
        file.type.startsWith("image/") ||
        file.type === "application/pdf" ||
        file.type.includes("document") ||
        file.type.includes("spreadsheet")
      ) {
        await processTimesheetAndConvertToInvoice(file);
      }
    }
  };

  // Upload files to S3
  const uploadFilesToS3 = async (files) => {
    if (!weekId || !user?.tenantId) {
      toast.error("Cannot upload files: Timesheet not found");
      return;
    }

    for (const file of files) {
      const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUploadingFiles((prev) => [...prev, { id: fileId, name: file.name, progress: 0 }]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          `${API_BASE}/api/timesheets/${weekId}/upload?tenantId=${user.tenantId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId ? { ...f, progress } : f
                )
              );
            },
          }
        );

        if (response.data.success) {
          setUploadedFiles((prev) => [...prev, response.data.file]);
          toast.success(`File "${file.name}" uploaded successfully`);
        } else {
          throw new Error(response.data.message || 'Upload failed');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload "${file.name}": ${error.response?.data?.message || error.message}`);
      } finally {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    }
  };

  // Download file from S3
  const downloadFile = async (fileId, fileName) => {
    if (!weekId || !user?.tenantId) {
      toast.error("Cannot download file: Timesheet not found");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/api/timesheets/${weekId}/files/${fileId}/download?tenantId=${user.tenantId}`
      );

      if (response.data.success && response.data.downloadUrl) {
        // Open download URL in new tab
        window.open(response.data.downloadUrl, '_blank');
      } else {
        throw new Error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(`Failed to download "${fileName}": ${error.response?.data?.message || error.message}`);
    }
  };

  // Delete file from S3
  const deleteFile = async (fileId, fileName) => {
    if (!weekId || !user?.tenantId) {
      toast.error("Cannot delete file: Timesheet not found");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE}/api/timesheets/${weekId}/files/${fileId}?tenantId=${user.tenantId}`
      );

      if (response.data.success) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success(`File "${fileName}" deleted successfully`);
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(`Failed to delete "${fileName}": ${error.response?.data?.message || error.message}`);
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    const newPreviews = [...previewImages];

    newAttachments.splice(index, 1);
    newPreviews.splice(index, 1);

    setAttachments(newAttachments);
    setPreviewImages(newPreviews);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Toast notification helper
  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa fa-${
          type === "success" ? "check-circle" : "exclamation-circle"
        }"></i>
      </div>
      <div class="toast-content">
        <h4>${type === "success" ? "Success" : "Error"}</h4>
        <p>${message}</p>
      </div>
      <button class="toast-close"><i class="fa fa-times"></i></button>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    // Close button functionality
    const closeButton = toast.querySelector(".toast-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
      });
    }
  };

  // Check for overtime (more than 8 hours per day), weekend work, and holiday work
  const checkForOvertime = () => {
    const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const overtimeDaysDetected = [];

    // Calculate daily totals
    const dailyTotals = {
      sat: clientHours.reduce((sum, c) => sum + (c.hours[0] || 0), 0),
      sun: clientHours.reduce((sum, c) => sum + (c.hours[1] || 0), 0),
      mon: clientHours.reduce((sum, c) => sum + (c.hours[2] || 0), 0),
      tue: clientHours.reduce((sum, c) => sum + (c.hours[3] || 0), 0),
      wed: clientHours.reduce((sum, c) => sum + (c.hours[4] || 0), 0),
      thu: clientHours.reduce((sum, c) => sum + (c.hours[5] || 0), 0),
      fri: clientHours.reduce((sum, c) => sum + (c.hours[6] || 0), 0),
    };

    // Parse week dates to check for holidays
    const getWeekDates = () => {
      if (!selectedWeek) return [];
      const [startStr] = selectedWeek.split(" To ");
      const startParts = startStr.split("-");
      const startDate = new Date(
        parseInt(startParts[2]), // year
        new Date(Date.parse(startParts[1] + " 1, 2000")).getMonth(), // month
        parseInt(startParts[0]) // day
      );
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
      }
      return dates;
    };

    // Define holidays (you can fetch this from API in future)
    const holidays = [
      { date: '2024-01-01', name: 'New Year\'s Day' },
      { date: '2024-01-15', name: 'Martin Luther King Jr. Day' },
      { date: '2024-02-19', name: 'Presidents\' Day' },
      { date: '2024-05-27', name: 'Memorial Day' },
      { date: '2024-07-04', name: 'Independence Day' },
      { date: '2024-09-02', name: 'Labor Day' },
      { date: '2024-10-14', name: 'Columbus Day' },
      { date: '2024-11-11', name: 'Veterans Day' },
      { date: '2024-11-28', name: 'Thanksgiving Day' },
      { date: '2024-12-25', name: 'Christmas Day' },
      { date: '2025-01-01', name: 'New Year\'s Day' },
      { date: '2025-01-20', name: 'Martin Luther King Jr. Day' },
      { date: '2025-02-17', name: 'Presidents\' Day' },
      { date: '2025-05-26', name: 'Memorial Day' },
      { date: '2025-07-04', name: 'Independence Day' },
      { date: '2025-09-01', name: 'Labor Day' },
      { date: '2025-10-13', name: 'Columbus Day' },
      { date: '2025-11-11', name: 'Veterans Day' },
      { date: '2025-11-27', name: 'Thanksgiving Day' },
      { date: '2025-12-25', name: 'Christmas Day' },
    ];

    const weekDates = getWeekDates();

    // Check each day for overtime, weekend work, or holiday work
    Object.keys(dailyTotals).forEach((dayKey, index) => {
      const hours = dailyTotals[dayKey];
      
      // Skip if no hours worked
      if (hours === 0) return;

      const dayName = dayNames[index];
      const isWeekend = index === 0 || index === 1; // Saturday or Sunday
      
      // Check if this day is a holiday
      let holidayName = null;
      if (weekDates[index]) {
        const dateStr = weekDates[index].toISOString().split('T')[0];
        const holiday = holidays.find(h => h.date === dateStr);
        if (holiday) {
          holidayName = holiday.name;
        }
      }

      // Add to overtime detection if:
      // 1. Weekend work (any hours on Saturday/Sunday)
      // 2. Holiday work (any hours on a holiday)
      // 3. Overtime on weekday (more than 8 hours)
      if (isWeekend && hours > 0) {
        overtimeDaysDetected.push({
          day: dayName,
          hours: hours.toFixed(2),
          isWeekend: true,
          isHoliday: false,
        });
      } else if (holidayName) {
        overtimeDaysDetected.push({
          day: dayName,
          hours: hours.toFixed(2),
          isWeekend: false,
          isHoliday: true,
          holidayName: holidayName,
        });
      } else if (hours > 8) {
        overtimeDaysDetected.push({
          day: dayName,
          hours: hours.toFixed(2),
          isWeekend: false,
          isHoliday: false,
        });
      }
    });

    return overtimeDaysDetected;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 handleSubmit called");
    console.log("Selected Approver:", selectedApprover);
    console.log("Client Type:", clientType);
    console.log("Grand Total Hours:", getGrandTotal());

    // Validate approver selection
    if (!selectedApprover) {
      console.log("❌ No approver selected");
      toast.error(
        "Please select an approver/reviewer before submitting",
        "error"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Check for overtime before submission
    const overtimeDaysDetected = checkForOvertime();
    console.log("Overtime days detected:", overtimeDaysDetected);
    console.log("Overtime comment:", overtimeComment);
    
    if (overtimeDaysDetected.length > 0 && !overtimeComment) {
      // Show overtime confirmation modal
      console.log("⚠️ Showing overtime modal");
      setOvertimeDays(overtimeDaysDetected);
      setShowOvertimeModal(true);
      return;
    }

    // Validate based on client type
    if (clientType === "internal") {
      // For internal clients, validate hours entry
      const totalClientHours = getGrandTotal();
      console.log("Total client hours:", totalClientHours);
      if (totalClientHours === 0) {
        console.log("❌ No hours entered");
        toast.error(
          "Please enter at least one hour for any client or holiday/time off",
          "error"
        );
        return;
      }
    } else {
      // For external clients, validate file upload
      console.log("External timesheet file:", externalTimesheetFile);
      if (!externalTimesheetFile) {
        console.log("❌ No file uploaded");
        toast.error("Please upload the client submitted timesheet file", "error");
        return;
      }
    }

    // Validate employee selection for non-employee roles
    if (!isEmployee() && !selectedEmployee) {
      console.log("❌ No employee selected");
      toast.error("Please select an employee before submitting", "error");
      return;
    }

    console.log("✅ All validations passed, proceeding with submission");
    setSubmitting(true);

    try {
      console.log("📤 Submitting timesheet with approver:", selectedApprover);

      // Get employee ID
      const employeeId = !isEmployee() ? selectedEmployee : user.employeeId;

      if (!employeeId) {
        toast.error(
          "Employee ID not found. Please try logging in again.",
          "error"
        );
        setSubmitting(false);
        return;
      }

      // Parse week range to get start and end dates
      const [startStr, endStr] = selectedWeek.split(" To ");
      const weekStart = new Date(startStr).toISOString().split("T")[0];
      const weekEnd = new Date(endStr).toISOString().split("T")[0];

      // Prepare submission data
      // Validate clientId - must be valid UUID or null
      let validClientId = null;
      if (clientHours.length > 0 && clientHours[0].id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(clientHours[0].id)) {
          validClientId = clientHours[0].id;
        } else {
          console.warn(`⚠️ Invalid clientId format: "${clientHours[0].id}". Setting to null.`);
          validClientId = null;
        }
      }

      const submissionData = {
        tenantId: user.tenantId,
        employeeId: employeeId,
        weekStart: weekStart,
        weekEnd: weekEnd,
        clientId: validClientId,
        reviewerId: selectedApprover,
        status: "submitted",
        totalHours: getGrandTotal(),
        notes: notes,
        dailyHours: {
          sat: clientHours.reduce((sum, c) => sum + (c.hours[0] || 0), 0),
          sun: clientHours.reduce((sum, c) => sum + (c.hours[1] || 0), 0),
          mon: clientHours.reduce((sum, c) => sum + (c.hours[2] || 0), 0),
          tue: clientHours.reduce((sum, c) => sum + (c.hours[3] || 0), 0),
          wed: clientHours.reduce((sum, c) => sum + (c.hours[4] || 0), 0),
          thu: clientHours.reduce((sum, c) => sum + (c.hours[5] || 0), 0),
          fri: clientHours.reduce((sum, c) => sum + (c.hours[6] || 0), 0),
        },
        // Include overtime comment if provided
        overtimeComment: overtimeComment || null,
        overtimeDays: overtimeDays.length > 0 ? overtimeDays : null,
        // Include AI extraction metadata if available
        aiExtraction: window.timesheetExtractionMetadata || null,
        clientHoursDetails: clientHours.map((client) => ({
          clientId: client.id,
          clientName: client.clientName,
          project: client.project,
          hourlyRate: client.hourlyRate,
          hours: client.hours,
        })),
      };

      console.log("📤 Submitting to API:", submissionData);

      // Submit to backend API
      const response = await axios.post(
        `${API_BASE}/api/timesheets/submit`,
        submissionData
      );

      console.log("✅ API Response:", response.data);

      if (response.data.success) {
        // Get selected approver info
        const approverInfo = availableApprovers.find(
          (a) => a.id === selectedApprover
        );
        const approverName = approverInfo
          ? approverInfo.name
          : "Selected Approver";

        // Show success toast
        toast.success(
          `Timesheet submitted successfully! An approval request has been sent to ${approverName}.`,
          "success"
        );

        // Navigate immediately to timesheet summary with state to trigger refresh
        console.log("🔄 Navigating to timesheet summary...");
        navigate(`/${subdomain}/timesheets`, { 
          replace: true,
          state: { refresh: true, timestamp: Date.now() }
        });
      } else {
        toast.error(
          response.data.message || "Failed to submit timesheet",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Error submitting timesheet:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = "Failed to submit timesheet. Please try again.";

      if (error.response?.status === 404) {
        errorMessage =
          "Submit endpoint not found. Please ensure the backend server is running and has been restarted.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, send data to API
      console.log("Saving draft:", {
        week,
        clientHours,
        holidayHours,
        notes,
        attachments: attachments.map((file) => file.name),
      });

      toast.success("Draft saved successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/${subdomain}/dashboard`);
      }, 2000);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return "ni-img";
    if (type.includes("pdf")) return "ni-file-pdf";
    if (type.includes("word") || type.includes("doc")) return "ni-file-doc";
    return "ni-file";
  };

  // AI Processing Functions
  const handleAiFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if employee is selected for non-employee roles
    if (!isEmployee() && !selectedEmployee) {
      toast.warning(
        "Please select an employee first before uploading their timesheet.",
        {
          title: "Employee Required",
        }
      );
      e.target.value = ""; // Reset file input
      return;
    }

    const file = files[0];

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/webp",
      "image/bmp",
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/csv",
    ];

    const fileExtension = file.name.split(".").pop().toLowerCase();
    const validExtensions = [
      "jpg",
      "jpeg",
      "png",
      "heic",
      "webp",
      "bmp",
      "pdf",
      "xlsx",
      "xls",
      "csv",
      "doc",
      "docx",
    ];

    // Check both MIME type and extension
    const isValidType =
      validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      toast.error(
        "Please upload a valid file format: Image (JPG, PNG, HEIC, BMP), Word (DOC, DOCX), PDF, Excel (XLSX, XLS), or CSV",
        {
          title: "Invalid File Type",
        }
      );
      e.target.value = ""; // Reset file input
      return;
    }

    console.log(
      "✅ File accepted:",
      file.name,
      "Type:",
      file.type,
      "Extension:",
      fileExtension
    );

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setAiProcessing(true);
    setUploadedAiFile(file); // Store the uploaded file

    try {
      // Simulate AI processing
      await processTimesheetWithAI(file);
    } catch (error) {
      console.error("AI processing error:", error);

      // Provide specific error messages based on error type
      let errorMessage = "Failed to process timesheet with AI. ";

      if (error.message.includes("OCR")) {
        errorMessage +=
          "Image quality may be too low. Try using a clearer image or convert to PDF/Excel.";
      } else if (error.message.includes("PDF")) {
        errorMessage +=
          "PDF extraction failed. Try converting to Excel or using a text-based PDF.";
      } else if (error.message.includes("Word")) {
        errorMessage +=
          "Word document processing failed. Try converting to PDF or Excel format.";
      } else if (
        error.message.includes("Excel") ||
        error.message.includes("CSV")
      ) {
        errorMessage +=
          "Spreadsheet parsing failed. Check the file format and structure.";
      } else if (error.message.includes("validation")) {
        errorMessage += error.message;
      } else {
        errorMessage +=
          "Please try a different file format or enter data manually.";
      }

      toast.error(errorMessage, {
        title: "AI Extraction Failed",
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const processTimesheetWithAI = async (file) => {
    try {
      console.log("🤖 Starting AI extraction for file:", file.name);

      // Show progress notification
      toast.info(`Processing ${file.name}...`, {
        title: "AI Extraction Started",
      });

      // Use the actual timesheet extractor service with progress callback
      const extractedData = await extractTimesheetData(file, (progress) => {
        console.log("📊 Extraction progress:", progress);
      });

      console.log("📊 Raw extracted data:", extractedData);

      // Validate the extracted data
      const validation = validateExtractedData(extractedData);

      if (!validation.isValid) {
        throw new Error(
          `Extraction validation failed: ${validation.errors.join(", ")}`
        );
      }

      const extractedClientName = extractedData.clientName || "";

      console.log("🔍 Searching for client:", extractedClientName);
      console.log(
        "🔍 Available clients:",
        clientHours.map((c) => c.clientName)
      );

      let matchingClient = null;

      if (extractedClientName) {
        // Try exact match first
        matchingClient = clientHours.find(
          (client) =>
            client.clientName &&
            client.clientName.toLowerCase() ===
              extractedClientName.toLowerCase()
        );

        // If no exact match, try partial match
        if (!matchingClient) {
          matchingClient = clientHours.find(
            (client) =>
              client.clientName &&
              (client.clientName
                .toLowerCase()
                .includes(extractedClientName.toLowerCase()) ||
                extractedClientName
                  .toLowerCase()
                  .includes(client.clientName.toLowerCase()))
          );
        }
      }

      // If still no match, use first available client
      if (!matchingClient && clientHours.length > 0) {
        matchingClient = clientHours[0];
      }

      // Use the matching client or extracted client name
      // Validate clientId - must be valid UUID or null
      let clientId = null;
      if (matchingClient?.id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(matchingClient.id)) {
          clientId = matchingClient.id;
        } else {
          console.warn(`⚠️ Invalid clientId format: "${matchingClient.id}". Setting to null.`);
          clientId = null;
        }
      }
      const clientName =
        extractedClientName || matchingClient?.clientName || "Unknown Client";
      const hourlyRate = matchingClient?.hourlyRate || 125;

      console.log("🔍 Client mapping result:", {
        extractedClientName,
        matchingClient: matchingClient?.clientName,
        finalClientId: clientId,
        finalClientName: clientName,
        hourlyRate,
      });

      // Only create one client entry since only one client was extracted
      const timesheetData = {
        week:
          selectedWeek ||
          availableWeeks[0]?.value ||
          "09-SEP-2025 To 15-SEP-2025",
        clientHours: [
          {
            id: clientId,
            clientName: clientName,
            project: extractedData.projectName || "The Pre-Paid Agile Dev POD",
            hourlyRate: hourlyRate,
            hours: [
              extractedData.dailyHours.sat || 0,
              extractedData.dailyHours.sun || 0,
              extractedData.dailyHours.mon || 0,
              extractedData.dailyHours.tue || 0,
              extractedData.dailyHours.wed || 0,
              extractedData.dailyHours.thu || 0,
              extractedData.dailyHours.fri || 0,
            ],
          },
        ],
        holidayHours: {
          holiday: [0, 0, 0, 0, 0, 0, 0],
          timeOff: [0, 0, 0, 0, 0, 0, 0],
        },
        notes: `Extracted from ${file.name}: Employee: ${extractedData.employeeName}, Client: ${extractedData.clientName}, Project: ${extractedData.projectName}, Total Hours: ${extractedData.totalHours}`,
        confidence: extractedData.confidence || 0.85,
        originalExtraction: extractedData, // Store original for debugging
      };

      console.log("✅ Converted timesheet data:", timesheetData);

      setAiProcessedData(timesheetData);
      showToast(
        `AI extraction completed! Found ${
          extractedData.totalHours
        } hours with ${Math.round(
          (extractedData.confidence || 0.85) * 100
        )}% confidence.`,
        "success"
      );
    } catch (error) {
      console.error("❌ AI extraction failed:", error);
      showToast(`AI extraction failed: ${error.message}`, "error");

      // Fallback to manual entry
      setAiProcessing(false);
    }
  };

  const applyAiProcessedData = () => {
    if (!aiProcessedData) return;

    // Apply the AI processed data to the form
    setWeek(aiProcessedData.week);
    setSelectedWeek(aiProcessedData.week);
    setClientHours(aiProcessedData.clientHours);
    setHolidayHours(aiProcessedData.holidayHours);

    // Add extraction metadata to notes
    const extractionInfo = `\n\n[AI Extracted Data]\nConfidence: ${Math.round(
      aiProcessedData.confidence * 100
    )}%\nSource: ${
      aiProcessedData.originalExtraction?.source || "unknown"
    }\nExtracted: ${new Date().toLocaleString()}`;
    setNotes((aiProcessedData.notes || "") + extractionInfo);

    // Store extraction metadata for submission
    window.timesheetExtractionMetadata = {
      extractedAt: new Date().toISOString(),
      confidence: aiProcessedData.confidence,
      source: aiProcessedData.originalExtraction?.source,
      fileName: aiProcessedData.originalExtraction?.fileName,
      employeeName: aiProcessedData.originalExtraction?.employeeName,
      clientName: aiProcessedData.originalExtraction?.clientName,
      totalHours: aiProcessedData.originalExtraction?.totalHours,
    };

    // Clear AI processed data and reset upload state
    setAiProcessedData(null);
    setUploadedAiFile(null);
    setAiProcessing(false);
    
    // Reset file input
    const fileInput = document.getElementById("aiFileUpload");
    if (fileInput) {
      fileInput.value = "";
    }
    
    // Keep the upload section open so user can upload another document
    // setShowAiUpload(false); // Commented out to keep section open
    
    showToast(
      "AI extracted data has been applied to your timesheet. Please review and submit.",
      "success"
    );
  };

  const discardAiProcessedData = () => {
    setAiProcessedData(null);
    setUploadedAiFile(null);
    setAiProcessing(false);
    
    // Reset file input
    const fileInput = document.getElementById("aiFileUpload");
    if (fileInput) {
      fileInput.value = "";
    }
    
    // Keep the upload section open
    // setShowAiUpload(false); // Commented out to keep section open
  };

  const removeUploadedAiFile = () => {
    setUploadedAiFile(null);
    setAiProcessedData(null);
    setAiProcessing(false);
    // Reset file input
    const fileInput = document.getElementById("aiFileUpload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Camera capture functions
  const openCamera = async () => {
    // Check if employee is selected for non-employee roles
    if (!isEmployee() && !selectedEmployee) {
      toast.warning(
        "Please select an employee first before capturing their timesheet.",
        {
          title: "Employee Required",
        }
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
        audio: false,
      });
      setCameraStream(stream);
      setShowCameraModal(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error(
        "Unable to access camera. Please check permissions or use file upload instead.",
        {
          title: "Camera Access Denied",
        }
      );
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const captureImage = () => {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");
    
    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error("Failed to capture image");
        return;
      }

      // Create a file from the blob
      const timestamp = new Date().getTime();
      const file = new File([blob], `timesheet_capture_${timestamp}.jpg`, {
        type: "image/jpeg",
      });

      // Close camera
      closeCamera();

      // Process the captured image through AI
      setAiProcessing(true);
      setUploadedAiFile(file);

      try {
        const employeeId = !isEmployee() ? selectedEmployee : user.employeeId;
        const result = await uploadAndProcessTimesheet(file, employeeId);

        if (result.success) {
          setAiProcessedData(result.data);
          toast.success(
            `Successfully extracted timesheet data from captured image!`,
            {
              title: "Image Processed",
            }
          );
        } else {
          toast.error(result.message || "Failed to process captured image");
          setUploadedAiFile(null);
        }
      } catch (error) {
        console.error("Error processing captured image:", error);
        toast.error("An error occurred while processing the captured image");
        setUploadedAiFile(null);
      } finally {
        setAiProcessing(false);
      }
    }, "image/jpeg", 0.95);
  };

  const handleExternalTimesheetUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/heic",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid file (Image, PDF, or Word document)");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setExternalTimesheetFile(file);
    toast.success(`External timesheet file "${file.name}" uploaded successfully`);
  };

  const removeExternalTimesheetFile = () => {
    setExternalTimesheetFile(null);
  };

  // Auto-conversion function
  const processTimesheetAndConvertToInvoice = async (file) => {
    setConversionProcessing(true);
    setConversionSuccess(false);

    try {
      // Step 1: Process timesheet with AI engine
      console.log("Processing timesheet with AI engine...");
      toast.info("🔄 Processing timesheet with AI engine...");

      const engineResponse = await uploadAndProcessTimesheet(file);

      // Step 2: Transform to invoice format
      console.log("Converting to invoice format...");
      toast.info("🔄 Converting to invoice format...");

      const clientInfo = {
        name:
          clientHours.find((client) => client.hours.some((h) => h > 0))
            ?.clientName || "Client",
        email: "client@example.com",
        rate:
          clientHours.find((client) => client.hours.some((h) => h > 0))
            ?.hourlyRate || 100,
      };

      const invoiceData = transformTimesheetToInvoice(
        engineResponse,
        clientInfo
      );
      setInvoiceData(invoiceData);

      // Step 3: Show success and offer to navigate to invoice creation
      setConversionSuccess(true);
      toast.success("✅ Timesheet processed successfully! Invoice data is ready.");

      // Auto-navigate to invoice creation after 3 seconds
      setTimeout(() => {
        if (
          window.confirm(
            "Timesheet converted to invoice successfully! Would you like to create the invoice now?"
          )
        ) {
          navigate(`/${subdomain}/invoices/create`, {
            state: {
              timesheetData: invoiceData,
              sourceTimesheet: {
                week: selectedWeek,
                file: file.name,
              },
            },
          });
        }
      }, 3000);
    } catch (error) {
      console.error("Error in auto-conversion:", error);
      toast.error(`❌ Auto-conversion failed: ${error.message}`);
    } finally {
      setConversionProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading timesheet form...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-conten">
      <div className="container-flui">
        <div className="nk-content-inne">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    Submit Timesheet
                  </h3>
                  {/* <div className="nk-block-des text-soft">
                    <p>Enter your hours for the week of {week}</p>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inne">
                  <form onSubmit={handleSubmit} noValidate>
                    {!isEmployee() && (
                      <div className="form-group mb-4">
                        <label className="form-label">
                          <em className="icon ni ni-user text-primary me-2"></em>
                          Select Employee
                        </label>
                        <div className="form-control-wrap">
                          <select
                            className="form-select"
                            value={selectedEmployee}
                            onChange={(e) =>
                              setSelectedEmployee(e.target.value)
                            }
                            disabled={isReadOnly}
                            required
                          >
                            <option value="">Choose an employee...</option>
                            {availableEmployees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name} - {employee.department} (
                                {employee.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-note mt-2">
                          <small className="text-soft">
                            {isAdmin()
                              ? "As an admin, you can manage timesheets for any employee."
                              : "Select the employee whose timesheet you want to manage."}
                          </small>
                        </div>
                      </div>
                    )}

                    <div className="form-group mb-4">
                      <label className="form-label">Select Week</label>
                      <div className="form-control-wrap">
                        <div className="input-group">
                          {/* <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={navigateToPreviousWeek}
                            disabled={!selectedWeek || loading}
                            title="Previous Week"
                          >
                            <em className="icon ni ni-chevron-left"></em>
                          </button> */}
                          <select
                            className="form-select timesheet-dropdown"
                            value={selectedWeek}
                            onChange={(e) => handleWeekChange(e.target.value)}
                            disabled={false}
                          >
                            <option value="">Select a week...</option>
                            {availableWeeks
                              .sort((a, b) => {
                                // Sort by date descending (current week first)
                                const dateA = new Date(a.value.split(" To ")[0]);
                                const dateB = new Date(b.value.split(" To ")[0]);
                                return dateB - dateA;
                              })
                            .map((week) => (
                              <option key={week.value} value={week.value}>
                                {week.label}
                                {week.readonly
                                  ? " (Read Only - Invoice Raised)"
                                  : ""}
                              </option>
                            ))}
                        </select>
                          {/* <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={navigateToNextWeek}
                            disabled={!selectedWeek || loading}
                            title="Next Week"
                          >
                            <em className="icon ni ni-chevron-right"></em>
                          </button> */}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="form-note">
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={() => navigate(`/${subdomain}/timesheets/history`)}
                          >
                            <em className="icon ni ni-history me-1"></em>
                            View History
                          </button>
                        </div>
                        {isReadOnly && (
                          <div className="form-note text-warning">
                            <em className="icon ni ni-info"></em>
                            This timesheet is read-only
                          </div>
                        )}
                      </div>
                    </div>

                    {/* External Client File Upload */}
                    {clientType === "external" && (
                      <div className="form-group mb-4">
                        <div className="card card-bordered">
                          <div className="card-inne">
                            <h6 className="card-title mb-3">
                              <em className="icon ni ni-upload text-primary me-2"></em>
                              Upload Client Submitted Timesheet
                            </h6>
                            <div className="form-note mb-3">
                              <small className="text-soft">
                                Upload the timesheet file submitted by the
                                external client (Image, PDF, or Word document)
                              </small>
                            </div>

                            {!externalTimesheetFile ? (
                              <div
                                className="upload-zone"
                                onClick={() =>
                                  document
                                    .getElementById("external-file-input")
                                    .click()
                                }
                              >
                                <div className="dz-message">
                                  <span className="dz-message-icon">
                                    <em className="icon ni ni-upload"></em>
                                  </span>
                                  <span className="dz-message-text">
                                    <strong>Click to upload</strong> or drag and
                                    drop
                                  </span>
                                  <span className="dz-message-hint">
                                    Supported formats: JPG, PNG, PDF, DOC, DOCX
                                    (Max 10MB)
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="uploaded-file-preview">
                                <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                                  <div className="d-flex align-items-center">
                                    <em className="icon ni ni-file text-primary me-2"></em>
                                    <div>
                                      <div className="fw-bold">
                                        {externalTimesheetFile.name}
                                      </div>
                                      <small className="text-muted">
                                        {(
                                          externalTimesheetFile.size /
                                          1024 /
                                          1024
                                        ).toFixed(2)}{" "}
                                        MB
                                      </small>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={removeExternalTimesheetFile}
                                    disabled={isReadOnly}
                                  >
                                    <em className="icon ni ni-trash"></em>
                                  </button>
                                </div>
                              </div>
                            )}

                            <input
                              type="file"
                              id="external-file-input"
                              className="d-none"
                              accept=".jpg,.jpeg,.png,.heic,.pdf,.doc,.docx"
                              onChange={handleExternalTimesheetUpload}
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI-Powered Timesheet Upload Section - Only for Internal Clients */}
                    {clientType === "internal" && (
                      <div className="card card-bordered mb-4">
                        <div className="card-inne">
                          <div className="ai-upload-section">
                            <div className="ai-upload-header">
                              <h6 className="ai-upload-title">
                                <i className="fa fa-robot"></i>
                                AI-Powered Timesheet Upload
                              </h6>
                              <div className="ai-upload-actions">
                                <button
                                  type="button"
                                  className="ai-camera-btn"
                                  onClick={openCamera}
                                  disabled={isReadOnly || (!isEmployee() && !selectedEmployee)}
                                  title="Capture with Camera"
                                >
                                  <i className="fas fa-camera"></i>
                                  <span>Capture</span>
                                </button>
                                <button
                                  type="button"
                                  className="ai-upload-toggle-btn"
                                  onClick={() => setShowAiUpload(!showAiUpload)}
                                  disabled={isReadOnly}
                                >
                                  {showAiUpload ? "Hide" : "Upload & Extract"}
                                </button>
                              </div>
                            </div>

                            <p className="ai-upload-description">
                              Upload{" "}
                              {!isEmployee() && selectedEmployee
                                ? `${
                                    availableEmployees.find(
                                      (emp) => emp.id === selectedEmployee
                                    )?.name
                                  }'s`
                                : "your"}{" "}
                              timesheet in any format (Image, Word, Excel, PDF,
                              CSV) and let our AI engine automatically extract
                              and populate the timesheet data.
                            </p>

                            {!isEmployee() && !selectedEmployee && (
                              <div className="alert alert-warning mb-3">
                                <em className="icon ni ni-alert-circle me-2"></em>
                                Please select an employee first before uploading
                                their timesheet.
                              </div>
                            )}

                            {showAiUpload && !aiProcessing && !uploadedAiFile && (
                              <>
                                <div
                                  className="ai-upload-dropzone"
                                  onClick={() =>
                                    document
                                      .getElementById("aiFileUpload")
                                      .click()
                                  }
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const files = e.dataTransfer.files;
                                    if (files && files[0]) {
                                      const input =
                                        document.getElementById("aiFileUpload");
                                      input.files = files;
                                      handleAiFileUpload({ target: input });
                                    }
                                  }}
                                >
                                  <div className="ai-upload-text">
                                    Drag and drop files here or click to browse
                                  </div>
                                  <div className="ai-upload-or">or</div>
                                  <div className="ai-upload-subtext">
                                    <small className="text-muted">
                                      <i className="fas fa-file-image"></i>{" "}
                                      Images •
                                      <i className="fas fa-file-word ms-1"></i>{" "}
                                      Word •
                                      <i className="fas fa-file-excel ms-1"></i>{" "}
                                      Excel •
                                      <i className="fas fa-file-pdf ms-1"></i>{" "}
                                      PDF •
                                      <i className="fas fa-file-csv ms-1"></i>{" "}
                                      CSV
                                    </small>
                                  </div>
                                </div>

                                <input
                                  type="file"
                                  id="aiFileUpload"
                                  style={{ display: "none" }}
                                  accept=".jpg,.jpeg,.png,.heic,.webp,.bmp,.pdf,.xlsx,.xls,.csv,.doc,.docx"
                                  onChange={handleAiFileUpload}
                                  disabled={
                                    aiProcessing ||
                                    isReadOnly ||
                                    (!isEmployee() && !selectedEmployee)
                                  }
                                />
                              </>
                            )}

                            {/* Show uploaded file */}
                            {uploadedAiFile && !aiProcessing && !aiProcessedData && (
                              <div className="uploaded-file-preview mt-3">
                                <div className="d-flex align-items-center justify-content-between p-3 border rounded bg-light">
                                  <div className="d-flex align-items-center">
                                    <em className="icon ni ni-file-docs text-primary me-3 fs-3"></em>
                                    <div>
                                      <div className="fw-bold text-dark">{uploadedAiFile.name}</div>
                                      <small className="text-muted">
                                        {(uploadedAiFile.size / 1024).toFixed(2)} KB
                                      </small>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-icon btn-outline-danger"
                                    onClick={removeUploadedAiFile}
                                    title="Remove file"
                                  >
                                    <em className="icon ni ni-trash"></em>
                                  </button>
                                </div>
                              </div>
                            )}

                            <input
                              type="file"
                              id="aiFileUpload"
                              style={{ display: "none" }}
                              accept=".jpg,.jpeg,.png,.heic,.webp,.bmp,.pdf,.xlsx,.xls,.csv,.doc,.docx"
                              onChange={handleAiFileUpload}
                              disabled={
                                aiProcessing ||
                                isReadOnly ||
                                (!isEmployee() && !selectedEmployee)
                              }
                            />


                            {aiProcessing && (
                              <div className="ai-processing-card mt-3">
                                <div className="ai-processing-content">
                                  <div className="ai-processing-header">
                                    <div className="ai-processing-icon-wrapper">
                                      <div className="ai-processing-icon-spin">
                                        <em className="icon ni ni-loader"></em>
                                      </div>
                                    </div>
                                    <div className="ai-processing-text">
                                      <h6 className="ai-processing-title">
                                        Processing with AI...
                                      </h6>
                                      <p className="ai-processing-subtitle">
                                        Analyzing your timesheet and extracting
                                        data
                                      </p>
                                    </div>
                                  </div>

                                  <div className="ai-processing-progress">
                                    <div className="progress-bar-wrapper">
                                      <div className="progress-bar-animated"></div>
                                    </div>
                                    <div className="progress-label">
                                      <span className="progress-text">
                                        Extracting data...
                                      </span>
                                      <span className="progress-formats">
                                        <em className="icon ni ni-file-img"></em>
                                        <em className="icon ni ni-file-docs"></em>
                                        <em className="icon ni ni-file-xls"></em>
                                        <em className="icon ni ni-file-pdf"></em>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {aiProcessedData && !aiProcessing && (
                              <div className="ai-extraction-result-card-compact mt-3">
                                <div className="ai-result-header">
                                  <div className="ai-result-icon">
                                    <em className="icon ni ni-check-circle"></em>
                                  </div>
                                  <div className="ai-result-info">
                                    <h6 className="ai-result-title">
                                      AI Extraction Complete!
                                    </h6>
                                    <p className="ai-result-subtitle">
                                      Review the extracted data below
                                    </p>
                                  </div>
                                </div>

                                <div className="ai-result-stats">
                                  <div className="ai-stat-compact">
                                    <em className="icon ni ni-activity"></em>
                                    <div className="ai-stat-data">
                                      <span className="stat-label">
                                        Confidence
                                      </span>
                                      <span className="stat-value">
                                        {Math.round(
                                          aiProcessedData.confidence * 100
                                        )}
                                        %
                                      </span>
                                    </div>
                                  </div>

                                  <div className="ai-stat-compact">
                                    <em className="icon ni ni-clock"></em>
                                    <div className="ai-stat-data">
                                      <span className="stat-label">
                                        Total Hours
                                      </span>
                                      <span className="stat-value">
                                        {aiProcessedData.clientHours.reduce(
                                          (sum, client) =>
                                            sum +
                                            client.hours.reduce(
                                              (clientSum, hours) =>
                                                clientSum + hours,
                                              0
                                            ),
                                          0
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="ai-stat-compact">
                                    <em className="icon ni ni-users"></em>
                                    <div className="ai-stat-data">
                                      <span className="stat-label">
                                        Clients
                                      </span>
                                      <span className="stat-value">
                                        {
                                          aiProcessedData.clientHours.filter(
                                            (client) =>
                                              client.hours.some((h) => h > 0)
                                          ).length
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="ai-result-actions">
                                  <button
                                    type="button"
                                    className="btn-apply-data"
                                    onClick={applyAiProcessedData}
                                  >
                                    <em className="icon ni ni-check-circle-fill"></em>
                                    <span>Apply Data</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-discard-data"
                                    onClick={discardAiProcessedData}
                                  >
                                    <em className="icon ni ni-cross-circle"></em>
                                    <span>Discard</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SOW and Timesheet Table - Only for Internal Clients */}
                    {clientType === "internal" && (
                      <>
                        <div className="form-group mb-4">
                          <label className="form-label">
                            Select Statement of Work (SOW)
                          </label>
                          <div className="form-control-wrap">
                            <select
                              className="form-select timesheet-dropdown"
                              disabled={isReadOnly}
                            >
                              <option>Select SOW</option>
                              {clientHours.map((client) => (
                                <option
                                  key={client.id}
                                  value={client.id}
                                  selected
                                >
                                  ✓ {client.clientName} - {client.project}
                                  {isAdmin()
                                    ? ` ($${client.hourlyRate}/hr)`
                                    : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Timesheet Table */}
                        <div className="form-group mb-4">
                          <div className="table-responsive">
                            <table className="table table-bordered timesheet-table">
                              <thead className="table-primary">
                                <tr>
                                  <th style={{ width: "80px" }}>Client ID</th>
                                  <th style={{ width: "200px" }}>
                                    Client Name
                                  </th>
                                  <th style={{ width: "60px" }}>SAT</th>
                                  <th style={{ width: "60px" }}>SUN</th>
                                  <th style={{ width: "60px" }}>MON</th>
                                  <th style={{ width: "60px" }}>TUE</th>
                                  <th style={{ width: "60px" }}>WED</th>
                                  <th style={{ width: "60px" }}>THU</th>
                                  <th style={{ width: "60px" }}>FRI</th>
                                  <th style={{ width: "80px" }}>Total Hours</th>
                                  <th style={{ width: "150px" }}>Comment</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clientHours.map((client, clientIndex) => (
                                  <tr key={client.id}>
                                    <td className="text-center">{client.id}</td>
                                    <td>{client.clientName}</td>
                                    {client.hours.map((hour, dayIndex) => (
                                      <td
                                        key={dayIndex}
                                        className="text-center"
                                      >
                                        <input
                                          type="number"
                                          className="form-control form-control-sm text-center"
                                          style={{
                                            width: "50px",
                                            margin: "0 auto",
                                          }}
                                          value={hour || 0}
                                          onChange={(e) =>
                                            handleClientHourChange(
                                              clientIndex,
                                              dayIndex,
                                              e.target.value
                                            )
                                          }
                                          min="0"
                                          max="24"
                                          step="0.5"
                                          readOnly={isReadOnly}
                                          disabled={isReadOnly}
                                        />
                                      </td>
                                    ))}
                                    <td className="text-center fw-bold">
                                      {getTotalHoursForClient(
                                        clientIndex
                                      ).toFixed(1)}
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Comment"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="table-light">
                                <tr>
                                  <td colSpan="2" className="text-end fw-bold">
                                    Total Client Related Hours:
                                  </td>
                                  {Array.from({ length: 7 }, (_, dayIndex) => (
                                    <td
                                      key={dayIndex}
                                      className="text-center fw-bold"
                                    >
                                      {clientHours
                                        .reduce(
                                          (sum, client) =>
                                            sum + (client.hours[dayIndex] || 0),
                                          0
                                        )
                                        .toFixed(1)}
                                    </td>
                                  ))}
                                  <td className="text-center fw-bold">
                                    {clientHours
                                      .reduce(
                                        (sum, client) =>
                                          sum +
                                          client.hours.reduce(
                                            (clientSum, hours) =>
                                              clientSum + (hours || 0),
                                            0
                                          ),
                                        0
                                      )
                                      .toFixed(1)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Holiday/Time off Section */}
                        <div className="form-group mb-4">
                          <h6 className="form-label">Holiday/Time off</h6>
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <tbody>
                                <tr>
                                  <td style={{ width: "200px" }}>
                                    Holiday (Public/National)
                                  </td>
                                  {holidayHours.holiday.map(
                                    (hour, dayIndex) => (
                                      <td
                                        key={dayIndex}
                                        className="text-center"
                                        style={{ width: "60px" }}
                                      >
                                        <input
                                          type="number"
                                          className="form-control form-control-sm text-center"
                                          style={{
                                            width: "50px",
                                            margin: "0 auto",
                                          }}
                                          value={hour || 0}
                                          onChange={(e) =>
                                            handleHolidayHourChange(
                                              "holiday",
                                              dayIndex,
                                              e.target.value
                                            )
                                          }
                                          min="0"
                                          max="24"
                                          step="0.5"
                                          readOnly={isReadOnly}
                                          disabled={isReadOnly}
                                        />
                                      </td>
                                    )
                                  )}
                                  <td
                                    className="text-center fw-bold"
                                    style={{ width: "80px" }}
                                  >
                                    {holidayHours.holiday
                                      .reduce(
                                        (sum, hour) => sum + (hour || 0),
                                        0
                                      )
                                      .toFixed(1)}
                                  </td>
                                </tr>
                                <tr>
                                  <td>Time Off</td>
                                  {holidayHours.timeOff.map(
                                    (hour, dayIndex) => (
                                      <td
                                        key={dayIndex}
                                        className="text-center"
                                      >
                                        <input
                                          type="number"
                                          className="form-control form-control-sm text-center"
                                          style={{
                                            width: "50px",
                                            margin: "0 auto",
                                          }}
                                          value={hour || 0}
                                          onChange={(e) =>
                                            handleHolidayHourChange(
                                              "timeOff",
                                              dayIndex,
                                              e.target.value
                                            )
                                          }
                                          min="0"
                                          max="24"
                                          step="0.5"
                                          readOnly={isReadOnly}
                                          disabled={isReadOnly}
                                        />
                                      </td>
                                    )
                                  )}
                                  <td className="text-center fw-bold">
                                    {holidayHours.timeOff
                                      .reduce(
                                        (sum, hour) => sum + (hour || 0),
                                        0
                                      )
                                      .toFixed(1)}
                                  </td>
                                </tr>
                              </tbody>
                              <tfoot className="table-light">
                                <tr>
                                  <td className="text-end fw-bold">
                                    Total Personal Hours:
                                  </td>
                                  {Array.from({ length: 7 }, (_, dayIndex) => (
                                    <td
                                      key={dayIndex}
                                      className="text-center fw-bold"
                                    >
                                      {(
                                        (holidayHours.holiday[dayIndex] || 0) +
                                        (holidayHours.timeOff[dayIndex] || 0)
                                      ).toFixed(1)}
                                    </td>
                                  ))}
                                  <td className="text-center fw-bold">
                                    {(
                                      holidayHours.holiday.reduce(
                                        (sum, hour) => sum + (hour || 0),
                                        0
                                      ) +
                                      holidayHours.timeOff.reduce(
                                        (sum, hour) => sum + (hour || 0),
                                        0
                                      )
                                    ).toFixed(1)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="text-end fw-bold">
                                    Grand Total:
                                  </td>
                                  {Array.from({ length: 7 }, (_, dayIndex) => (
                                    <td
                                      key={dayIndex}
                                      className="text-center fw-bold"
                                    >
                                      {getTotalHoursForDay(dayIndex).toFixed(1)}
                                    </td>
                                  ))}
                                  <td className="text-center fw-bold">
                                    {getGrandTotal().toFixed(1)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        <div className="form-group mb-4">
                          <label className="form-label">Notes</label>
                          <div className="form-control-wrap">
                            <textarea
                              className="form-control"
                              rows="3"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add any notes or comments about this timesheet"
                              readOnly={isReadOnly}
                              disabled={isReadOnly}
                            ></textarea>
                          </div>
                        </div>

                        <div className="form-group mb-4">
                          <label className="form-label">Attachments</label>
                          <p className="form-note text-soft mb-2">
                            Upload approved timesheet proof, work samples, or
                            supporting documents
                          </p>
                          <div
                            className={`upload-zone ${
                              isReadOnly ? "disabled" : ""
                            }`}
                            onDragOver={
                              !isReadOnly ? handleDragOver : undefined
                            }
                            onDrop={!isReadOnly ? handleDrop : undefined}
                            onClick={
                              !isReadOnly
                                ? () => fileInputRef.current?.click()
                                : undefined
                            }
                            style={
                              isReadOnly
                                ? { pointerEvents: "none", opacity: 0.6 }
                                : {}
                            }
                          >
                            <div className="dz-message">
                              <span className="dz-message-text">
                                Drag and drop files here or click to browse
                              </span>
                              <span className="dz-message-or">or</span>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="d-none"
                                onChange={handleFileUpload}
                                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              />
                              {isMobile && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-primary mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowCamera(true);
                                      setTimeout(() => {
                                        cameraInputRef.current?.click();
                                      }, 100);
                                    }}
                                  >
                                    <em className="icon ni ni-camera"></em>
                                    <span>Take Photo</span>
                                  </button>
                                  {showCamera && (
                                    <input
                                      ref={cameraInputRef}
                                      type="file"
                                      className="d-none"
                                      onChange={handleCameraCapture}
                                      accept="image/*"
                                      capture="environment"
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Auto-conversion toggle */}
                          <div className="form-group mt-3">
                            <div className="custom-control custom-switch">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="autoConvertToggle"
                                checked={autoConvertToInvoice}
                                onChange={(e) =>
                                  setAutoConvertToInvoice(e.target.checked)
                                }
                              />
                              <label
                                className="custom-control-label"
                                htmlFor="autoConvertToggle"
                              >
                                🤖 Auto-convert timesheet to invoice using AI
                              </label>
                            </div>
                            <small className="form-note text-soft">
                              When enabled, uploaded timesheet images will be
                              automatically processed and converted to invoice
                              format
                            </small>
                          </div>

                          {/* Conversion status display */}
                          {conversionProcessing && (
                            <div className="alert alert-info mt-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Processing...
                                  </span>
                                </div>
                                <span>
                                  🔄 Processing timesheet with AI engine...
                                </span>
                              </div>
                            </div>
                          )}

                          {conversionSuccess && invoiceData && (
                            <div className="alert alert-success mt-3">
                              <h6>✅ Conversion Successful!</h6>
                              <p className="mb-2">
                                Your timesheet has been processed and converted
                                to invoice format.
                              </p>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  navigate(`/${subdomain}/invoices/create`, {
                                    state: {
                                      timesheetData: invoiceData,
                                      sourceTimesheet: {
                                        week: selectedWeek,
                                        file: "uploaded-timesheet",
                                      },
                                    },
                                  });
                                }}
                              >
                                📄 Create Invoice Now
                              </button>
                            </div>
                          )}

                          {/* Uploading files progress */}
                          {uploadingFiles.length > 0 && (
                            <div className="attached-files mt-3">
                              <h6 className="title mb-2">Uploading Files</h6>
                              {uploadingFiles.map((file) => (
                                <div key={file.id} className="file-item mb-2 p-2 border rounded">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                      <em className="icon ni ni-file me-2"></em>
                                      <span>{file.name}</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <div className="progress me-2" style={{ width: '100px', height: '20px' }}>
                                        <div
                                          className="progress-bar"
                                          role="progressbar"
                                          style={{ width: `${file.progress}%` }}
                                          aria-valuenow={file.progress}
                                          aria-valuemin="0"
                                          aria-valuemax="100"
                                        >
                                          {file.progress}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Uploaded files from S3 */}
                          {uploadedFiles.length > 0 && (
                            <div className="attached-files mt-3">
                              <h6 className="title mb-2">Uploaded Files</h6>
                              <div className="row g-3">
                                {uploadedFiles.map((file) => (
                                  <div key={file.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                    <div className="attached-file">
                                      <div className="attached-file-icon">
                                        <em className="icon ni ni-file"></em>
                                      </div>
                                      <div className="attached-file-info">
                                        <span className="attached-file-name" title={file.originalName}>
                                          {file.originalName.length > 15
                                            ? file.originalName.substring(0, 12) + "..."
                                            : file.originalName}
                                        </span>
                                        <div className="d-flex gap-1 mt-1">
                                          <button
                                            type="button"
                                            className="btn btn-xs btn-outline-primary"
                                            onClick={() => downloadFile(file.id, file.originalName)}
                                            title="Download"
                                          >
                                            <em className="icon ni ni-download"></em>
                                          </button>
                                          {!isReadOnly && (
                                            <button
                                              type="button"
                                              className="btn btn-xs btn-outline-danger"
                                              onClick={() => deleteFile(file.id, file.originalName)}
                                              title="Delete"
                                            >
                                              <em className="icon ni ni-trash"></em>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Local preview images (for files not yet uploaded) */}
                          {previewImages.length > 0 && attachments.length > 0 && (
                            <div className="attached-files mt-3">
                              <h6 className="title mb-2">Files to Upload</h6>
                              <div className="row g-3">
                                {previewImages.map((preview, index) => (
                                  <div
                                    key={index}
                                    className="col-6 col-sm-4 col-md-3 col-lg-2"
                                  >
                                    <div className="attached-file">
                                      {preview.url ? (
                                        <div className="attached-file-image">
                                          <img
                                            src={preview.url}
                                            alt={preview.file}
                                          />
                                        </div>
                                      ) : (
                                        <div className="attached-file-icon">
                                          <em
                                            className={`icon ni ${getFileIcon(
                                              preview.type
                                            )}`}
                                          ></em>
                                        </div>
                                      )}
                                      <div className="attached-file-info">
                                        <span className="attached-file-name">
                                          {preview.file.length > 15
                                            ? preview.file.substring(0, 12) +
                                              "..."
                                            : preview.file}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-icon btn-trigger attached-file-remove"
                                          onClick={() =>
                                            removeAttachment(index)
                                          }
                                        >
                                          <em className="icon ni ni-cross"></em>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Approver Selection */}
                        <div className="form-group mb-4">
                          <label className="form-label">
                            Assign Reviewer/Approver{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <div className="form-control-wrap">
                            <select
                              className="form-select"
                              value={selectedApprover}
                              onChange={(e) =>
                                setSelectedApprover(e.target.value)
                              }
                              disabled={isReadOnly}
                              required
                            >
                              <option value="">Select an approver...</option>
                              {availableApprovers.map((approver) => (
                                <option key={approver.id} value={approver.id}>
                                  {approver.name} ({approver.role})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-note">
                            Select an admin or manager to review and approve
                            this timesheet
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="form-group mt-4">
                          <div className="timesheet-action-buttons">
                            {!isReadOnly ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-timesheet-save"
                                  onClick={handleSaveDraft}
                                  disabled={submitting}
                                >
                                  <em className="icon ni ni-save"></em>
                                  <span>Save For Later</span>
                                </button>
                                <button
                                  type="submit"
                                  className="btn-timesheet-submit"
                                  disabled={submitting || !selectedApprover}
                                >
                                  {submitting ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        aria-hidden="true"
                                      ></span>
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <em className="icon ni ni-check-circle"></em>
                                      <span>Submit Timesheet</span>
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <div className="alert alert-info text-center mb-3">
                                <em className="icon ni ni-info-fill me-2"></em>
                                <strong>Read-Only View:</strong> This timesheet
                                cannot be modified as the invoice has been
                                raised.
                              </div>
                            )}
                            <div className="d-flex justify-content-center">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-lg"
                                onClick={() =>
                                  navigate(`/${subdomain}/timesheets`)
                                }
                              >
                                <em className="icon ni ni-arrow-left me-2"></em>
                                Return to Timesheet Summary
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Find My Approvers Section */}
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        className="btn btn-link text-primary"
                      >
                        Find My Approvers
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overtime Confirmation Modal */}
      <OvertimeConfirmationModal
        isOpen={showOvertimeModal}
        onClose={() => {
          setShowOvertimeModal(false);
          setOvertimeDays([]);
          setOvertimeComment("");
        }}
        onConfirm={async (comment) => {
          // Set the comment and close modal
          setOvertimeComment(comment);
          setShowOvertimeModal(false);
          
          // Wait a bit for state to update, then proceed with submission
          setTimeout(async () => {
            setSubmitting(true);
            
            try {
              console.log("📤 Proceeding with overtime submission after comment provided");
              
              // Get employee ID
              const employeeId = !isEmployee() ? selectedEmployee : user.employeeId;
              
              if (!employeeId) {
                toast.error("Employee ID not found. Please try logging in again.", "error");
                setSubmitting(false);
                return;
              }
              
              // Parse week range to get start and end dates
              const [startStr, endStr] = selectedWeek.split(" To ");
              const weekStart = new Date(startStr).toISOString().split("T")[0];
              const weekEnd = new Date(endStr).toISOString().split("T")[0];
              
              // Validate clientId
              let validClientId = null;
              if (clientHours.length > 0 && clientHours[0].id) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(clientHours[0].id)) {
                  validClientId = clientHours[0].id;
                }
              }
              
              const submissionData = {
                tenantId: user.tenantId,
                employeeId: employeeId,
                weekStart: weekStart,
                weekEnd: weekEnd,
                clientId: validClientId,
                reviewerId: selectedApprover,
                status: "submitted",
                totalHours: getGrandTotal(),
                notes: notes,
                dailyHours: {
                  sat: clientHours.reduce((sum, c) => sum + (c.hours[0] || 0), 0),
                  sun: clientHours.reduce((sum, c) => sum + (c.hours[1] || 0), 0),
                  mon: clientHours.reduce((sum, c) => sum + (c.hours[2] || 0), 0),
                  tue: clientHours.reduce((sum, c) => sum + (c.hours[3] || 0), 0),
                  wed: clientHours.reduce((sum, c) => sum + (c.hours[4] || 0), 0),
                  thu: clientHours.reduce((sum, c) => sum + (c.hours[5] || 0), 0),
                  fri: clientHours.reduce((sum, c) => sum + (c.hours[6] || 0), 0),
                },
                overtimeComment: comment,
                overtimeDays: overtimeDays,
                aiExtraction: window.timesheetExtractionMetadata || null,
                clientHoursDetails: clientHours.map((client) => ({
                  clientId: client.id,
                  clientName: client.clientName,
                  project: client.project,
                  hourlyRate: client.hourlyRate,
                  hours: client.hours,
                })),
              };
              
              console.log("📤 Submitting with overtime comment:", submissionData);
              
              // Submit to backend API
              const response = await axios.post(
                `${API_BASE}/api/timesheets/submit`,
                submissionData
              );
              
              console.log("✅ API Response:", response.data);
              
              if (response.data.success) {
                const approverInfo = availableApprovers.find(
                  (a) => a.id === selectedApprover
                );
                const approverName = approverInfo ? approverInfo.name : "Selected Approver";
                
                toast.success(
                  `Timesheet with overtime submitted successfully! An approval request has been sent to ${approverName}.`,
                  "success"
                );
                
                // Clear overtime state
                setOvertimeComment("");
                setOvertimeDays([]);
                
                // Navigate to timesheet summary with state to trigger refresh
                console.log("🔄 Navigating to timesheet summary...");
                navigate(`/${subdomain}/timesheets`, { 
                  replace: true,
                  state: { refresh: true, timestamp: Date.now() }
                });
              } else {
                toast.error(response.data.message || "Failed to submit timesheet", "error");
              }
            } catch (error) {
              console.error("❌ Error submitting timesheet with overtime:", error);
              console.error("Error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
              });
              
              let errorMessage = "Failed to submit timesheet. Please try again.";
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              }
              
              toast.error(errorMessage, "error");
            } finally {
              setSubmitting(false);
            }
          }, 100);
        }}
        overtimeDays={overtimeDays}
      />

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <div className="camera-modal-header">
              <h5>📸 Capture Timesheet</h5>
              <button
                type="button"
                className="camera-close-btn"
                onClick={closeCamera}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="camera-modal-body">
              <video
                id="cameraVideo"
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream;
                  }
                }}
                className="camera-video"
              />
              <canvas id="cameraCanvas" style={{ display: "none" }} />
            </div>
            <div className="camera-modal-footer">
              <button
                type="button"
                className="camera-cancel-btn"
                onClick={closeCamera}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button
                type="button"
                className="camera-capture-btn"
                onClick={captureImage}
              >
                <i className="fas fa-camera"></i> Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetSubmit;
