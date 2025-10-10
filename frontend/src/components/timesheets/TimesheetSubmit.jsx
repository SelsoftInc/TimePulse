import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice,
} from "../../services/engineService";
import {
  extractTimesheetData,
  validateExtractedData,
} from "../../services/timesheetExtractor";
import { API_BASE } from "../../config/api";
import axios from "axios";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
  const [attachments, setAttachments] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // AI Processing state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProcessedData, setAiProcessedData] = useState(null);
  const [showAiUpload, setShowAiUpload] = useState(false);

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

  // Function to determine current client type based on clients with hours
  const getCurrentClientType = () => {
    // If no clients loaded yet, default to internal
    if (clientHours.length === 0) {
      return "internal";
    }

    const clientsWithHours = clientHours.filter((client) =>
      client.hours.some((hour) => hour > 0)
    );

    if (clientsWithHours.length === 0) {
      // Default to internal if no hours entered yet
      // Check the first client's type
      const firstClientType = clientHours[0]?.clientType || "internal";
      console.log(
        "🔍 No hours entered yet, using first client type:",
        firstClientType
      );
      return firstClientType;
    }

    // Check if any client with hours is external
    const hasExternalClient = clientsWithHours.some(
      (client) => client.clientType === "external"
    );

    console.log("🔍 Client type detection:", {
      clientsWithHours: clientsWithHours.length,
      hasExternalClient,
      clientTypes: clientsWithHours.map((c) => c.clientType),
    });

    if (hasExternalClient) {
      return "external";
    }

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
          console.log("📥 Clients API response:", response.data);

          if (response.data.success && response.data.clients) {
            // For Selvakumar, show only Cognizant
            // Since clientId field doesn't exist in Employee model, we'll filter by client name
            console.log("🔍 User email:", user.email);

            let clientData = [];

            // Check if user is Selvakumar
            if (
              user.email === "selvakumar@selsoftinc.com" ||
              user.email.includes("selvakumar")
            ) {
              // Show only Cognizant
              // Backend returns 'name' not 'clientName'
              const cognizant = response.data.clients.find(
                (c) => c.name === "Cognizant" || c.clientName === "Cognizant"
              );
              if (cognizant) {
                const clientName = cognizant.name || cognizant.clientName;
                clientData = [
                  {
                    id: cognizant.id,
                    clientName: clientName,
                    project: clientName + " Project",
                    hourlyRate: cognizant.hourlyRate || 0,
                    clientType: cognizant.clientType || "internal",
                    hours: Array(7).fill(0),
                  },
                ];
                console.log(
                  "✅ Showing only Cognizant for Selvakumar:",
                  clientData
                );
              } else {
                console.error("❌ Cognizant not found in clients list");
                console.error("Available clients:", response.data.clients);
                // Fallback to all clients
                clientData = response.data.clients.map((client) => ({
                  id: client.id,
                  clientName: client.name || client.clientName,
                  project: (client.name || client.clientName) + " Project",
                  hourlyRate: client.hourlyRate || 0,
                  clientType: client.clientType || "internal",
                  hours: Array(7).fill(0),
                }));
              }
            } else {
              // For other users, show all clients
              console.log("⚠️ Showing all clients for other users");
              clientData = response.data.clients.map((client) => ({
                id: client.id,
                clientName: client.name || client.clientName,
                project: (client.name || client.clientName) + " Project",
                hourlyRate: client.hourlyRate || 0,
                clientType: client.clientType || "internal",
                hours: Array(7).fill(0),
              }));
            }

            console.log("📊 Final clientHours to be set:", clientData);
            setClientHours(clientData);
          } else {
            console.error("❌ Clients API returned no data");
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
              
              // Load daily hours if available
              if (ts.dailyHours) {
                // Parse dailyHours and populate clientHours
                const parsedHours = typeof ts.dailyHours === 'string' 
                  ? JSON.parse(ts.dailyHours) 
                  : ts.dailyHours;
                
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
                }
              }
            } else {
              console.error('❌ Failed to load timesheet');
              setError('Failed to load timesheet data');
            }
          } catch (error) {
            console.error('❌ Error loading timesheet:', error);
            setError('Failed to load timesheet data');
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
        setError("Failed to load timesheet data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTimesheetData();
  }, [weekId, isEmployee, user]);

  const handleWeekChange = (selectedWeekValue) => {
    setSelectedWeek(selectedWeekValue);
    setWeek(selectedWeekValue);

    // Clear AI processed data when week changes
    setAiProcessedData(null);
    setShowAiUpload(false);

    // Check if selected week is read-only
    const selectedWeekData = availableWeeks.find(
      (w) => w.value === selectedWeekValue
    );
    if (selectedWeekData && selectedWeekData.readonly) {
      setIsReadOnly(true);
      // Load existing timesheet data for read-only view
      // In a real app, this would fetch from API
    } else {
      setIsReadOnly(false);
      // Reset form for new timesheet
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
    const newAttachments = [];
    const newPreviews = [];

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/heic",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(
          "Invalid file type. Please upload images (JPG, PNG, HEIC) or documents (PDF, DOC, DOCX)."
        );
        return;
      }

      newAttachments.push(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            file: file.name,
            url: e.target.result,
            type: file.type,
          });
          setPreviewImages((prev) => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
      } else {
        newPreviews.push({
          file: file.name,
          url: null,
          type: file.type,
        });
        setPreviewImages((prev) => [...prev, ...newPreviews]);
      }
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    setError("");

    // Auto-convert to invoice if enabled and file is an image or document
    if (autoConvertToInvoice && files.length > 0) {
      const file = files[0]; // Process the first file
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate approver selection
    if (!selectedApprover) {
      showToast(
        "Please select an approver/reviewer before submitting",
        "error"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validate based on client type
    if (clientType === "internal") {
      // For internal clients, validate hours entry
      const totalClientHours = getGrandTotal();
      if (totalClientHours === 0) {
        showToast(
          "Please enter at least one hour for any client or holiday/time off",
          "error"
        );
        return;
      }
    } else {
      // For external clients, validate file upload
      if (!externalTimesheetFile) {
        showToast("Please upload the client submitted timesheet file", "error");
        return;
      }
    }

    // Validate employee selection for non-employee roles
    if (!isEmployee() && !selectedEmployee) {
      showToast("Please select an employee before submitting", "error");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      console.log("📤 Submitting timesheet with approver:", selectedApprover);

      // Get employee ID
      const employeeId = !isEmployee() ? selectedEmployee : user.employeeId;

      if (!employeeId) {
        showToast(
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
      const submissionData = {
        tenantId: user.tenantId,
        employeeId: employeeId,
        weekStart: weekStart,
        weekEnd: weekEnd,
        clientId: clientHours.length > 0 ? clientHours[0].id : null,
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
        "/api/timesheets/submit",
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
        showToast(
          `Timesheet submitted successfully! An approval request has been sent to ${approverName}.`,
          "success"
        );

        // Navigate immediately to timesheet summary
        console.log("🔄 Navigating to timesheet summary...");
        navigate(`/${subdomain}/timesheets`, { replace: true });
      } else {
        showToast(
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

      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setError("");

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

      setSuccess("Draft saved successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/${subdomain}/dashboard`);
      }, 2000);
    } catch (error) {
      console.error("Error saving draft:", error);
      setError("Failed to save draft. Please try again.");
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
      setError("File size must be less than 10MB");
      return;
    }

    setError("");
    setAiProcessing(true);

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
      setError(errorMessage);
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
      const clientId = matchingClient?.id || "1";
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

    // Clear AI processed data and hide upload section
    setAiProcessedData(null);
    setShowAiUpload(false);
    showToast(
      "AI extracted data has been applied to your timesheet. Please review and submit.",
      "success"
    );
  };

  const discardAiProcessedData = () => {
    setAiProcessedData(null);
    setShowAiUpload(false);
    setSuccess("");
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
      setError("Please upload a valid file (Image, PDF, or Word document)");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setExternalTimesheetFile(file);
    setError("");
    setSuccess(`External timesheet file "${file.name}" uploaded successfully`);
  };

  const removeExternalTimesheetFile = () => {
    setExternalTimesheetFile(null);
  };

  // Auto-conversion function
  const processTimesheetAndConvertToInvoice = async (file) => {
    setConversionProcessing(true);
    setError("");
    setConversionSuccess(false);

    try {
      // Step 1: Process timesheet with AI engine
      console.log("Processing timesheet with AI engine...");
      setSuccess("🔄 Processing timesheet with AI engine...");

      const engineResponse = await uploadAndProcessTimesheet(file);

      // Step 2: Transform to invoice format
      console.log("Converting to invoice format...");
      setSuccess("🔄 Converting to invoice format...");

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
      setSuccess("✅ Timesheet processed successfully! Invoice data is ready.");

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
      setError(`❌ Auto-conversion failed: ${error.message}`);
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
                      </div>
                      {isReadOnly && (
                        <div className="form-note text-warning mt-2">
                          <em className="icon ni ni-info"></em>
                          This timesheet is read-only because the invoice has
                          been raised.
                        </div>
                      )}
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
                              <button
                                type="button"
                                className="ai-upload-toggle-btn"
                                onClick={() => setShowAiUpload(!showAiUpload)}
                                disabled={isReadOnly}
                              >
                                {showAiUpload ? "Hide" : "Upload & Extract"}
                              </button>
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

                            {showAiUpload && !aiProcessing && (
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

                                <div className="ai-upload-toggle-section">
                                  <div
                                    className={`ai-upload-toggle-switch ${
                                      showAiUpload ? "on" : "off"
                                    }`}
                                  >
                                    <div className="ai-upload-toggle-slider"></div>
                                  </div>
                                  <div>
                                    <div className="ai-upload-toggle-label">
                                      <i className="fa fa-robot"></i>
                                      Auto-convert timesheet to invoice using AI
                                    </div>
                                    <div className="ai-upload-toggle-description">
                                      When enabled, uploaded timesheet images
                                      will be automatically processed and
                                      converted to invoice format
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

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

                          {previewImages.length > 0 && (
                            <div className="attached-files mt-3">
                              <h6 className="title mb-2">Attached Files</h6>
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
    </div>
  );
};

export default TimesheetSubmit;
