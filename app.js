(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const config = window.SUPABASE_CONFIG || {};
  const hasSupabaseConfig = Boolean(config.url && config.anonKey);
  const supabaseUrl = normalizeSupabaseUrl(config.url || "");
  const db = hasSupabaseConfig && window.supabase
    ? window.supabase.createClient(supabaseUrl, config.anonKey)
    : null;
  const tableName = "privacy_logs";

  let selectedStudent = null;
  let selectedInfo = null;

  const infoTypes = [
    { id: "name", title: "이름", example: "홍길동", risk: "위험", tone: "risk" },
    { id: "phone", title: "전화번호", example: "010-1234-5678", risk: "위험", tone: "risk" },
    { id: "address", title: "주소", example: "우리집 주소", risk: "위험", tone: "risk" },
    { id: "school", title: "학교", example: "우리학교 이름", risk: "위험", tone: "risk" },
    { id: "photo", title: "얼굴 사진", example: "내 얼굴 사진", risk: "위험", tone: "risk" },
    { id: "safe", title: "안전한 문장", example: "저는 고등학생입니다", risk: "안전", tone: "safe" }
  ];

  function normalizeSupabaseUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch (error) {
      return url;
    }
  }

  function localLogs() {
    try {
      return JSON.parse(localStorage.getItem("privacySafetyLogs") || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveLocalLogs(logs) {
    localStorage.setItem("privacySafetyLogs", JSON.stringify(logs));
  }

  function nowText(value) {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  function renderStudentNumbers() {
    $("studentGrid").innerHTML = Array.from({ length: 12 }, (_, index) => {
      const number = index + 1;
      return `<button class="number-button" type="button" data-student="${number}">${number}번</button>`;
    }).join("");

    $("studentGrid").querySelectorAll("button").forEach((button) => {
      button.onclick = () => {
        selectedStudent = Number(button.dataset.student);
        $("studentGrid").querySelectorAll("button").forEach((item) => {
          item.classList.toggle("selected", item === button);
        });
        updatePreview();
      };
    });
  }

  function renderInfoTypes() {
    $("infoGrid").innerHTML = infoTypes.map((item) => `
      <button class="info-card ${item.tone}" type="button" data-info="${item.id}">
        <strong>${item.title}</strong>
        <span>예시: ${item.example}</span>
      </button>
    `).join("");

    $("infoGrid").querySelectorAll("button").forEach((button) => {
      button.onclick = () => {
        selectedInfo = infoTypes.find((item) => item.id === button.dataset.info);
        $("infoGrid").querySelectorAll("button").forEach((item) => {
          item.classList.toggle("selected", item === button);
        });
        updatePreview();
      };
    });
  }

  function maskedExample(item) {
    if (!item) return "";
    if (item.id === "phone") return "010-****-****";
    if (item.id === "address") return "주소 정보";
    if (item.id === "school") return "학교 정보";
    if (item.id === "photo") return "사진 정보";
    return item.example;
  }

  function updatePreview() {
    $("sendButton").disabled = !(selectedStudent && selectedInfo);
    $("studentResult").classList.add("hidden");

    if (!selectedStudent && !selectedInfo) {
      $("studentPreview").className = "preview empty";
      $("studentPreview").textContent = "아직 선택하지 않았어요.";
      return;
    }

    $("studentPreview").className = "preview";
    const studentText = selectedStudent ? `${selectedStudent}번 학생` : "학생 번호";
    const infoText = selectedInfo
      ? `${selectedInfo.title}: ${maskedExample(selectedInfo)}`
      : "보낼 정보";
    $("studentPreview").innerHTML = `${studentText}<br>${infoText}`;
  }

  async function insertLog(payload) {
    if (db) {
      const { error } = await db.from(tableName).insert(payload);
      if (error) throw error;
      return;
    }

    const logs = localLogs();
    logs.push({ id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() });
    saveLocalLogs(logs);
  }

  async function fetchLogs() {
    if (db) {
      const { data, error } = await db
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return localLogs().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async function clearLogs() {
    if (db) {
      const { error } = await db.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return;
    }
    saveLocalLogs([]);
  }

  async function sendPracticeLog() {
    if (!selectedStudent || !selectedInfo) return;

    const payload = {
      student_no: selectedStudent,
      info_type: selectedInfo.title,
      risk_level: selectedInfo.risk
    };

    $("studentStatus").textContent = "보내는 중입니다.";
    try {
      await insertLog(payload);
      $("studentStatus").textContent = "보냈어요. 선생님 화면에서 확인할 수 있어요.";
      $("studentResult").classList.remove("hidden");
      $("studentResultText").textContent = selectedInfo.risk === "위험"
        ? `${selectedStudent}번 학생이 ${selectedInfo.title} 정보를 보냈어요. 이런 정보는 AI에 넣으면 위험해요.`
        : `${selectedStudent}번 학생이 안전한 문장을 보냈어요. 개인정보를 쓰지 않아서 좋아요.`;
    } catch (error) {
      $("studentStatus").textContent = "저장하지 못했어요. Supabase 설정을 확인해 주세요.";
      console.error(error);
    }
  }

  function latestByStudent(logs) {
    const map = new Map();
    logs.forEach((log) => {
      if (!map.has(log.student_no)) {
        map.set(log.student_no, log);
      }
    });
    return map;
  }

  async function renderTeacherDashboard() {
    $("dashboardNotice").textContent = db
      ? "Supabase에 저장된 참여 현황입니다."
      : "현재는 데모 모드입니다. 이 브라우저에만 기록됩니다.";

    try {
      const logs = await fetchLogs();
      const latest = latestByStudent(logs);
      $("teacherGrid").innerHTML = Array.from({ length: 12 }, (_, index) => {
        const number = index + 1;
        const log = latest.get(number);
        if (!log) {
          return `
            <article class="student-card">
              <strong>${number}번</strong>
              <p>아직 안 함</p>
            </article>
          `;
        }
        const safeClass = log.risk_level === "안전" ? "safe" : "done";
        return `
          <article class="student-card ${safeClass}">
            <strong>${number}번</strong>
            <p>선택: ${log.info_type}</p>
            <p>상태: ${log.risk_level}</p>
            <p>시간: ${nowText(log.created_at)}</p>
          </article>
        `;
      }).join("");
    } catch (error) {
      $("dashboardNotice").textContent = "현황을 불러오지 못했어요. Supabase 설정을 확인해 주세요.";
      console.error(error);
    }
  }

  function showTeacher() {
    $("studentScreen").classList.add("hidden");
    $("teacherScreen").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showStudent() {
    $("teacherScreen").classList.add("hidden");
    $("studentScreen").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $("teacherOpenButton").onclick = showTeacher;
  $("backStudentButton").onclick = showStudent;
  $("sendButton").onclick = sendPracticeLog;
  $("refreshButton").onclick = renderTeacherDashboard;
  $("teacherLoginButton").onclick = () => {
    if ($("teacherPassword").value === (config.teacherPassword || "1234")) {
      $("teacherLogin").classList.add("hidden");
      $("teacherDashboard").classList.remove("hidden");
      renderTeacherDashboard();
    } else {
      alert("비밀번호가 달라요.");
    }
  };
  $("clearButton").onclick = async () => {
    if (!confirm("수업 기록을 모두 지울까요?")) return;
    await clearLogs();
    renderTeacherDashboard();
  };

  renderStudentNumbers();
  renderInfoTypes();
})();
