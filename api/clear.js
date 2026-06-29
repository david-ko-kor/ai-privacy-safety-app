const { TABLE_NAME, checkTeacherPassword, json, requireConfig, supabaseFetch } = require("./_supabase");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return json(response, 405, { error: "Method not allowed." });
  }
  if (!requireConfig(response)) return;
  if (!checkTeacherPassword(request, response)) return;

  const supabaseResponse = await supabaseFetch(`${TABLE_NAME}?student_no=gte.1`, {
    method: "DELETE"
  });
  const data = await supabaseResponse.json().catch(() => null);
  if (!supabaseResponse.ok) {
    return json(response, supabaseResponse.status, { error: data?.message || "Delete failed." });
  }
  return json(response, 200, { ok: true });
};
