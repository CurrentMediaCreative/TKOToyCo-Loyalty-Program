/**
 * Wait script for MCP response handling
 *
 * This script provides a simple utility to wait for a specified duration
 * before continuing execution. It's primarily used in the MCP utilization
 * process to wait between sending a request and checking for a response.
 *
 * Usage:
 * - From command line: node scripts/wait.js [milliseconds]
 * - Default wait time is 120000ms (2 minutes) if not specified
 */

// Get wait time from command line argument or use default (2 minutes)
const waitTime = process.argv[2] ? parseInt(process.argv[2], 10) : 120000;

// Validate wait time
if (isNaN(waitTime) || waitTime <= 0) {
  console.error("Error: Wait time must be a positive number in milliseconds");
  process.exit(1);
}

// Format time for display
const formatTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

// Display start message
console.log(`Waiting for ${formatTime(waitTime)}...`);

// Start time for progress tracking
const startTime = Date.now();

// Update progress every second
const interval = setInterval(() => {
  const elapsed = Date.now() - startTime;
  const remaining = waitTime - elapsed;

  if (remaining <= 0) {
    clearInterval(interval);
    return;
  }

  const percent = Math.floor((elapsed / waitTime) * 100);
  const progressBar =
    "[" +
    "#".repeat(Math.floor(percent / 5)) +
    " ".repeat(20 - Math.floor(percent / 5)) +
    "]";

  process.stdout.write(
    `\r${progressBar} ${percent}% (${formatTime(remaining)} remaining)`
  );
}, 1000);

// Wait for the specified time
setTimeout(() => {
  clearInterval(interval);
  process.stdout.write("\r" + " ".repeat(60) + "\r"); // Clear the progress line
  console.log(`Wait completed after ${formatTime(waitTime)}`);
  process.exit(0);
}, waitTime);
