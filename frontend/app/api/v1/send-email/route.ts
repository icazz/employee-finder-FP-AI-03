import { sendGmail } from "@/lib/email-sender";

export async function POST(request: Request) {
  const { to_email, subject, content, sender_name } = await request.json();
  const result = sendGmail(to_email, subject, content, sender_name || "");
  return Response.json(result);
}
