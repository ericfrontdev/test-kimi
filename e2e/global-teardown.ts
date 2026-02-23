import { createClient } from "@supabase/supabase-js";
import { TEST_USER, LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY } from "./fixtures/test-config";

export default async function globalTeardown() {
  const admin = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin.auth.admin.listUsers();
  const user = existing?.users.find((u) => u.email === TEST_USER.email);
  if (user) {
    await admin.auth.admin.deleteUser(user.id);
    console.log(`✓ Test user cleaned up: ${TEST_USER.email}`);
  }
}
