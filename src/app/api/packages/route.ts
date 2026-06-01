import { CREDIT_PACKAGES } from "@/lib/omise";

export function GET() {
  return Response.json(CREDIT_PACKAGES);
}
