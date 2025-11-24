import { AuthUser } from "@supabase/supabase-js";

/**
 * Helper function to get the user ID from AuthUser object
 * AuthUser has 'id' property, but some code expects 'user_id'
 */
export function getUserId(user: AuthUser | null): string | null {
  if (!user) return null;
  return user.id;
}

/**
 * Helper function to check if user has ID (for type safety)
 */
export function hasUserId(
  user: AuthUser | null
): user is AuthUser & { id: string } {
  return user !== null && typeof user.id === "string" && user.id.length > 0;
}
