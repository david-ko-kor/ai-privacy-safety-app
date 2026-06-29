const { TABLE_NAME, json, readBody, requireConfig, supabaseFetch } = require("./_supabase");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return json(response, 405, { error: "Method not allowed." });
  }
  if (!requireConfig(response)) return;

  try {
    const body = await readBody(request);
    const studentNo = Number(body.student_no);
    const infoType = String(body.info_type || "").trim();
    const riskLevel = String(body.risk_level || "").trim();

    if (!Number.isInteger(studentNo) || studentNo < 1 || studentNo > 12) {
      return json(response, 400, { error: "student_no must be 1-12." });
    }
    if (!infoType || !riskLevel) {
      return json(response, 400, { error: "info_type and risk_level are required." });
    }

    const supabaseResponse = await supabaseFetch(TABLE_NAME, {
      method: "POST",
      body: JSON.stringify({
        student_no: studentNo,
        info_type: infoType,
        risk_level: riskLevel
      })
    });

    const data = await supabaseResponse.json().catch(() => null);
    if (!supabaseResponse.ok) {
      return json(response, supabaseResponse.status, { error: data?.message || "Insert failed." });
    }
    return json(response, 200, { ok: true, data });
  } catch (error) {
    return json(response, 500, { error: "Submit failed." });
  }
};
