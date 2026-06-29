const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD;
const TABLE_NAME = "privacy_logs";

function json(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function requireConfig(response) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    json(response, 500, { error: "Supabase server environment variables are missing." });
    return false;
  }
  return true;
}

function checkTeacherPassword(request, response) {
  const password = request.headers["x-teacher-password"];
  if (!TEACHER_PASSWORD || password !== TEACHER_PASSWORD) {
    json(response, 401, { error: "Teacher password is incorrect." });
    return false;
  }
  return true;
}

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`;
  return fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

module.exports = {
  TABLE_NAME,
  checkTeacherPassword,
  json,
  readBody,
  requireConfig,
  supabaseFetch
};
