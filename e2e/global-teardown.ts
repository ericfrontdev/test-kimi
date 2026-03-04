import { createClient } from "@supabase/supabase-js";
import { TEST_USER, LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY } from "./fixtures/test-config";

export default async function globalTeardown() {
  const admin = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete from auth.users
  const { data: existing } = await admin.auth.admin.listUsers();
  const user = existing?.users.find((u) => u.email === TEST_USER.email);
  if (user) {
    await admin.auth.admin.deleteUser(user.id);
  }

  // Also delete from public.users (by email, regardless of UUID)
  await admin.from("users").delete().eq("email", TEST_USER.email);

  console.log(`✓ Test user cleaned up: ${TEST_USER.email}`);
}
