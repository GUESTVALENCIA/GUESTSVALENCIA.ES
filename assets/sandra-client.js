// assets/sandra-client.js
(() => {
  const fabCss = `#sandra-fab{position:fixed;right:22px;bottom:22px;width:66px;height:66px;border-radius:50%;background:#19C37D;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;box-shadow:0 10px 25px rgba(0,0,0,.2);z-index:9999}`;
  const modalCss = `#sandra-modal{position:fixed;right:22px;bottom:100px;width:340px;background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.2);z-index:9999;overflow:hidden;display:none}
#sandra-modal.open{display:block}
#sandra-head{display:flex;align-items:center;justify-content:space-between;background:#19C37D;color:#fff;padding:10px 14px}
#sandra-body{padding:12px;max-height:360px;overflow:auto}
#sandra-msgs{display:flex;flex-direction:column;gap:8px}
.sandra-bubble{padding:10px 12px;border-radius:12px;max-width:85%}
.sandra-user{align-self:flex-end;background:#e6f7ef}
.sandra-ai{align-self:flex-start;background:#f1f5f9}
#sandra-foot{display:flex;gap:8px;padding:10px;border-top:1px solid #eef2f7}
#sandra-input{flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:10px}
#sandra-send{background:#19C37D;color:#fff;border:none;border-radius:10px;padding:8px 12px;cursor:pointer}`;

  const style = document.createElement("style");
  style.textContent = fabCss + modalCss;
  document.head.appendChild(style);

  const fab = document.createElement("div");
  fab.id = "sandra-fab";
  fab.title = "Habla con Sandra";
  fab.innerHTML = "🎤";
  document.body.appendChild(fab);

  const modal = document.createElement("div");
  modal.id = "sandra-modal";
  modal.innerHTML = `<div id="sandra-head"><strong>Sandra</strong><button id="sandra-close" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer">✕</button></div>
  <div id="sandra-body">
    <div style="margin-bottom:8px; border-radius:12px; overflow:hidden; background:#000; aspect-ratio:9/16;">
      <video id="sandra-avatar-video" style="width:100%;height:auto;display:block;" playsinline muted></video>
    </div>
    <div id="sandra-msgs"><div class="sandra-bubble sandra-ai">Hola, soy Sandra. ¿Fechas y número de personas?</div></div>
  </div>
  <div id="sandra-foot"><input id="sandra-input" placeholder="Escribe aquí..." /><button id="sandra-send">Enviar</button></div>`;
  document.body.appendChild(modal);

  const msgs = modal.querySelector("#sandra-msgs");
  const input = modal.querySelector("#sandra-input");
  const sendBtn = modal.querySelector("#sandra-send");
  const closeBtn = modal.querySelector("#sandra-close");

  let ttsEnabled = true; // Si hay ELEVENLABS_API_KEY, sonará voz

  function addBubble(text, who) {
    const b = document.createElement("div");
    b.className = `sandra-bubble ${who==='user'?'sandra-user':'sandra-ai'}`;
    b.textContent = text;
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function speak(text) {
    try {
      if (!ttsEnabled) return;
      const r = await fetch("/.netlify/functions/sandra-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch {}
  }

  async function askSandra(message) {
    addBubble(message, "user");
    input.value = "";
    try {
      const r = await fetch("/.netlify/functions/sandra-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await r.json();
      const reply = data.reply || "Lo siento, ahora mismo no puedo responder.";
      addBubble(reply, "ai");
      speak(reply);
      heygenSpeak(reply);
    } catch (e) {
      addBubble("Error de conexión. Intenta de nuevo.", "ai");
    }
  }

  fab.addEventListener("click", () => modal.classList.toggle("open"));
  closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  sendBtn.addEventListener("click", () => {
    const v = input.value.trim();
    if (v) askSandra(v);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = input.value.trim();
      if (v) askSandra(v);
    }
  });
})();

// --- HEYGEN SUPPORT ---
let heygenEnabled = false;
const avatarVideoEl = () => document.getElementById("sandra-avatar-video");

async function checkHeygen() {
  try {
    const r = await fetch("/.netlify/functions/heygen-ready");
    const j = await r.json();
    heygenEnabled = !!j.enabled;
  } catch { heygenEnabled = false; }
}
checkHeygen();

async function heygenSpeak(text) {
  if (!heygenEnabled) return;
  try {
    // Iniciamos generación de vídeo
    const start = await fetch("/.netlify/functions/heygen-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const j = await start.json();
    if (!start.ok || !j.video_id) return;

    const id = j.video_id;
    // Poll hasta que esté listo
    let tries = 0;
    while (tries < 30) { // ~30*2s = 60s máx
      await new Promise(res => setTimeout(res, 2000));
      const st = await fetch(`/.netlify/functions/heygen-status?id=${id}`);
      const sj = await st.json();
      if (sj.video_url) {
        const v = avatarVideoEl();
        if (v) {
          v.src = sj.video_url;
          v.muted = false;
          v.autoplay = true;
          v.play().catch(()=>{});
        }
        break;
      }
      tries++;
    }
  } catch {}
}
