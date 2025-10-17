const fs = require("fs");

// Read the models file
let content = fs.readFileSync(
  "/Users/selva/Projects/TimePulse/server/models/index.js",
  "utf8"
);

// Remove all association blocks that are not at the very end
// Keep only the associations that are after the "// ASSOCIATIONS" comment at the end

// Split by lines
const lines = content.split("\n");
const cleanedLines = [];
let inOldAssociations = false;
let foundEndAssociations = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check if we're starting old associations (before the final ASSOCIATIONS section)
  if (line.includes("// Timesheet associations") && !foundEndAssociations) {
    inOldAssociations = true;
    cleanedLines.push("// All associations moved to end of file");
    continue;
  }

  // Check if we've reached the final ASSOCIATIONS section
  if (line.includes("// ASSOCIATIONS") && i > 900) {
    foundEndAssociations = true;
    inOldAssociations = false;
  }

  // Skip lines that are part of old associations
  if (inOldAssociations && !foundEndAssociations) {
    continue;
  }

  // Keep all other lines
  cleanedLines.push(line);
}

// Write the cleaned content
fs.writeFileSync(
  "/Users/selva/Projects/TimePulse/server/models/index.js",
  cleanedLines.join("\n")
);

console.log("Cleaned associations from models file");
