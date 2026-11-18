import { createClient } from "npm:@supabase/supabase-js@2";

const authDomain = "accounts.investsphere.invalid";
const siteUrl = Deno.env.get("SITE_URL") ?? "https://torvexiaai.vercel.app";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const mailFrom = Deno.env.get("MAIL_FROM")!;
const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  action?: string;
  username?: string;
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  country?: string;
  referral_code?: string | null;
  user_id?: string;
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeUsername = (value: string) => value.trim().toLowerCase();
const isValidUsername = (value: string) => /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value);
const authEmailForUsername = (username: string) => `${username}@${authDomain}`;

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const hashRecipient = async (email: string) => {
  const encoded = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sendEmail = async (to: string, subject: string, actionLink: string, heading: string) => {
  const safeHeading = escapeHtml(heading);
  const safeLink = escapeHtml(actionLink);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [to],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>${safeHeading}</h2><p>Use the secure link below to continue. If you did not request this, you can ignore this email.</p><p><a href="${safeLink}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">Continue</a></p><p style="font-size:12px;color:#666">This link is time-limited and can only be used once.</p></div>`,
      text: `${heading}\n\nUse this secure link to continue:\n${actionLink}\n\nIf you did not request this, you can ignore this email.`,
    }),
  });

  if (!response.ok) {
    console.error("Email provider rejected message", response.status);
    throw new Error("Email delivery failed. Please try again later.");
  }
};

const sendAuthEmail = async (
  email: string,
  username: string,
  type: "magiclink" | "recovery",
) => {
  const authEmail = authEmailForUsername(username);
  const generated = await serviceClient.auth.admin.generateLink({
    type,
    email: authEmail,
    options: { redirectTo: `${siteUrl}/dashboard` },
  });

  if (generated.error) {
    console.error(`Auth link generation failed for ${type}`, generated.error.message);
    throw new Error("Could not generate the requested account email. Please try again.");
  }

  await sendEmail(
    email,
    type === "magiclink" ? "Confirm your account" : "Reset your password",
    generated.data.properties.action_link,
    type === "magiclink" ? "Confirm your email address" : "Reset your password",
  );
};

const getProfileByUsernameAndEmail = async (usernameInput: string, emailInput: string) => {
  const username = normalizeUsername(usernameInput);
  const email = emailInput.trim().toLowerCase();
  const { data, error } = await serviceClient
    .from("profiles")
    .select("user_id, username, email")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Account lookup failed", error.message);
    throw new Error("Unable to process this request right now.");
  }
  return data && data.email?.trim().toLowerCase() === email ? data : null;
};

const isAuthorizedAdmin = async (request: Request) => {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: isAdmin, error: roleError } = await serviceClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });

  if (roleError || isAdmin !== true) return null;
  return userData.user;
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse(405, { success: false, error: "Method not allowed" });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { success: false, error: "Invalid request body" });
  }

  // Only the email-based actions need Resend. Signup does not.
  if (body.action !== "signup" && (!resendApiKey || !mailFrom)) {
    return jsonResponse(503, { success: false, error: "Account email delivery is not configured" });
  }

  try {
    if (body.action === "signup") {
      const username = normalizeUsername(body.username || "");
      const email = (body.email || "").trim().toLowerCase();
      const password = body.password || "";
      if (!isValidUsername(username) || !email || password.length < 6) {
        return jsonResponse(400, { success: false, error: "Enter a valid username, email, and password" });
      }

      const { data: existingUser, error: lookupError } = await serviceClient
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      if (lookupError) throw new Error("Unable to check username availability");
      if (existingUser) return jsonResponse(409, { success: false, error: "That username is already taken" });

      // Create the account already confirmed, so no confirmation email is needed.
      const created = await serviceClient.auth.admin.createUser({
        email: authEmailForUsername(username),
        password,
        email_confirm: true,
        user_metadata: {
          username,
          contact_email: email,
          full_name: (body.full_name || "").trim(),
          phone: (body.phone || "").trim(),
          country: (body.country || "").trim(),
          referral_code: body.referral_code || null,
        },
      });

      if (created.error) {
        console.error("Account creation failed", created.error.message);
        return jsonResponse(400, { success: false, error: "Could not create account. The username may already be in use." });
      }

      return jsonResponse(200, { success: true, email_sent: false });
    }

    if (body.action === "resend-confirmation" || body.action === "reset-password") {
      const username = normalizeUsername(body.username || "");
      const email = (body.email || "").trim().toLowerCase();
      if (!isValidUsername(username) || !email) {
        return jsonResponse(400, { success: false, error: "Enter your username and account email" });
      }

      const recipientHash = await hashRecipient(email);
      const action = body.action;
      const { data: allowed, error: limitError } = await serviceClient.rpc("consume_account_auth_email_limit", {
        p_recipient_hash: recipientHash,
        p_action: action,
        p_max_requests: action === "reset-password" ? 3 : 3,
        p_window_seconds: 900,
      });
      if (limitError) throw new Error("Unable to process this request right now");
      if (!allowed) return jsonResponse(429, { success: false, error: "Too many requests. Try again later." });

      const profile = await getProfileByUsernameAndEmail(username, email);
      if (profile) {
        if (action === "resend-confirmation") {
          const { data: userResult } = await serviceClient.auth.admin.getUserById(profile.user_id);
          if (!userResult.user?.email_confirmed_at) {
            await sendAuthEmail(email, username, "magiclink");
          }
        } else {
          await sendAuthEmail(email, username, "recovery");
        }
      }
      return jsonResponse(200, { success: true });
    }

    if (body.action === "admin-resend-confirmation" || body.action === "admin-reset-password") {
      const admin = await isAuthorizedAdmin(request);
      if (!admin) return jsonResponse(403, { success: false, error: "Admin access required" });
      if (!body.user_id) return jsonResponse(400, { success: false, error: "User ID is required" });

      const { data: profile, error: profileError } = await serviceClient
        .from("profiles")
        .select("user_id, username, email")
        .eq("user_id", body.user_id)
        .maybeSingle();
      if (profileError) throw new Error("Unable to load user account");
      if (!profile?.email) return jsonResponse(404, { success: false, error: "User email not found" });

      const { data: authResult, error: authError } = await serviceClient.auth.admin.getUserById(profile.user_id);
      if (authError || !authResult.user?.email) throw new Error("Unable to load authentication account");
      const authEmail = authResult.user.email;

      if (body.action === "admin-resend-confirmation" && authResult.user.email_confirmed_at) {
        return jsonResponse(409, { success: false, error: "This account is already confirmed" });
      }

      const recipientHash = await hashRecipient(profile.email);
      const { data: allowed, error: limitError } = await serviceClient.rpc("consume_account_auth_email_limit", {
        p_recipient_hash: recipientHash,
        p_action: body.action,
        p_max_requests: 3,
        p_window_seconds: 900,
      });
      if (limitError) throw new Error("Unable to process this request right now");
      if (!allowed) return jsonResponse(429, { success: false, error: "Too many requests. Try again later." });

      if (body.action === "admin-resend-confirmation") {
        const generated = await serviceClient.auth.admin.generateLink({
          type: "magiclink",
          email: authEmail,
          options: { redirectTo: `${siteUrl}/dashboard` },
        });
        if (generated.error) throw new Error("Could not generate a confirmation email");
        await sendEmail(profile.email, "Confirm your account", generated.data.properties.action_link, "Confirm your email address");
      } else {
        const generated = await serviceClient.auth.admin.generateLink({
          type: "recovery",
          email: authEmail,
          options: { redirectTo: `${siteUrl}/reset-password` },
        });
        if (generated.error) throw new Error("Could not generate a password reset email");
        await sendEmail(profile.email, "Reset your password", generated.data.properties.action_link, "Reset your password");
      }

      return jsonResponse(200, { success: true });
    }

    return jsonResponse(400, { success: false, error: "Unknown account action" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account request failed";
    console.error("Account email request failed", message);
    return jsonResponse(500, { success: false, error: message });
  }
});