'use client';

import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  extractTimesheetData,
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice} from '@/services/engineService';
import {
  validateExtractedData} from '@/services/timesheetExtractor';
import { API_BASE } from '@/config/api';
import axios from 'axios';
import { decryptApiResponse } from '@/utils/encryption';
import OvertimeConfirmationModal from './OvertimeConfirmationModal';
import "./Timesheet.css";

const TimesheetSubmit = () => {
  const { subdomain, weekId } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, isEmployee, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mode is 'view' from query parameters
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');

  // Form state
  const [week, setWeek] = useState("");
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(mode === 'view');
  const [clientHours, setClientHours] = useState([]);
  const [holidayHours, setHolidayHours] = useState({
    holiday: Array(7).fill(0),
    timeOff: Array(7).fill(0)});
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

  // Update isReadOnly when mode changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const currentMode = queryParams.get('mode');
    setIsReadOnly(currentMode === 'view');
  }, [location.search]);

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
                      hours: Array(7).fill(0)},
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
                    hours: Array(7).fill(0)}));
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
                  hours: Array(7).fill(0)}));
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
            console.log("📥 Employees API raw response:", employeesResponse.data);
            
            // Decrypt the response if encrypted
            const decryptedData = decryptApiResponse(employeesResponse.data);
            console.log("🔓 Decrypted employees data:", decryptedData);

            if (
              decryptedData.success &&
              decryptedData.employees
            ) {
              // Filter out admin users - they don't submit timesheets
              const employees = decryptedData.employees
                .filter((emp) => emp.role !== "admin")
                .map((emp) => ({
                  id: emp.id,
                  name: `${emp.firstName} ${emp.lastName}`,
                  email: emp.email,
                  department: emp.department || "N/A",
                  role: emp.role}));
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
              readonly: isOld});

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
          router.push(`/${subdomain}/timesheets/submit/${response.data.timesheet.id}`);
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
          router.push(`/${subdomain}/timesheets/submit/${response.data.timesheet.id}`);
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
          router.push(`/${subdomain}/timesheets/submit/${response.data.timesheet.id}`);
        } else {
          // New week - update selected week and clear form
          setSelectedWeek(weekValue);
          setWeek(weekValue);
          setClientHours(
            clientHours.map((client) => ({
              ...client,
              hours: Array(7).fill(0)}))
          );
          setHolidayHours({
            holiday: Array(7).fill(0),
            timeOff: Array(7).fill(0)});
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
              type: file.type}]);
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
              'Content-Type': 'multipart/form-data'},
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId ? { ...f, progress } : f
                )
              );
            }}
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
      fri: clientHours.reduce((sum, c) => sum + (c.hours[6] || 0), 0)};

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
          isHoliday: false});
      } else if (holidayName) {
        overtimeDaysDetected.push({
          day: dayName,
          hours: hours.toFixed(2),
          isWeekend: false,
          isHoliday: true,
          holidayName: holidayName});
      } else if (hours > 8) {
        overtimeDaysDetected.push({
          day: dayName,
          hours: hours.toFixed(2),
          isWeekend: false,
          isHoliday: false});
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

      // Get employee ID and name
      const employeeId = !isEmployee() ? selectedEmployee : user.employeeId;

      if (!employeeId) {
        toast.error(
          "Employee ID not found. Please try logging in again.",
          "error"
        );
        setSubmitting(false);
        return;
      }

      // Get employee name
      let employeeName = "";
      if (!isEmployee()) {
        // Admin/Manager submitting for employee - get from availableEmployees
        const selectedEmp = availableEmployees.find(emp => emp.id === employeeId);
        employeeName = selectedEmp ? selectedEmp.name : "";
      } else {
        // Employee submitting their own timesheet - get from user object
        employeeName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.name || "";
      }

      console.log("👤 Employee Info:", { employeeId, employeeName });

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
        employeeName: employeeName,
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
          fri: clientHours.reduce((sum, c) => sum + (c.hours[6] || 0), 0)},
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
          hours: client.hours}))};

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
        router.push(`/${subdomain}/timesheets`, { 
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
        status: error.response?.status});

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
        attachments: attachments.map((file) => file.name)});

      toast.success("Draft saved successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/${subdomain}/dashboard`);
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
          title: "Employee Required"}
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
          title: "Invalid File Type"}
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
        title: "AI Extraction Failed"});
    } finally {
      setAiProcessing(false);
    }
  };

  const processTimesheetWithAI = async (file) => {
    try {
      console.log("🤖 Starting AI extraction for file:", file.name);

      // Show progress notification
      toast.info(`Processing ${file.name}...`, {
        title: "AI Extraction Started"});

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
        hourlyRate});

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
            ]},
        ],
        holidayHours: {
          holiday: [0, 0, 0, 0, 0, 0, 0],
          timeOff: [0, 0, 0, 0, 0, 0, 0]},
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
      totalHours: aiProcessedData.originalExtraction?.totalHours};

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
          title: "Employee Required"}
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
        audio: false});
      setCameraStream(stream);
      setShowCameraModal(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error(
        "Unable to access camera. Please check permissions or use file upload instead.",
        {
          title: "Camera Access Denied"}
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
        type: "image/jpeg"});

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
              title: "Image Processed"}
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
            ?.hourlyRate || 100};

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
          router.push(`/${subdomain}/invoices/create`, {
            state: {
              timesheetData: invoiceData,
              sourceTimesheet: {
                week: selectedWeek,
                file: file.name}}});
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
      <div className="nk-content min-h-screen bg-slate-50">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Loading timesheet form...
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Please wait while we fetch your week and client data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="nk-content min-h-screen bg-slate-50">
  <div className="container-fluid">
    <div className="nk-content-inner">
      <div className="nk-content-body py-6">
<div className="mb-6 rounded-xl border border-slate-200 bg-indigo-50 p-5 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h1 className="text-xl font-semibold text-slate-900">Submit Timesheet</h1>
                          <div className="mt-1 text-sm text-slate-600">
                            <span className="font-medium text-slate-700">Employee:</span>{" "}
                            <span className="text-slate-600">
                              {!isEmployee()
                                ? (availableEmployees.find((emp) => emp.id === selectedEmployee)?.name || "—")
                                : (user?.name || user?.email || "—")}
                            </span>
                            <span className="mx-2 text-slate-300">|</span>
                            <span className="font-medium text-slate-700">Week:</span>{" "}
                            <span className="text-slate-600">{selectedWeek || "—"}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isReadOnly && (
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                              <em className="icon ni ni-info"></em>
                              Read-only
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
        {/* DASHBOARD STYLE WRAPPER */}
        <div className="nk-block nk-block-lg">
          <div className="card card-bordered rounded-xl border-slate-200 shadow-sm">

            {/* HEADER */}
            {/* <div className="card-inner border-bottom border-slate-200 bg-white/60">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="nk-block-title page-title text-lg font-semibold text-slate-900">
                    Submit Timesheet
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Fill in hours, attach proof if needed, and submit for approval.
                  </p>
                </div>
                <div className="flex items-center gap-2"></div>
              </div>
            </div> */}
              <div className="card card-bordered rounded-xl border-slate-200 shadow-sm">
                <div className="card-inner">
                  <div className="mx-auto w-full max-w-6xl">
                    

                    <form onSubmit={handleSubmit} noValidate>
                      <div className="grid grid-cols-1 gap-4">
                        {/* 1) Employee & Week Selection */}
                       <section className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
  {/* Header */}
  <div className="border-b border-slate-200 bg-slate-50 p-4">
    <div className="text-sm font-semibold text-slate-900">
      Employee & Week
    </div>
    <div className="mt-1 text-xs text-slate-500">
      Select who the timesheet belongs to and choose a week.
    </div>
  </div>

  {/* Body */}
  <div className="p-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {!isEmployee() && (
        <div className="form-group">
          <label className="form-label mb-1 flex items-center text-sm font-medium text-slate-800">
            <em className="icon ni ni-user mr-2 text-indigo-500"></em>
            Select Employee
          </label>

          <div className="form-control-wrap">
            <select
              className="
                form-select w-full rounded-lg border border-slate-300
                bg-white text-sm text-slate-800
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                placeholder:text-slate-400
              "
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={isReadOnly}
              required
            >
              <option value="">Choose an employee...</option>
              {availableEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.department} ({employee.email})
                </option>
              ))}
            </select>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {isAdmin()
              ? "As an admin, you can manage timesheets for any employee."
              : "Select the employee whose timesheet you want to manage."}
          </p>
        </div>
      )}

      <div className="form-group">
        <label className="form-label mb-1 text-sm font-medium text-slate-800">
          Select Week
        </label>

        <div className="form-control-wrap">
          <select
            className="
              form-select timesheet-dropdown w-full rounded-lg
              border border-slate-300 bg-white text-sm text-slate-800
              focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
              placeholder:text-slate-400
            "
            value={selectedWeek}
            onChange={(e) => handleWeekChange(e.target.value)}
          >
            <option value="">Select a week…</option>
            {availableWeeks
              .sort((a, b) => {
                const dateA = new Date(a.value.split(" To ")[0])
                const dateB = new Date(b.value.split(" To ")[0])
                return dateB - dateA
              })
              .map((week) => (
                <option key={week.value} value={week.value}>
                  {week.label}
                  {week.readonly ? " (Read Only - Invoice Raised)" : ""}
                </option>
              ))}
          </select>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Choose the week to create or edit a timesheet.
        </p>
      </div>
    </div>

    {/* Footer Actions */}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/${subdomain}/timesheets/history`}
          className="
            inline-flex items-center gap-1.5 rounded-lg
            border border-slate-300 bg-white px-3 py-2
            text-xs font-medium text-slate-700
            hover:bg-slate-100 hover:text-slate-900
            focus:ring-2 focus:ring-indigo-200
            transition
          "
        >
          <em className="icon ni ni-history"></em>
          View History
        </Link>

        <button
          type="button"
          className="
            inline-flex items-center rounded-lg
            bg-indigo-50 px-3 py-2 text-xs font-medium
            text-sky-900 hover:bg-indigo-100
            focus:ring-2 focus:ring-indigo-200
            transition
          "
        >
          Find My Approvers
        </button>
      </div>
    </div>
  </div>
</section>


                      {/* External Client File Upload */}
                      {clientType === "external" && (
                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-200 p-4">
                            <div className="text-sm font-semibold text-slate-900">Timesheet Upload</div>
                            <div className="mt-1 text-xs text-slate-500">Upload the timesheet submitted by the external client.</div>
                          </div>
                          <div className="p-4">

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
                                <div className="d-flex align-items-center justify-content-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                  <div className="d-flex align-items-center">
                                    <em className="icon ni ni-file text-primary me-2"></em>
                                    <div>
                                      <div className="fw-bold text-slate-900">
                                        {externalTimesheetFile.name}
                                      </div>
                                      <small className="text-muted text-xs">
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
                                    className="btn btn-sm btn-outline-danger inline-flex items-center justify-center rounded-lg"
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
                        </section>
                      )}

                      {/* 2) AI Timesheet Upload */}
                      {clientType === "internal" && (
                        <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
  {/* Header */}
  <div className="border-b border-blue-100 px-5 py-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <em className="icon ni ni-robot text-blue-600"></em>
          AI Timesheet Upload
        </div>
        <div className="mt-1 px-1 text-xs text-slate-600">
          Upload or capture a timesheet and let AI extract hours automatically.
        </div>
      </div>
    </div>
  </div>

  {/* Body */}
  <div className="p-5">
    <div className="ai-upload-section space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <i className="fa fa-robot text-indigo-600"></i>
          AI-Powered Extraction
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="
              inline-flex items-center gap-2 rounded-lg
              border border-slate-300 bg-white px-3 py-2
              text-xs font-medium text-slate-700
              hover:bg-slate-100 hover:text-slate-900
              focus:ring-2 focus:ring-indigo-200
              transition
            "
            onClick={openCamera}
            disabled={isReadOnly || (!isEmployee() && !selectedEmployee)}
          >
            <i className="fas fa-camera text-sky-800"></i>
            Capture
          </button>

          <button
            type="button"
            className="
              inline-flex items-center rounded-lg
              bg-sky-800 px-3 py-2
              text-xs font-medium text-white
              hover:bg-sky-700
              focus:ring-2 focus:ring-indigo-300
              transition
            "
            onClick={() => setShowAiUpload(!showAiUpload)}
            disabled={isReadOnly}
          >
            {showAiUpload ? "Hide Upload" : "Upload & Extract"}
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600">
        Upload{" "}
        {!isEmployee() && selectedEmployee
          ? `${
              availableEmployees.find((emp) => emp.id === selectedEmployee)
                ?.name
            }'s`
          : "your"}{" "}
        timesheet (Image, Word, Excel, PDF, CSV). AI will detect clients and
        hours automatically.
      </p>

      {/* Warning */}
      {!isEmployee() && !selectedEmployee && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <em className="icon ni ni-alert-circle"></em>
          Select an employee before uploading their timesheet.
        </div>
      )}

      {/* Upload Dropzone */}
      {showAiUpload && !aiProcessing && !uploadedAiFile && (
        <>
          <div
            className="
              cursor-pointer rounded-2xl border-2 border-dashed
              border-indigo-300 bg-white p-8 text-center
              transition hover:border-indigo-400 hover:bg-indigo-50/40
            "
            onClick={() =>
              document.getElementById("aiFileUpload").click()
            }
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const files = e.dataTransfer.files
              if (files && files[0]) {
                const input = document.getElementById("aiFileUpload")
                input.files = files
                handleAiFileUpload({ target: input })
              }
            }}
          >
            <div className="text-sm font-semibold text-slate-800">
              Drag & drop files here
            </div>
            <div className="my-2 text-xs text-slate-500">or</div>
            <div className="text-xs text-indigo-600 font-medium">
              Click to browse files
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
              <span>Images</span>•<span>Word</span>•<span>Excel</span>•
              <span>PDF</span>•<span>CSV</span>
            </div>
          </div>

          <input
            type="file"
            id="aiFileUpload"
            className="hidden"
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

      {/* Uploaded File */}
      {uploadedAiFile && !aiProcessing && !aiProcessedData && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <em className="icon ni ni-file-docs text-indigo-600 text-xl"></em>
            <div>
              <div className="text-sm font-medium text-slate-900">
                {uploadedAiFile.name}
              </div>
              <div className="text-xs text-slate-500">
                {(uploadedAiFile.size / 1024).toFixed(2)} KB
              </div>
            </div>
          </div>

          <button
            type="button"
            className="
              inline-flex items-center justify-center rounded-lg
              border border-red-200 bg-red-50 p-2
              text-red-600 hover:bg-red-100
            "
            onClick={removeUploadedAiFile}
          >
            <em className="icon ni ni-trash"></em>
          </button>
        </div>
      )}

      {/* Processing */}
      {aiProcessing && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin text-indigo-600">
              <em className="icon ni ni-loader"></em>
            </div>
            <div>
              <div className="text-sm font-semibold text-indigo-900">
                Processing with AI…
              </div>
              <div className="text-xs text-indigo-700">
                Extracting hours and client data
              </div>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full w-2/3 animate-pulse bg-indigo-500"></div>
          </div>
        </div>
      )}

      {/* Result */}
      {aiProcessedData && !aiProcessing && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <em className="icon ni ni-check-circle text-emerald-600 text-xl"></em>
            <div>
              <div className="text-sm font-semibold text-emerald-900">
                AI Extraction Complete
              </div>
              <div className="text-xs text-emerald-700">
                Review and apply extracted data
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white p-2 text-xs">
              <div className="text-slate-500">Confidence</div>
              <div className="font-semibold text-slate-900">
                {Math.round(aiProcessedData.confidence * 100)}%
              </div>
            </div>

            <div className="rounded-lg bg-white p-2 text-xs">
              <div className="text-slate-500">Total Hours</div>
              <div className="font-semibold text-slate-900">
                {aiProcessedData.clientHours.reduce(
                  (sum, client) =>
                    sum +
                    client.hours.reduce(
                      (clientSum, hours) => clientSum + hours,
                      0
                    ),
                  0
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-2 text-xs">
              <div className="text-slate-500">Clients</div>
              <div className="font-semibold text-slate-900">
                {
                  aiProcessedData.clientHours.filter((client) =>
                    client.hours.some((h) => h > 0)
                  ).length
                }
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="
                flex-1 rounded-lg bg-emerald-600 px-3 py-2
                text-xs font-medium text-white
                hover:bg-emerald-700
              "
              onClick={applyAiProcessedData}
            >
              Apply Data
            </button>

            <button
              type="button"
              className="
                flex-1 rounded-lg border border-slate-300 bg-white
                px-3 py-2 text-xs font-medium text-slate-700
                hover:bg-slate-100
              "
              onClick={discardAiProcessedData}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
</section>

                      )}

                      {/* 3) Client / Project Details */}
                      {clientType === "internal" && (
                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-200 p-4">
                            <div className="text-sm font-semibold text-slate-900">Client / Project Details</div>
                            <div className="mt-1 text-xs text-slate-500">Select the statement of work linked to this timesheet.</div>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="form-group">
                                <label className="form-label text-sm font-medium text-slate-800">
                                  Select Statement of Work (SOW)
                                </label>
                                <div className="form-control-wrap">
                                  <select
                                    className="form-select timesheet-dropdown w-full rounded-lg border-slate-300 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    disabled={isReadOnly}
                                  >
                                    <option>Select SOW</option>
                                    {clientHours.map((client) => (
                                      <option key={client.id} value={client.id} selected>
                                        ✓ {client.clientName} - {client.project}
                                        {isAdmin() ? ` ($${client.hourlyRate}/hr)` : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                <div className="font-medium text-slate-700">Read-only client identifiers</div>
                                <div className="mt-1">Client ID and Client Name are shown in the hours table below.</div>
                              </div>
                            </div>
                          </div>
                        </section>
                      )}

                     {clientType === "internal" && (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

    {/* Header */}
    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Weekly Timesheet Entry
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Enter daily hours per client. Totals update automatically.
      </p>
    </div>

    {/* Body */}
    <div className="overflow-x-auto p-4">
      <table className="w-full border-separate border-spacing-y-2 text-sm">

        {/* Day Header */}
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 text-left">Client</th>
            {["Sat","Sun","Mon","Tue","Wed","Thu","Fri"].map(day => (
              <th key={day} className="text-center">{day}</th>
            ))}
            <th className="text-center">Total</th>
            <th className="text-left">Comment</th>
          </tr>
        </thead>

        <tbody>

          {/* Client Rows */}
          {clientHours.map((client, clientIndex) => (
            <tr
              key={client.id}
              className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <td className="px-3 py-2 font-medium text-slate-800">
                <div>{client.clientName}</div>
                <div className="text-xs text-slate-400">ID: {client.id}</div>
              </td>

              {client.hours.map((hour, dayIndex) => (
                <td key={dayIndex} className="px-2 py-2 text-center">
                  <input
                    type="number"
                    value={hour || 0}
                    min="0"
                    max="24"
                    step="0.5"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      handleClientHourChange(
                        clientIndex,
                        dayIndex,
                        e.target.value
                      )
                    }
                    className="
                      w-14 rounded-lg border border-slate-300
                      text-center text-sm
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                      disabled:bg-slate-100
                    "
                  />
                </td>
              ))}

              <td className="text-center font-semibold text-slate-900">
                {getTotalHoursForClient(clientIndex).toFixed(1)}
              </td>

              {/* <td className="px-3">
                <input
                  type="text"
                  placeholder="Optional note"
                  className="
                    w-full rounded-lg border border-slate-300
                    px-2 py-1 text-sm
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    disabled:bg-slate-100
                  "
                />
              </td> */}
              <td className="px-3">
  <input
    type="text"
    placeholder="Optional note (work done, blockers, reference)"
    value={client.comment || ""}
    onChange={(e) =>
      handleClientCommentChange(clientIndex, e.target.value)
    }
    readOnly={isReadOnly}
    disabled={isReadOnly}
    className="
      w-full rounded-lg border border-slate-300
      px-2 py-1 text-sm
      focus:border-blue-500 focus:ring-2 focus:ring-blue-200
      disabled:bg-slate-100
    "
  />
</td>


            </tr>
          ))}

          {/* Divider */}
          <tr>
            <td colSpan={10} className="py-2"></td>
          </tr>

          {/* Holiday */}
          {["holiday", "timeOff"].map((type) => (
            <tr
              key={type}
              className="rounded-xl bg-slate-50 ring-1 ring-slate-200"
            >
              <td className="px-3 py-2 font-medium text-slate-700">
                {type === "holiday" ? "Holiday" : "Time Off"}
              </td>

              {holidayHours[type].map((hour, dayIndex) => (
                <td key={dayIndex} className="px-2 py-2 text-center">
                  <input
                    type="number"
                    value={hour || 0}
                    min="0"
                    max="24"
                    step="0.5"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      handleHolidayHourChange(
                        type,
                        dayIndex,
                        e.target.value
                      )
                    }
                    className="
                      w-14 rounded-lg border border-slate-300
                      text-center text-sm
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                      disabled:bg-slate-100
                    "
                  />
                </td>
              ))}

              <td className="text-center font-semibold">
                {holidayHours[type]
                  .reduce((s, h) => s + (h || 0), 0)
                  .toFixed(1)}
              </td>
              <td></td>
            </tr>
          ))}

          {/* Grand Total */}
          <tr className="bg-blue-50 ring-1 ring-blue-200">
            <td className="px-3 py-3 font-bold text-blue-900">
              Grand Total
            </td>

            {Array.from({ length: 7 }, (_, dayIndex) => (
              <td key={dayIndex} className="text-center font-bold text-blue-900">
                {getTotalHoursForDay(dayIndex).toFixed(1)}
              </td>
            ))}

            <td className="text-center font-bold text-blue-900">
              {getGrandTotal().toFixed(1)}
            </td>
            <td></td>
          </tr>

        </tbody>
      </table>
    </div>
  </section>
)}


                      {/* 6) Notes & Attachments */}
                      {clientType === "internal" && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.04)] transition hover:shadow-[0_10px_32px_rgba(0,0,0,0.07)]">
  
  {/* Header */}
  <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-2">
    <div className="flex items-center gap-2">
      
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Notes & Attachments
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Add remarks and upload supporting documents for this timesheet.
        </p>
      </div>
    </div>
  </div>

  {/* Body */}
  <div className="p-5">
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

      {/* Notes */}
      <div className="form-group">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Notes
        </label>
        <textarea
          className="
            w-full rounded-xl border border-slate-300 bg-white
            px-3 py-2.5 text-sm text-slate-800
            placeholder-slate-400
            focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10
            disabled:bg-slate-100 disabled:text-slate-500
          "
          rows="4"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add comments, clarifications, or internal notes about this timesheet…"
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Notes are visible to managers and approvers.
        </p>
      </div>

      {/* Attachments */}
      <div className="form-group">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Attachments
        </label>
       

        {/* Upload Zone */}
        <div
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center transition
            hover:border-indigo-400 hover:bg-indigo-50/40
            ${isReadOnly ? "pointer-events-none opacity-60" : ""}
          `}
          onDragOver={!isReadOnly ? handleDragOver : undefined}
          onDrop={!isReadOnly ? handleDrop : undefined}
          onClick={!isReadOnly ? () => fileInputRef.current?.click() : undefined}
        >
          <em className="icon ni ni-upload mb-2 text-2xl text-slate-400 group-hover:text-indigo-500"></em>

          <span className="text-sm font-medium text-slate-700">
            Drag & drop files here
          </span>
          <span className="my-1 text-xs text-slate-400">or</span>
          <span className="text-xs font-semibold text-indigo-600">
            Click to browse
          </span>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />

          {isMobile && (
            <>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCamera(true);
                  setTimeout(() => {
                    cameraInputRef.current?.click();
                  }, 100);
                }}
              >
                <em className="icon ni ni-camera"></em>
                Take Photo
              </button>

              {showCamera && (
                <input
                  ref={cameraInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleCameraCapture}
                  accept="image/*"
                  capture="environment"
                />
              )}
            </>
          )}
        </div>
         <p className="mb-3 text-xs text-slate-500">
          Upload approved timesheets, work samples, or supporting documents.
        </p>
      </div>
    </div>

    {/* Uploading */}
    {uploadingFiles.length > 0 && (
      <div className="mt-5">
        <h6 className="mb-2 text-xs font-semibold uppercase text-slate-600">
          Uploading Files
        </h6>
        {uploadingFiles.map((file) => (
          <div key={file.id} className="mb-2 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <em className="icon ni ni-file text-slate-500"></em>
                <span className="truncate">{file.name}</span>
              </div>
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-indigo-600 transition-all"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Uploaded Files */}
    {uploadedFiles.length > 0 && (
      <div className="mt-5">
        <h6 className="mb-3 text-xs font-semibold uppercase text-slate-600">
          Uploaded Files
        </h6>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <em className="icon ni ni-file mb-2 text-xl text-slate-500"></em>
              <div className="truncate text-xs font-medium text-slate-700">
                {file.originalName}
              </div>
              <div className="mt-2 flex justify-center gap-1">
                <button
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                  onClick={() => downloadFile(file.id, file.originalName)}
                >
                  <em className="icon ni ni-download"></em>
                </button>
                {!isReadOnly && (
                  <button
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => deleteFile(file.id, file.originalName)}
                  >
                    <em className="icon ni ni-trash"></em>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</section>

                      )}

                      {/* 7) Approval & Automation */}
                      {clientType === "internal" && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.04)] transition hover:shadow-[0_10px_32px_rgba(0,0,0,0.07)]">

  {/* Header */}
  <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-2">
    <div className="flex items-center gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Approval & Automation
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Assign a reviewer and optionally automate invoice creation using AI.
        </p>
      </div>
    </div>
  </div>

  {/* Body */}
  <div className="p-5">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* Approver */}
      <div className="form-group">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Assign Reviewer / Approver <span className="text-red-500">*</span>
        </label>

        <select
          className="
            w-full rounded-xl border border-slate-300 bg-white
            px-3 py-2.5 text-sm font-medium text-slate-800
            focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10
            disabled:bg-slate-100 disabled:text-slate-500
          "
          value={selectedApprover}
          onChange={(e) => setSelectedApprover(e.target.value)}
          disabled={isReadOnly}
          required
        >
          <option value="">Select an approver…</option>
          {availableApprovers.map((approver) => (
            <option key={approver.id} value={approver.id}>
              {approver.name} — {approver.role}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-slate-400">
          The selected approver will review and approve this timesheet.
        </p>
      </div>

      {/* Automation */}
      <div className="relative rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">

        {/* Toggle */}
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <input
              type="checkbox"
              id="autoConvertToggle"
              checked={autoConvertToInvoice}
              onChange={(e) => setAutoConvertToInvoice(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <label htmlFor="autoConvertToggle" className="cursor-pointer">
            <div className="text-sm font-semibold text-slate-900">
              🤖 AI Invoice Automation
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              Automatically convert uploaded timesheet images into invoice-ready data using AI.
            </p>
          </label>
        </div>

        {/* Processing */}
        {conversionProcessing && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-indigo-700">
            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600"></span>
            Processing timesheet with AI engine…
          </div>
        )}

        {/* Success */}
        {conversionSuccess && invoiceData && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-2">
              <em className="icon ni ni-check-circle-fill mt-0.5 text-emerald-600"></em>
              <div>
                <h6 className="text-sm font-semibold text-emerald-900">
                  Conversion successful
                </h6>
                <p className="mt-1 text-xs text-emerald-700">
                  Your timesheet has been processed and is ready to be turned into an invoice.
                </p>

                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                  onClick={() => {
                    router.push(`/${subdomain}/invoices/create`, {
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
                  <em className="icon ni ni-file-text"></em>
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  </div>
</section>

                      )}

                      {/* 8) Actions Footer */}
                      {clientType === "internal" && (
                        <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
                          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {!isReadOnly ? (
                              <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                  type="button"
                                  className="btn-timesheet-save inline-flex items-center justify-center gap-2 rounded-lg border !border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:!bg-[#63B1D3] disabled:opacity-60"
                                  onClick={handleSaveDraft}
                                  disabled={submitting}
                                >
                                  <i className="fas fa-floppy-disk text-slate-600"></i>
                                  <span>Save For Later</span>
                                </button>
                               <button
  type="submit"
  disabled={submitting || !selectedApprover}
  className="
    inline-flex items-center justify-center gap-2
    rounded-xl px-6 py-3
    bg-sky-800 hover:bg-sky-900
    text-sm font-semibold text-white
    shadow-md transition-all
    disabled:opacity-60 disabled:cursor-not-allowed
  "
>
  {submitting ? (
    <>
      <span className="spinner-border spinner-border-sm"></span>
      Submitting...
    </>
  ) : (
    <>
     <i className="fas fa-circle-check"></i>

      Submit Timesheet
    </>
  )}
</button>

                              </div>
                            ) : (
                              <div className="alert alert-info mb-0 rounded-lg border border-blue-200 bg-blue-50 text-blue-900">
                                <em className="icon ni ni-info-fill me-2"></em>
                                <strong>Read-Only View:</strong> This timesheet cannot be modified as the invoice has been raised.
                              </div>
                            )}

                            <div className="d-flex justify-content-center">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-lg inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                onClick={() => router.push(`/${subdomain}/timesheets`)}
                              >
                                <i className="fas fa-arrow-left-long text-sm"></i>
                                Return to Timesheet Summary
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
                  fri: clientHours.reduce((sum, c) => sum + (c.hours[6] || 0), 0)},
                overtimeComment: comment,
                overtimeDays: overtimeDays,
                aiExtraction: window.timesheetExtractionMetadata || null,
                clientHoursDetails: clientHours.map((client) => ({
                  clientId: client.id,
                  clientName: client.clientName,
                  project: client.project,
                  hourlyRate: client.hourlyRate,
                  hours: client.hours}))};
              
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
                router.push(`/${subdomain}/timesheets`, { 
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
                status: error.response?.status});
              
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
  </div>
  </div>
  );
};

export default TimesheetSubmit;
