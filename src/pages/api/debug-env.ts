export const prerender = false;

export async function GET() {
  return new Response(
    JSON.stringify({
      MAINTENANCE_MODE: process.env.MAINTENANCE_MODE ?? 'undefined',
      NODE_ENV: process.env.NODE_ENV,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
