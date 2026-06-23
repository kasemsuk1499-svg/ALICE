(() => {
  "use strict";

  const root = document.documentElement;
  const sourceUrl = root.dataset.source || "";
  const frameSource = root.dataset.frameSource || "";
  const interludeUrl = root.dataset.interlude || "";
  const content = document.querySelector("#chapterContent");

  function cleanPreviewText(node) {
    if (!node) return;
    node.querySelectorAll(".notice,.top,.chapter-nav,.footer").forEach(el => el.remove());
    node.querySelectorAll(".badge").forEach(el => {
      if (el.textContent.trim() === "ฉบับตรวจ") el.textContent = "เผยแพร่แล้ว";
    });
    node.querySelectorAll(".byline").forEach(el => {
      el.textContent = el.textContent.replace("ฉบับรอตรวจ", "เผยแพร่");
    });
  }

  function buildInterlude(text, doc = document) {
    const box = doc.createElement("div");
    box.className = "hidden-seed";
    text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean).forEach(part => {
      const p = doc.createElement("p");
      if (part.startsWith(">")) {
        p.className = "whisper";
        p.textContent = part.slice(1).trim();
      } else {
        p.textContent = part;
      }
      box.appendChild(p);
    });
    return box;
  }

  async function getInterlude() {
    if (!interludeUrl) return "";
    const response = await fetch(interludeUrl, { cache: "no-store" });
    return response.ok ? response.text() : "";
  }

  async function loadEmbeddedChapter() {
    const frame = document.createElement("iframe");
    frame.className = "embedded-chapter";
    frame.title = "เนื้อหาตอน";
    frame.src = frameSource;
    content.replaceChildren(frame);
    frame.addEventListener("load", async () => {
      try {
        const doc = frame.contentDocument;
        doc.querySelectorAll(".top,.notice,.chapter-nav,.footer").forEach(el => el.remove());
        doc.querySelectorAll(".badge").forEach(el => {
          if (el.textContent.trim() === "ฉบับตรวจ") el.textContent = "เผยแพร่แล้ว";
        });
        doc.querySelectorAll(".byline").forEach(el => {
          el.textContent = el.textContent.replace("ฉบับรอตรวจ", "เผยแพร่");
        });
        const extra = await getInterlude();
        if (extra) {
          const ending = doc.querySelector(".end");
          const seed = buildInterlude(extra, doc);
          if (ending) ending.before(seed);
          else doc.querySelector(".story")?.appendChild(seed);
        }
        const resize = () => {
          frame.style.height = `${Math.max(700, doc.documentElement.scrollHeight + 24)}px`;
        };
        resize();
        setTimeout(resize, 250);
        setTimeout(resize, 900);
      } catch (error) {
        frame.style.height = "80vh";
      }
    });
  }

  async function loadFetchedChapter() {
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("โหลดเนื้อหาไม่สำเร็จ");
    const html = await response.text();
    const sourceDoc = new DOMParser().parseFromString(html, "text/html");
    const hero = sourceDoc.querySelector(".hero");
    const chapter = sourceDoc.querySelector(".chapter");
    if (!chapter) throw new Error("ไม่พบเนื้อหาตอน");
    cleanPreviewText(hero);
    cleanPreviewText(chapter);
    content.replaceChildren();
    if (hero) content.appendChild(document.importNode(hero, true));
    const importedChapter = document.importNode(chapter, true);
    const extra = await getInterlude();
    if (extra) {
      const interlude = buildInterlude(extra);
      const ending = importedChapter.querySelector(".end");
      if (ending) ending.before(interlude);
      else importedChapter.appendChild(interlude);
    }
    content.appendChild(importedChapter);
    const heading = importedChapter.querySelector("h2") || hero?.querySelector("h1");
    if (heading) document.title = `${heading.textContent.trim()} — FANFIG`;
  }

  async function loadChapter() {
    try {
      if (frameSource) return loadEmbeddedChapter();
      if (!sourceUrl) throw new Error("ไม่พบแหล่งเนื้อหา");
      await loadFetchedChapter();
    } catch (error) {
      content.innerHTML = `<div class="series-status"><h2>เปิดตอนนี้ไม่สำเร็จ</h2><p>${error.message}</p><p>ลองรีเฟรชหน้าอีกครั้งค่ะ</p></div>`;
    }
  }

  loadChapter();
})();