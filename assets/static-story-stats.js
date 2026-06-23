(() => {
  "use strict";

  const STATIC_STORY = {
    id: "alice-unwritten-story",
    title: "FANFIG: อลิซกับเรื่องราวที่ไม่ควรถูกเขียน",
    chapters: 2
  };

  function getDynamicStories() {
    try {
      return typeof stories !== "undefined" && Array.isArray(stories) ? stories : [];
    } catch {
      return [];
    }
  }

  function updatePublishedStats() {
    const storyEl = document.querySelector("#statStories");
    const chapterEl = document.querySelector("#statChapters");
    if (!storyEl || !chapterEl) return;

    const dynamicStories = getDynamicStories();
    const alreadyIncluded = dynamicStories.some(story =>
      story?.id === STATIC_STORY.id || story?.title === STATIC_STORY.title
    );

    const dynamicChapterCount = dynamicStories.reduce(
      (sum, story) => sum + (Array.isArray(story?.chapters) ? story.chapters.length : 0),
      0
    );

    storyEl.textContent = String(dynamicStories.length + (alreadyIncluded ? 0 : 1));
    chapterEl.textContent = String(dynamicChapterCount + (alreadyIncluded ? 0 : STATIC_STORY.chapters));
  }

  try {
    if (typeof renderStats === "function") {
      const originalRenderStats = renderStats;
      renderStats = function () {
        originalRenderStats();
        updatePublishedStats();
      };
    }
  } catch (error) {
    console.warn("FANFIG static stats patch:", error);
  }

  updatePublishedStats();
  window.addEventListener("load", updatePublishedStats);
  setTimeout(updatePublishedStats, 500);
  setTimeout(updatePublishedStats, 1800);
})();