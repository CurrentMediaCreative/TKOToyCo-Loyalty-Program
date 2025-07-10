import type { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🔔 WEBHOOK TEST ENDPOINT HIT!");
  console.log("Method:", request.method);
  console.log("URL:", request.url);
  console.log("Headers:", Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.text();
    console.log("Body:", body);
  } catch (error) {
    console.log("Error reading body:", error);
  }

  return new Response("Webhook test received", { status: 200 });
};
