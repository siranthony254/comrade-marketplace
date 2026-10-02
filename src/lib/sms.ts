// src/lib/sms.ts
// SMS via Africa's Talking. With no credentials (local dev) the message is logged
// to the console instead. In production, missing credentials are an error, never silent.
//
// UNTESTED against the live API — verify with an Africa's Talking sandbox account.

const AT_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_USER = process.env.AFRICASTALKING_USERNAME;

export const smsIsConfigured = Boolean(AT_KEY && AT_USER);

export async function sendSms(phone: string, message: string): Promise<void> {
  if (!smsIsConfigured) {
    if (process.env.NODE_ENV === "production") throw new Error("SMS provider is not configured");
    console.log(`\n[sms:dev] to +${phone}: ${message}\n`);
    return;
  }

  const host = AT_USER === "sandbox" ? "api.sandbox.africastalking.com" : "api.africastalking.com";
  const res = await fetch(`https://${host}/version1/messaging`, {
    method: "POST",
    headers: {
      apiKey: AT_KEY!,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: AT_USER!, to: `+${phone}`, message }).toString(),
  });
  if (!res.ok) throw new Error(`SMS send failed: HTTP ${res.status}`);
}
