import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { authLimiter, apiWriteLimiter, uploadLimiter } from "@/lib/rate-limit";

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

async function checkRateLimit(
  limiter: typeof authLimiter,
  key: string
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(key);
  if (!success) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans un moment." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getIp(request);

  // Only apply rate limiting if Upstash is configured
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Auth endpoints — strict limit
    if (
      pathname.startsWith("/api/invitations") &&
      method === "POST"
    ) {
      const limited = await checkRateLimit(authLimiter, `${ip}:invitations`);
      if (limited) return limited;
    }

    // Avatar upload — very strict limit
    if (pathname.startsWith("/api/users/me/avatar")) {
      const limited = await checkRateLimit(uploadLimiter, `${ip}:upload`);
      if (limited) return limited;
    }

    // All other API write operations
    if (
      pathname.startsWith("/api/") &&
      (method === "POST" || method === "PATCH" || method === "DELETE")
    ) {
      const limited = await checkRateLimit(apiWriteLimiter, `${ip}:write`);
      if (limited) return limited;
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
