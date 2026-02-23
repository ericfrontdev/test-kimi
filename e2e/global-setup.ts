import { createClient } from "@supabase/supabase-js";
import { TEST_USER, LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY } from "./fixtures/test-config";

export default async function globalSetup() {
  const admin = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete existing test user if any (clean slate)
  const { data: existing } = await admin.auth.admin.listUsers();
  const existingUser = existing?.users.find((u) => u.email === TEST_USER.email);
  if (existingUser) {
    await admin.auth.admin.deleteUser(existingUser.id);
  }

  // Create the test user
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
    user_metadata: { name: TEST_USER.name },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  // Create the user row in public.users (mirrors what ensureUserExists does)
  await admin.from("users").upsert({
    id: data.user.id,
    email: TEST_USER.email,
    name: TEST_USER.name,
  });

  console.log(`✓ Test user created: ${TEST_USER.email}`);
}
