import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { syncStoreCreditForAllCustomers } from "../services/storeCreditSync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    console.log("🚀 Starting store credit sync for all customers...");
    
    const result = await syncStoreCreditForAllCustomers(request);
    
    if (result.success) {
      console.log("✅ Store credit sync completed successfully");
      return json({
        success: true,
        message: `Store credit sync completed successfully. Processed ${result.ordersProcessed} orders and updated ${result.customersAffected} customers.`,
        data: {
          ordersProcessed: result.ordersProcessed,
          customersAffected: result.customersAffected,
          totalStoreCreditFound: result.totalStoreCreditFound,
          customerUpdates: result.customerUpdates
        }
      });
    } else {
      console.error("❌ Store credit sync completed with errors:", result.errors);
      return json({
        success: false,
        message: `Store credit sync completed with ${result.errors.length} errors. Processed ${result.ordersProcessed} orders and updated ${result.customersAffected} customers.`,
        errors: result.errors,
        data: {
          ordersProcessed: result.ordersProcessed,
          customersAffected: result.customersAffected,
          totalStoreCreditFound: result.totalStoreCreditFound,
          customerUpdates: result.customerUpdates
        }
      }, { status: 207 }); // 207 Multi-Status for partial success
    }
  } catch (error) {
    console.error("❌ Store credit sync failed:", error);
    return json({
      success: false,
      message: "Store credit sync failed",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
