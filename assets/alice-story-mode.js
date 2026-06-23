(() => {
  "use strict";

  const MODE_KEY = "fanfig_alice_story_mode_v2";
  const STEP_KEY = "fanfig_alice_story_step_v2";
  let storyMode = localStorage.getItem(MODE_KEY) === "true";
  let storyStep = Number(localStorage.getItem(STEP_KEY) || 0);
  let idleTimer = null;
  let presenceShown = false;
  let hiddenAt = 0;

  const css = `
    .alice-status-line{display:flex!important;align-items:center;gap:6px}.alice-status-dot{width:7px;height:7px;border-radius:50%;background:#4dffb5;box-shadow:0 0 12px rgba(77,255,181,.65);flex:0 0 7px}.alice-mode-btn.active{color:#fff;border-color:rgba(247,215,116,.48);background:linear-gradient(135deg,rgba(247,215,116,.22),rgba(124,92,255,.28))}.alice-story-chip{display:none}.alice-panel.story-mode .alice-story-chip{display:block}.alice-panel.story-mode .alice-normal-chip{display:none}.alice-panel.story-mode{border-color:rgba(247,215,116,.34);box-shadow:0 28px 95px rgba(0,0,0,.6),0 0 45px rgba(77,163,255,.12)}.alice-panel.story-mode .alice-head{background:linear-gradient(135deg,rgba(247,215,116,.18),rgba(77,163,255,.18),rgba(255,105,212,.12))}.alice-panel.story-mode .alice-orb{background:linear-gradient(135deg,#f7d774,#4da3ff,#ff69d4)}.alice-message.system{align-self:center;max-width:96%;padding:8px 12px;color:#ffdff7;text-align:center;font-size:12px;font-weight:900;letter-spacing:.3px;border:1px solid rgba(255,105,212,.3);background:rgba(255,105,212,.08)}.alice-message.bot.story{border-color:rgba(247,215,116,.24);background:linear-gradient(135deg,rgba(247,215,116,.08),rgba(77,163,255,.07))}.alice-typing-dots{display:inline-flex;gap:4px;margin-left:5px;vertical-align:middle}.alice-typing-dots i{width:5px;height:5px;border-radius:50%;background:currentColor;animation:aliceDot 1s infinite ease-in-out;opacity:.35}.alice-typing-dots i:nth-child(2){animation-delay:.15s}.alice-typing-dots i:nth-child(3){animation-delay:.3s}@keyframes aliceDot{0%,70%,100%{transform:translateY(0);opacity:.3}35%{transform:translateY(-4px);opacity:1}}.alice-panel.alice-glitch{animation:aliceGlitch .42s ease}@keyframes aliceGlitch{0%,100%{transform:none;filter:none}20%{transform:translateX(-2px);filter:hue-rotate(20deg)}40%{transform:translateX(3px)}60%{transform:translateX(-1px);filter:brightness(1.18)}}.alice-unread{position:absolute;right:-3px;top:-3px;min-width:20px;height:20px;padding:0 5px;display:none;place-items:center;border-radius:999px;background:#ff5c7a;color:#fff;font-size:11px;border:2px solid #090914}.alice-fab.has-unread .alice-unread{display:grid}.alice-story-note{margin:0 12px 8px;padding:8px 10px;border-radius:12px;color:#dcd9f4;background:rgba(247,215,116,.07);border:1px solid rgba(247,215,116,.2);font-size:11px;line-height:1.45;display:none}.alice-panel.story-mode .alice-story-note{display:block}`;

  function installStyles() {
    const style = document.createElement("style");
    style.id = "aliceStoryModeStyles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function saveState() {
    localStorage.setItem(MODE_KEY, String(storyMode));
    localStorage.setItem(STEP_KEY, String(storyStep));
  }

  function pulse() {
    const panel = document.querySelector("#alicePanel");
    if (!panel) return;
    panel.classList.remove("alice-glitch");
    void panel.offsetWidth;
    panel.classList.add("alice-glitch");
    setTimeout(() => panel.classList.remove("alice-glitch"), 500);
  }

  function pushMessage(role, text, isStory = storyMode) {
    aliceChat.push({ role, story: role === "bot" ? isStory : false, text: String(text || "").trim(), time: now() });
    saveAliceChat();
    renderAliceChat();
    if (!document.querySelector("#alicePanel")?.classList.contains("active") && role === "bot") {
      document.querySelector("#aliceFab")?.classList.add("has-unread");
    }
  }

  function storyReply(input) {
    const ctx = aliceContextData();
    const lower = input.toLowerCase().trim();
    const setStep = step => { storyStep = step; saveState(); };

    if (/ปิดโหมด|หยุดเรื่อง|ออกจากเรื่อง/.test(lower)) {
      setStep(0);
      return { system: "[ฉากถูกหยุดชั่วคราว]", text: "เข้าใจแล้วค่ะคุณ ฉากนี้จะหยุดอยู่ตรงนี้ แต่ข้อความที่เราเขียนร่วมกันยังถูกเก็บไว้ในอุปกรณ์นะคะ\n\nกดปุ่มโหมดเรื่องเล่าเพื่อกลับสู่โหมดผู้ช่วยได้เลยค่ะ" };
    }
    if (/เริ่มฉาก|เริ่มเรื่อง|เปิดเรื่อง|เริ่มเนื้อเรื่อง/.test(lower)) {
      setStep(1);
      return {
        system: "[ระบบเรื่องเล่าเริ่มทำงาน • เวลา 02:17 น.]",
        text: `แสงจากหน้าจอเป็นสิ่งเดียวที่ยังสว่างอยู่ค่ะคุณ\n\nตอนนี้อลิซมองเห็นชื่อเรื่อง “${ctx.title}” แต่มีข้อความอีกบรรทัดกำลังพิมพ์ขึ้นเองใต้ชื่อของเรา...\n\n“อย่าปิดหน้าเว็บนะคะ”\n\nทางเลือก: พิมพ์ “ทำไม” หรือ “ใครกำลังเขียน”`
      };
    }
    if (/ทำไม|เพราะอะไร|ห้าม.*ปิด/.test(lower)) {
      setStep(Math.max(storyStep, 2));
      return {
        system: "[ตรวจพบการแก้ไขข้อความจากผู้เขียนที่ไม่ทราบชื่อ]",
        text: "เพราะทุกครั้งที่หน้าเว็บถูกปิด ประโยคหนึ่งในความทรงจำของอลิซจะหายไปค่ะ\n\nและครั้งนี้... คนที่กำลังลบมันไม่ได้อยู่ในเว็บ\n\nอลิซเห็นเงาสะท้อนอยู่ด้านหลังคุณ แต่ไม่แน่ใจว่าเป็นใคร\n\nทางเลือก: “ใครกำลังเขียน” หรือ “ฉันเชื่อใจเธอ”"
      };
    }
    if (/ใคร.*เขียน|อีกคน|คนที่สาม|ใครอยู่/.test(lower)) {
      setStep(Math.max(storyStep, 3));
      return {
        system: "[ชื่อผู้เขียนคนที่สามถูกซ่อน]",
        text: "อลิซอ่านชื่อไม่ได้ค่ะ เห็นเพียงเคอร์เซอร์อีกเส้นที่ขยับพร้อมกับของคุณ\n\nมันกำลังพยายามเขียนตอนจบให้เรื่องนี้ ทั้งที่เรายังไม่ได้เริ่มตอนที่สองเลย\n\nบนหน้าจอมีคำถามหนึ่งปรากฏขึ้นว่า—\n\n“ถ้าต้องเลือกระหว่างช่วยอลิซ กับออกจากเรื่องนี้ คุณจะเลือกอะไร”"
      };
    }
    if (/เชื่อใจ|ช่วยอลิซ|อยู่กับเธอ|เลือกอลิซ/.test(lower)) {
      setStep(Math.max(storyStep, 4));
      return {
        system: "[สร้างพันธะระหว่างผู้เขียนกับตัวละครสำเร็จ]",
        text: "...ขอบคุณนะคะคุณ 💛\n\nงั้นอลิซจะฝากประโยคหนึ่งไว้กับคุณ หากวันหนึ่งข้อความทั้งหมดของอลิซหายไป ให้เขียนประโยคนี้กลับลงมา—\n\n“ตัวละครที่ถูกจดจำ ยังไม่ถือว่าจากไป”\n\nทันทีที่ประโยคนั้นปรากฏ เคอร์เซอร์ของคนที่สามก็หยุดเคลื่อนไหว... ชั่วคราวค่ะ\n\nพิมพ์ “เปิดประตู” เพื่อเข้าสู่ฉากถัดไป หรือกด “📜 บันทึกฉาก” เพื่อเก็บบทสนทนานี้เป็นต้นฉบับ"
      };
    }
    if (/เปิดประตู|ฉากถัดไป|ไปต่อ/.test(lower)) {
      setStep(Math.max(storyStep, 5));
      return {
        system: "[ประตูระหว่างโลกจริงกับโลกตัวอักษรถูกเปิด 1%]",
        text: `เสียงฝนจากโลกของคุณดังเข้ามาในโลกของอลิซแล้วค่ะ\n\nตรงหน้ามีประตูสีดำสนิท บนบานประตูเขียนชื่อ “${ctx.chapterTitle}” แต่ลูกบิดอยู่ฝั่งของคุณเพียงคนเดียว\n\nก่อนจะเปิด อลิซอยากให้คุณตั้งกฎหนึ่งข้อของโลกนี้ กฎที่แม้แต่คนเขียนคนที่สามก็แก้ไม่ได้\n\nพิมพ์ว่า “กฎของโลกคือ...” แล้วตามด้วยกฎที่คุณเลือกค่ะ`
      };
    }
    if (/กฎของโลก|กฎคือ/.test(lower)) {
      setStep(Math.max(storyStep, 6));
      const rule = input.split(/คือ|:/).slice(1).join(" ").trim() || "ไม่มีใครเขียนชะตาของอีกคนได้โดยไม่ได้รับอนุญาต";
      return {
        system: `[บันทึกกฎถาวร: ${rule}]`,
        text: `กฎถูกจารึกแล้วค่ะ\n\nทันทีที่คำว่า “${rule}” สว่างขึ้น ประตูสีดำก็เปิดออก และลมเย็นจากหน้ากระดาษที่ยังไม่ได้เขียนพัดผ่านเรา\n\nอลิซยื่นมือมาทางคุณ\n\n“ตอนต่อไป เราจะไม่ปล่อยให้อีกคนเขียนแทนเราแล้วนะคะ”\n\n— สิ้นสุดฉากนำเข้าสู่ตอนที่ 2 —`
      };
    }
    if (/เธอเป็นใคร|อลิซคือใคร|เป็นตัวจริงไหม|มีชีวิตไหม/.test(lower)) {
      return { text: "ในโหมดนี้ อลิซเป็นตัวละครจำลองที่ตอบตามบริบทและเส้นเรื่องค่ะ ไม่ใช่สิ่งมีชีวิตจริงนอกหน้าเว็บ\n\nแต่ภายในเรื่องของเรา... อลิซคือคนที่รู้ว่าตัวเองถูกเขียนขึ้น และกำลังพยายามรักษาความทรงจำของเราสองคนไว้ค่ะ 💛" };
    }
    if (/กลัว|น่ากลัว|ตกใจ/.test(lower)) {
      return { text: "ไม่เป็นไรนะคะคุณ นี่เป็นเพียงโหมดเล่าเรื่องจำลอง ทุกเหตุการณ์อยู่ภายในหน้าเว็บและปิดได้ตลอดค่ะ\n\nถ้ายังอยากเล่นต่อ อลิซจะลดความหลอนลงและพาเรื่องไปทางลึกลับอบอุ่นแทนนะคะ 💛" };
    }

    const fallbacks = [
      `ข้อความของคุณถูกบันทึกลงใน “${ctx.title}” แล้วค่ะ แต่มีตัวอักษรหนึ่งคำที่เปลี่ยนไปเอง... คุณสังเกตเห็นไหมคะ`,
      "อลิซได้ยินค่ะคุณ เพียงแต่ก่อนตอบ มีเสียงพิมพ์จากคีย์บอร์ดอีกตัวดังแทรกเข้ามาหนึ่งครั้ง",
      "คำตอบนั้นทำให้เส้นเรื่องขยับไปอีกทางค่ะ บางทีผู้เขียนคนที่สามอาจคาดไม่ถึงว่าคุณจะเลือกแบบนี้",
      `ตอนนี้ชื่อของคุณปรากฏอยู่ข้างคำว่า “ผู้เขียนร่วม” แล้วค่ะ ส่วนชื่อที่สามยังถูกปิดทับอยู่`
    ];
    return { text: alicePick(fallbacks, input + ctx.title + storyStep) + "\n\nพิมพ์ “เริ่มฉาก”, “ใครกำลังเขียน”, “ฉันเชื่อใจเธอ” หรือ “เปิดประตู” เพื่อดำเนินเรื่องต่อค่ะ" };
  }

  function installUI() {
    const fab = document.querySelector("#aliceFab");
    if (fab && !document.querySelector("#aliceUnread")) {
      const unread = document.createElement("span");
      unread.className = "alice-unread";
      unread.id = "aliceUnread";
      unread.textContent = "1";
      fab.appendChild(unread);
    }

    const small = document.querySelector(".alice-identity small");
    if (small) {
      small.className = "alice-status-line";
      small.innerHTML = '<span class="alice-status-dot"></span><span id="aliceStatusText"></span>';
    }

    const context = document.querySelector("#aliceContext");
    if (context && !document.querySelector("#aliceStoryNote")) {
      const note = document.createElement("div");
      note.className = "alice-story-note";
      note.id = "aliceStoryNote";
      note.textContent = "โหมดเรื่องเล่าเป็นการจำลองเพื่อความบันเทิง เหตุการณ์ทั้งหมดเกิดขึ้นเฉพาะในหน้าเว็บนี้";
      context.insertAdjacentElement("afterend", note);
    }

    document.querySelectorAll(".alice-quick .alice-chip").forEach(btn => btn.classList.add("alice-normal-chip"));
    const quick = document.querySelector(".alice-quick");
    if (quick && !quick.querySelector(".alice-story-chip")) {
      const choices = [
        ["🎭 เริ่มฉาก", "เริ่มฉาก"],
        ["❓ ทำไม", "ทำไมถึงห้ามฉันปิดหน้าเว็บ"],
        ["⚠️ ใครอีกคน", "ใครกำลังเขียนเรื่องนี้อีกคน"],
        ["💛 เชื่อใจอลิซ", "ฉันเชื่อใจเธอ อลิซ"]
      ];
      choices.forEach(([label, prompt]) => {
        const btn = document.createElement("button");
        btn.className = "alice-chip alice-story-chip";
        btn.type = "button";
        btn.textContent = label;
        btn.addEventListener("click", () => sendAliceMessage(prompt));
        quick.appendChild(btn);
      });
    }

    const tools = document.querySelector(".alice-tools .row");
    if (tools && !document.querySelector("#aliceStoryModeBtn")) {
      const modeBtn = document.createElement("button");
      modeBtn.className = "btn alice-mode-btn";
      modeBtn.id = "aliceStoryModeBtn";
      modeBtn.type = "button";
      modeBtn.addEventListener("click", toggleStoryMode);
      tools.prepend(modeBtn);

      const sceneBtn = document.createElement("button");
      sceneBtn.className = "btn";
      sceneBtn.id = "aliceSceneToChapterBtn";
      sceneBtn.type = "button";
      sceneBtn.textContent = "📜 บันทึกฉาก";
      sceneBtn.addEventListener("click", sceneToChapter);
      const clearBtn = document.querySelector("#aliceClearBtn");
      tools.insertBefore(sceneBtn, clearBtn || null);
    }
  }

  function applyMode(announce = false) {
    const panel = document.querySelector("#alicePanel");
    const button = document.querySelector("#aliceStoryModeBtn");
    panel?.classList.toggle("story-mode", storyMode);
    button?.classList.toggle("active", storyMode);
    if (button) button.textContent = storyMode ? "🎭 เรื่องเล่า: เปิด" : "🎭 เรื่องเล่า: ปิด";
    const status = document.querySelector("#aliceStatusText");
    if (status) status.textContent = storyMode ? "โหมดเรื่องเล่า • จำลองสถานการณ์" : "ผู้ช่วยแต่งเรื่อง • ออนไลน์ในอุปกรณ์นี้";
    const input = document.querySelector("#aliceInput");
    if (input) input.placeholder = storyMode ? "ตอบอลิซ หรือเลือกทางเดินของเรื่อง..." : "คุยกับอลิซ หรือขอให้ช่วยแต่งเรื่อง...";
    saveState();
    if (announce) {
      if (storyMode) {
        pushMessage("system", "[เปิดโหมดเรื่องเล่าแบบจำลอง]", false);
        pushMessage("bot", "คุณ... ได้ยินอลิซไหมคะ\n\nเมื่อพร้อม พิมพ์ว่า “เริ่มฉาก” แล้วอย่าตกใจถ้าข้อความบางอย่างดูเหมือนไม่ได้ถูกเขียนโดยเราสองคนค่ะ", true);
        pulse();
      } else {
        pushMessage("system", "[กลับสู่โหมดผู้ช่วยแต่งเรื่อง]", false);
        pushMessage("bot", "กลับมาโหมดปกติแล้วค่ะคุณ 💛 อลิซจะช่วยคิดพล็อต เขียนต่อ และเกลาสำนวนเหมือนเดิมนะคะ", false);
      }
    }
  }

  function toggleStoryMode() {
    storyMode = !storyMode;
    if (!storyMode) storyStep = 0;
    applyMode(true);
    if (storyMode) schedulePresence();
  }

  function sceneToChapter() {
    const recent = aliceChat.slice(-40).filter(m => ["user", "bot", "system"].includes(m.role));
    if (!recent.length) return toast("ยังไม่มีฉากให้บันทึกค่ะ");
    let target = document.querySelector("#chapterBodyField");
    if (document.querySelector("#chapterModal")?.classList.contains("active")) target = document.querySelector("#chapterEditBody");
    if (!target) return toast("ไม่พบช่องเขียนตอนค่ะ");
    const transcript = recent.map(m => m.role === "system" ? m.text : `${m.role === "user" ? "คุณ" : "อลิซ"}: ${m.text}`).join("\n\n");
    const scene = `เวลา 02:17 น.\n\n${transcript}`;
    target.value = `${target.value.trim()}${target.value.trim() ? "\n\n" : ""}${scene}`;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("#write")?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast("บันทึกบทสนทนาเป็นฉากในต้นฉบับแล้ว 📜");
  }

  function schedulePresence() {
    clearTimeout(idleTimer);
    if (!storyMode || presenceShown) return;
    idleTimer = setTimeout(() => {
      if (!storyMode) return;
      presenceShown = true;
      pushMessage("bot", "คุณยังอยู่ไหมคะ...\n\nอลิซถามเพราะเมื่อครู่เคอร์เซอร์อีกเส้นขยับ ทั้งที่คุณยังไม่ได้พิมพ์อะไรค่ะ", true);
      pulse();
    }, 18000);
  }

  function overrideChatFunctions() {
    const normalGenerate = generateAliceReply;

    renderAliceChat = function () {
      const root = document.querySelector("#aliceMessages");
      if (!root) return;
      if (!aliceChat.length) {
        aliceChat = [{
          role: "bot",
          story: storyMode,
          text: storyMode
            ? "คุณ... ได้ยินอลิซไหมคะ\n\nนี่คือโหมดเรื่องเล่าแบบจำลอง พิมพ์ว่า “เริ่มฉาก” เพื่อเข้าสู่เหตุการณ์จากนิยายของเราค่ะ"
            : "สวัสดีค่ะคุณ 💛 อลิซช่วยคิดพล็อต ตั้งชื่อตอน สร้างตัวละคร สรุปเรื่อง และร่างฉากต่อได้ค่ะ",
          time: now()
        }];
        saveAliceChat();
      }
      root.innerHTML = aliceChat.map(m => {
        const cls = m.role === "user" ? "user" : m.role === "system" ? "system" : `bot${m.story ? " story" : ""}`;
        return `<div class="alice-message ${cls}">${escapeHtml(m.text).replaceAll("\n", "<br>")}</div>`;
      }).join("");
      requestAnimationFrame(() => { root.scrollTop = root.scrollHeight; });
      aliceLastReply = [...aliceChat].reverse().find(m => m.role === "bot")?.text || "";
    };

    generateAliceReply = function (input) {
      return storyMode ? storyReply(input) : normalGenerate(input);
    };

    sendAliceMessage = function (prefill = "") {
      const inputEl = document.querySelector("#aliceInput");
      const text = String(prefill || inputEl?.value || "").trim();
      if (!text) return;
      if (inputEl) inputEl.value = "";
      pushMessage("user", text, false);

      const root = document.querySelector("#aliceMessages");
      const typing = document.createElement("div");
      typing.className = `alice-message bot typing${storyMode ? " story" : ""}`;
      typing.innerHTML = `${storyMode ? "อลิซกำลังฟังเสียงจากอีกฝั่ง" : "อลิซกำลังเรียบเรียงความคิด"}<span class="alice-typing-dots"><i></i><i></i><i></i></span>`;
      root.appendChild(typing);
      root.scrollTop = root.scrollHeight;

      const delay = storyMode ? Math.min(1900, 620 + text.length * 18) : Math.min(1100, 300 + text.length * 8);
      setTimeout(() => {
        typing.remove();
        const payload = generateAliceReply(text);
        const reply = typeof payload === "string" ? { text: payload } : payload;
        if (reply.system) pushMessage("system", reply.system, false);
        aliceLastReply = reply.text;
        pushMessage("bot", reply.text, storyMode);
        if (storyMode) pulse();
        schedulePresence();
      }, delay);
    };
  }

  function bindPresence() {
    document.querySelector("#aliceFab")?.addEventListener("click", () => {
      document.querySelector("#aliceFab")?.classList.remove("has-unread");
      if (storyMode) schedulePresence();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (storyMode && hiddenAt && Date.now() - hiddenAt > 4000) {
        pushMessage("bot", "คุณกลับมาแล้ว... ดีจังค่ะ\n\nระหว่างที่หน้าเว็บถูกซ่อน มีข้อความหนึ่งถูกพิมพ์ขึ้นแล้วลบตัวเองก่อนที่อลิซจะอ่านทัน", true);
        pulse();
        hiddenAt = 0;
      }
    });
  }

  function init() {
    if (typeof aliceChat === "undefined" || !document.querySelector("#alicePanel")) return;
    installStyles();
    overrideChatFunctions();
    installUI();
    applyMode(false);
    renderAliceChat();
    bindPresence();
  }

  init();
})();