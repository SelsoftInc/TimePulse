/**
 * Invoice PDF Generation Service
 * Generates professional PDF invoices from invoice data
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class InvoicePDFService {
  /**
   * Format currency
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   */
  static formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  }

  /**
   * Format date
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  static formatDate(date) {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  /**
   * Generate invoice PDF
   * @param {Object} invoiceData - Complete invoice data
   * @param {string} outputPath - Path to save PDF (optional)
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateInvoicePDF(invoiceData, outputPath = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
        });

        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // If output path provided, also save to file
        if (outputPath) {
          const writeStream = fs.createWriteStream(outputPath);
          doc.pipe(writeStream);
        }

        // ===== HEADER SECTION =====
        this.generateHeader(doc, invoiceData);

        // ===== INVOICE INFO SECTION =====
        this.generateInvoiceInfo(doc, invoiceData);

        // ===== BILLING SECTION =====
        this.generateBillingSection(doc, invoiceData);

        // ===== LINE ITEMS TABLE =====
        this.generateLineItemsTable(doc, invoiceData);

        // ===== SUMMARY SECTION =====
        this.generateSummary(doc, invoiceData);

        // ===== FOOTER SECTION =====
        this.generateFooter(doc, invoiceData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate header with company logo and title
   */
  static generateHeader(doc, invoiceData) {
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#667eea")
      .text("INVOICE", 50, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text("TimePulse Timesheet Management", 50, 85);

    // Draw header line
    doc
      .strokeColor("#667eea")
      .lineWidth(2)
      .moveTo(50, 110)
      .lineTo(550, 110)
      .stroke();

    doc.moveDown(2);
  }

  /**
   * Generate invoice information section
   */
  static generateInvoiceInfo(doc, invoiceData) {
    const startY = 130;

    // Invoice Number
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Invoice Number:", 400, startY);
    doc
      .font("Helvetica")
      .fillColor("#667eea")
      .text(invoiceData.invoiceNumber || "N/A", 400, startY + 15);

    // Invoice Date
    doc
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Invoice Date:", 400, startY + 35);
    doc
      .font("Helvetica")
      .fillColor("#666666")
      .text(this.formatDate(invoiceData.invoiceDate), 400, startY + 50);

    // Due Date
    doc
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Due Date:", 400, startY + 70);
    doc
      .font("Helvetica")
      .fillColor("#666666")
      .text(this.formatDate(invoiceData.dueDate), 400, startY + 85);

    // Payment Terms
    doc
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Payment Terms:", 400, startY + 105);
    doc
      .font("Helvetica")
      .fillColor("#666666")
      .text(invoiceData.paymentTerms || "Net 30", 400, startY + 120);
  }

  /**
   * Generate billing section (Billed To)
   */
  static generateBillingSection(doc, invoiceData) {
    const startY = 130;

    // Billed To Section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("BILLED TO:", 50, startY);

    let currentY = startY + 20;

    // Vendor/Client Name
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(invoiceData.vendorName || invoiceData.clientName || "N/A", 50, currentY);
    currentY += 18;

    // Email
    if (invoiceData.vendorEmail || invoiceData.clientEmail) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(invoiceData.vendorEmail || invoiceData.clientEmail, 50, currentY);
      currentY += 15;
    }

    // Address
    if (invoiceData.vendorAddress) {
      doc.text(invoiceData.vendorAddress, 50, currentY);
      currentY += 15;
    }

    // City, State
    if (invoiceData.vendorCity) {
      doc.text(invoiceData.vendorCity, 50, currentY);
      currentY += 15;
    }

    // Phone
    if (invoiceData.vendorPhone) {
      doc.text(`Phone: ${invoiceData.vendorPhone}`, 50, currentY);
      currentY += 15;
    }

    // Employee Information
    if (invoiceData.employeeName) {
      doc.moveDown(1);
      currentY += 20;

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text("EMPLOYEE:", 50, currentY);
      currentY += 20;

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(invoiceData.employeeName, 50, currentY);
      currentY += 18;

      if (invoiceData.employeeEmail) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#666666")
          .text(invoiceData.employeeEmail, 50, currentY);
        currentY += 15;
      }

      if (invoiceData.employeeRole) {
        doc.text(invoiceData.employeeRole, 50, currentY);
        currentY += 15;
      }
    }
  }

  /**
   * Generate line items table
   */
  static generateLineItemsTable(doc, invoiceData) {
    const tableTop = 380;
    const lineItems = invoiceData.lineItems || [];

    // Table Header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .rect(50, tableTop, 500, 25)
      .fill("#667eea");

    doc
      .fillColor("#ffffff")
      .text("Description", 60, tableTop + 8, { width: 200 })
      .text("Hours", 270, tableTop + 8, { width: 60, align: "right" })
      .text("Rate", 340, tableTop + 8, { width: 80, align: "right" })
      .text("Amount", 430, tableTop + 8, { width: 110, align: "right" });

    // Table Rows
    let currentY = tableTop + 30;
    doc.fillColor("#333333").font("Helvetica");

    lineItems.forEach((item, index) => {
      const rowY = currentY + index * 60;

      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(50, rowY - 5, 500, 60).fill("#f8f9fa");
      }

      // Description
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(item.description || "Service", 60, rowY, { width: 200 });

      // Hours
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(
          parseFloat(item.hours || item.hoursWorked || 0).toFixed(2),
          270,
          rowY,
          { width: 60, align: "right" }
        );

      // Rate
      doc.text(
        this.formatCurrency(item.rate || item.hourlyRate || 0),
        340,
        rowY,
        { width: 80, align: "right" }
      );

      // Amount
      doc
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(
          this.formatCurrency(item.amount || item.total || 0),
          430,
          rowY,
          { width: 110, align: "right" }
        );
    });

    // Update currentY for summary section
    return currentY + lineItems.length * 60 + 20;
  }

  /**
   * Generate summary section
   */
  static generateSummary(doc, invoiceData) {
    const summaryTop = 550;

    // Draw summary box
    doc
      .strokeColor("#e0e0e0")
      .lineWidth(1)
      .rect(350, summaryTop, 200, 100)
      .stroke();

    // Subtotal
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text("Subtotal:", 360, summaryTop + 15);
    doc
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text(
        this.formatCurrency(invoiceData.subtotal),
        450,
        summaryTop + 15,
        { width: 90, align: "right" }
      );

    // Tax
    doc
      .font("Helvetica")
      .fillColor("#666666")
      .text("Tax:", 360, summaryTop + 35);
    doc
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text(
        this.formatCurrency(invoiceData.taxAmount || 0),
        450,
        summaryTop + 35,
        { width: 90, align: "right" }
      );

    // Total
    doc
      .strokeColor("#667eea")
      .lineWidth(1)
      .moveTo(360, summaryTop + 55)
      .lineTo(540, summaryTop + 55)
      .stroke();

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#667eea")
      .text("TOTAL:", 360, summaryTop + 65);
    doc
      .fontSize(14)
      .text(
        this.formatCurrency(invoiceData.totalAmount),
        450,
        summaryTop + 65,
        { width: 90, align: "right" }
      );
  }

  /**
   * Generate footer
   */
  static generateFooter(doc, invoiceData) {
    const footerTop = 700;

    // Notes section
    if (invoiceData.notes) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text("Notes:", 50, footerTop);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text(invoiceData.notes, 50, footerTop + 15, { width: 500 });
    }

    // Footer line
    doc
      .strokeColor("#e0e0e0")
      .lineWidth(1)
      .moveTo(50, 750)
      .lineTo(550, 750)
      .stroke();

    // Footer text
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#999999")
      .text(
        "Thank you for your business! Please remit payment by the due date.",
        50,
        760,
        { align: "center", width: 500 }
      );

    doc.text(
      `Generated on ${this.formatDate(new Date())} | Invoice #${invoiceData.invoiceNumber}`,
      50,
      775,
      { align: "center", width: 500 }
    );
  }
}

module.exports = InvoicePDFService;
