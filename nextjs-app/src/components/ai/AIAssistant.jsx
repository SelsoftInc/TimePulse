'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import "./AIAssistant.css";

const AIAssistant = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Knowledge base for TimePulse modules
  const knowledgeBase = {
    dashboard: {
      title: "Dashboard",
      description:
        "Your central command center for insights and overview of all activities",
      features: [
        "Real-time analytics and metrics",
        "Quick access to key performance indicators",
        "Recent activity summaries",
        "Customizable widgets and charts",
        "Employee performance overview",
        "Project status tracking",
      ],
      tips: "Use the dashboard to get a quick overview of your business performance and identify areas that need attention."},
    timesheets: {
      title: "Timesheets",
      description:
        "Track and manage employee work hours and project time allocation",
      features: [
        "Time tracking for projects and tasks",
        "Timesheet submission and approval workflow",
        "Mobile timesheet upload via photos",
        "Automatic timesheet to invoice conversion",
        "Timesheet approval management",
        "Weekly and monthly timesheet summaries",
      ],
      tips: "Employees can submit timesheets daily, and managers can approve them through the approval workflow."},
    invoices: {
      title: "Invoices",
      description: "Create, manage, and track billing and payment processes",
      features: [
        "Generate invoices from timesheet data",
        "Custom invoice templates",
        "Payment status tracking",
        "Automated invoice generation",
        "Client billing management",
        "Payment method tracking",
      ],
      tips: "Invoices can be automatically generated from approved timesheets, saving time and reducing errors."},
    employees: {
      title: "Employee Management",
      description: "Manage your workforce, roles, and employee information",
      features: [
        "Employee profile management",
        "Role-based access control",
        "Department and team organization",
        "Employee onboarding workflow",
        "Performance tracking",
        "Document management",
      ],
      tips: "Set up proper roles and permissions to ensure employees have access to the right features."},
    clients: {
      title: "Clients",
      description: "Manage your client relationships and project assignments",
      features: [
        "Client profile management",
        "Project assignment tracking",
        "Billing information storage",
        "Client communication history",
        "Contract management",
        "Revenue tracking per client",
      ],
      tips: "Keep client information up-to-date to ensure accurate billing and project tracking."},
    vendors: {
      title: "Vendors",
      description: "Manage external vendors and service providers",
      features: [
        "Vendor profile management",
        "Service category tracking",
        "Contract and payment terms",
        "Vendor performance tracking",
        "Cost analysis and reporting",
        "Vendor communication history",
      ],
      tips: "Track vendor performance and costs to optimize your external service spending."},
    "implementation partners": {
      title: "Implementation Partners",
      description: "Manage specialized implementation and consulting partners",
      features: [
        "Partner profile and specialization tracking",
        "Project collaboration management",
        "Expertise area mapping",
        "Partner performance evaluation",
        "Resource allocation tracking",
        "Knowledge sharing facilitation",
      ],
      tips: "Use implementation partners for specialized projects that require specific expertise."},
    reports: {
      title: "Reports & Analytics",
      description: "Generate comprehensive reports and business insights",
      features: [
        "Financial reports and analytics",
        "Employee productivity reports",
        "Client profitability analysis",
        "Project performance metrics",
        "Custom report generation",
        "Data export capabilities",
      ],
      tips: "Use reports to make data-driven decisions and identify business opportunities."},
    "leave management": {
      title: "Leave Management",
      description: "Handle employee leave requests and approval workflows",
      features: [
        "Leave request submission",
        "Approval workflow management",
        "Leave balance tracking",
        "Holiday calendar integration",
        "Leave policy enforcement",
        "Team availability planning",
      ],
      tips: "Set up proper approval workflows to ensure adequate coverage during employee absences."},
    settings: {
      title: "Settings & Configuration",
      description: "Configure system settings and preferences",
      features: [
        "Company profile management",
        "User role configuration",
        "System preferences",
        "Integration settings",
        "Notification preferences",
        "Billing and subscription management",
      ],
      tips: "Regularly review and update settings to ensure optimal system performance and security."}};

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: "ai",
          content: `Hello ${
            user?.firstName || "there"
          }! 👋 I'm Pulse AI, your TimePulse guide. I can help you understand how to use different modules in your system. What would you like to know about?`,
          timestamp: new Date()},
      ]);
    }
  }, [isOpen, user?.firstName, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when component opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const findModuleInfo = (query) => {
    const lowerQuery = query.toLowerCase();

    // Direct module matches
    for (const [key, info] of Object.entries(knowledgeBase)) {
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        return { key, info };
      }
    }

    // Feature-based matches
    for (const [key, info] of Object.entries(knowledgeBase)) {
      if (
        info.features.some(
          (feature) =>
            feature.toLowerCase().includes(lowerQuery) ||
            lowerQuery.includes(feature.toLowerCase())
        )
      ) {
        return { key, info };
      }
    }

    // General help queries
    if (
      lowerQuery.includes("help") ||
      lowerQuery.includes("what") ||
      lowerQuery.includes("how")
    ) {
      return {
        key: "help",
        info: {
          title: "Available Modules",
          description: "Here are all the modules available in TimePulse:",
          modules: Object.keys(knowledgeBase)}};
    }

    return null;
  };

  const generateAIResponse = (userMessage) => {
    const moduleInfo = findModuleInfo(userMessage);

    if (moduleInfo) {
      if (moduleInfo.key === "help") {
        return `Here are the main modules in TimePulse:\n\n${moduleInfo.info.modules
          .map(
            (module) =>
              `• **${knowledgeBase[module].title}**: ${knowledgeBase[module].description}`
          )
          .join("\n\n")}\n\nAsk me about any specific module to learn more!`;
      } else {
        const { title, description, features, tips } = moduleInfo.info;
        return `## ${title}\n\n${description}\n\n**Key Features:**\n${features
          .map((feature) => `• ${feature}`)
          .join("\n")}\n\n**💡 Pro Tip:** ${tips}`;
      }
    }

    // Default responses for common queries
    if (
      userMessage.toLowerCase().includes("hello") ||
      userMessage.toLowerCase().includes("hi")
    ) {
      return "Hello! I'm here to help you navigate TimePulse. What module would you like to learn about?";
    }

    if (userMessage.toLowerCase().includes("thank")) {
      return "You're welcome! Is there anything else you'd like to know about TimePulse?";
    }

    return "I can help you understand different modules in TimePulse. Try asking about specific features like 'timesheets', 'invoices', 'employees', or 'reports'. What would you like to know?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date()};

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content);
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: aiResponse,
        timestamp: new Date()};

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    // Auto-send the question after a brief delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const quickQuestions = [
    "What is the dashboard for?",
    "How do timesheets work?",
    "Tell me about invoices",
    "How to manage employees?",
    "What are implementation partners?",
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div className="ai-assistant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-assistant-header ">
          <div className="ai-assistant-title">
            <div className="ai-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <h3>Pulse AI</h3>
              <p>Your TimePulse guide and assistant</p>
            </div>
          </div>
          <button className="ai-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="ai-assistant-body">
          <div className="ai-messages">
            {messages.map((message) => (
              <div key={message.id} className={`ai-message ${message.type}`}>
                <div className="ai-message-content">
                  {message.type === "ai" ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br>")
                          .replace(/## (.*?)(<br>|$)/g, "<h4>$1</h4>")}}
                    />
                  ) : (
                    message.content
                  )}
                </div>
                <div className="ai-message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"})}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-message ai">
                <div className="ai-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="ai-quick-questions">
              <h4>Quick Questions:</h4>
              <div className="ai-question-chips">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="ai-question-chip"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ai-assistant-footer">
          <div className="ai-input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about any TimePulse module..."
              className="ai-input"
            />
            <button
              className="ai-send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
