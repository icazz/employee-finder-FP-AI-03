import { getCsvStore } from "@/lib/csv-store";

export async function GET() {
  const csvStore = getCsvStore();

  if (!csvStore) {
    return Response.json(
      { detail: "No CSV in memory. Upload files first." },
      { status: 404 }
    );
  }

  return new Response(csvStore, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=documents.csv",
    },
  });
}
