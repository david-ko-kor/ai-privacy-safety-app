const { TABLE_NAME, checkTeacherPassword, json, requireConfig, supabaseFetch } = require("./_supabase");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    return json(response, 405, { error: "Method not allowed." });
  }
  if (!requireConfig(response)) return;
  if (!checkTeacherPassword(request, response)) return;

  const supabaseResponse = await supabaseFetch(`${TABLE_NAME}?select=*&order=created_at.desc`, {
    method: "GET",
    headers: { Prefer: "" }
  });
  const data = await supabaseResponse.json().catch(() => null);
  if (!supabaseResponse.ok) {
    return json(response, supabaseResponse.status, { error: data?.message || "Read failed." });
  }
  return json(response, 200, { data: data || [] });
};
