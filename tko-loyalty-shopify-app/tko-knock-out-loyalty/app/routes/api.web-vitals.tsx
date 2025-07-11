import { json, type ActionFunctionArgs } from "@remix-run/node";

/**
 * Web Vitals Monitoring API Endpoint
 *
 * This endpoint receives Web Vitals data from the client-side monitoring script
 * and logs it for performance tracking and optimization analysis.
 *
 * Based on official Shopify App Bridge and Web Vitals documentation:
 * - https://shopify.dev/docs/api/app-bridge-library
 * - https://web.dev/vitals/
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const webVitalData = await request.json();

    // Validate required Web Vitals data structure
    if (!webVitalData.name || typeof webVitalData.value === "undefined") {
      return json(
        { error: "Invalid Web Vitals data: missing name or value" },
        { status: 400 },
      );
    }

    // Log Web Vitals data with structured format for analysis
    console.log(`[WEB VITALS] ${webVitalData.name}:`, {
      value: webVitalData.value,
      rating: webVitalData.rating || "unknown",
      delta: webVitalData.delta || 0,
      id: webVitalData.id || "unknown",
      timestamp: webVitalData.timestamp || Date.now(),
      url: webVitalData.url || "unknown",
      metric_type: getMetricType(webVitalData.name),
      performance_status: getPerformanceStatus(
        webVitalData.name,
        webVitalData.value,
      ),
    });

    // TODO: In production, consider storing this data in a database or
    // sending to a monitoring service like DataDog, New Relic, etc.
    // For now, console logging provides immediate debugging capability

    return json({
      success: true,
      message: `Web Vital ${webVitalData.name} recorded successfully`,
    });
  } catch (error) {
    console.error(
      "[WEB VITALS ERROR] Failed to process Web Vitals data:",
      error,
    );

    return json(
      { error: "Failed to process Web Vitals data" },
      { status: 500 },
    );
  }
}

/**
 * Determine the type of Web Vitals metric
 */
function getMetricType(metricName: string): string {
  switch (metricName) {
    case "LCP":
      return "loading";
    case "INP":
      return "interactivity";
    case "CLS":
      return "visual_stability";
    case "FCP":
      return "loading";
    case "TTFB":
      return "loading";
    case "FID":
      return "interactivity";
    default:
      return "other";
  }
}

/**
 * Determine performance status based on Core Web Vitals thresholds
 * Based on official Web Vitals documentation: https://web.dev/vitals/
 */
function getPerformanceStatus(metricName: string, value: number): string {
  switch (metricName) {
    case "LCP":
      // Largest Contentful Paint thresholds (milliseconds)
      if (value <= 2500) return "good";
      if (value <= 4000) return "needs_improvement";
      return "poor";

    case "INP":
      // Interaction to Next Paint thresholds (milliseconds)
      if (value <= 200) return "good";
      if (value <= 500) return "needs_improvement";
      return "poor";

    case "CLS":
      // Cumulative Layout Shift thresholds (unitless)
      if (value <= 0.1) return "good";
      if (value <= 0.25) return "needs_improvement";
      return "poor";

    case "FCP":
      // First Contentful Paint thresholds (milliseconds)
      if (value <= 1800) return "good";
      if (value <= 3000) return "needs_improvement";
      return "poor";

    case "TTFB":
      // Time to First Byte thresholds (milliseconds)
      if (value <= 800) return "good";
      if (value <= 1800) return "needs_improvement";
      return "poor";

    default:
      return "unknown";
  }
}

// Only allow POST requests for Web Vitals data
export async function loader() {
  return json(
    { error: "Method not allowed. Use POST to submit Web Vitals data." },
    { status: 405 },
  );
}
