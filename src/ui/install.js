// 加到手機主畫面 (user request 2026-11-01): the web version can be added to the
// home screen and then opens like an app. iPhone does not let a page install
// itself, so this only explains the steps (text supplied by the user). Shown
// only in a browser tab: hidden once opened from the home screen, inside the
// future iOS app (Capacitor) and when opened as a local file.
(function (root) {
  const app = root.ITE.app;
  const { h } = app;

  const DISMISS_KEY = "it-emperor.installHintDismissed"; // per device, not part of the save

  const STEPS = {
    ios: {
      label: "iPhone",
      steps: ["用 Safari 開啟本網站", "按畫面底部中間的「分享」圖示", "向下捲，選「加入主畫面」", "按右上角「加入」"],
    },
    android: {
      label: "Android",
      steps: ["用 Chrome 開啟本網站", "按右上角的「⋮」選單", "選「加入主畫面」或「安裝應用程式」", "按「安裝」"],
    },
  };

  function isStandalone() {
    const mm = root.matchMedia && root.matchMedia("(display-mode: standalone)").matches;
    return !!(mm || (root.navigator && root.navigator.standalone === true));
  }

  function applies() {
    const web = root.location && /^https?:$/.test(root.location.protocol);
    return web && !isStandalone() && !root.Capacitor;
  }

  function platform() {
    const ua = (root.navigator && root.navigator.userAgent) || "";
    return /android/i.test(ua) ? "android" : "ios";
  }

  function dismissed() {
    try {
      return app.storage.getItem(DISMISS_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function dismiss() {
    try {
      app.storage.setItem(DISMISS_KEY, "1");
    } catch (e) {
      // storage unavailable: the hint simply shows again next time
    }
  }

  let tab = null;

  function guide(rerender) {
    const current = tab || platform();
    return h(
      "div",
      { class: "install-guide" },
      h("p", { class: "hint" }, "加到主畫面後，像應用程式一樣一按即開，不必每次輸入網址。"),
      h(
        "div",
        { class: "seg", role: "tablist" },
        Object.entries(STEPS).map(([key, p]) =>
          h("button", { class: key === current ? "seg-btn active" : "seg-btn", role: "tab", "aria-selected": key === current ? "true" : "false", onclick: () => ((tab = key), rerender()) }, p.label)
        )
      ),
      h("ol", { class: "install-steps" }, STEPS[current].steps.map((s) => h("li", {}, s)))
    );
  }

  // 設定 panel; null when it does not apply.
  function settingsPanel(rerender) {
    if (!applies()) return null;
    return h("section", { class: "panel" }, h("h2", {}, "加到手機主畫面"), guide(rerender));
  }

  // One-time home card; null when it does not apply or was closed.
  function homeCard() {
    if (!applies() || dismissed()) return null;
    const card = h(
      "section",
      { class: "panel install-card" },
      h("button", { class: "install-close", "aria-label": "關閉", onclick: () => (dismiss(), card.remove()) }, "×"),
      h("h2", {}, "📱 加到手機主畫面"),
      h("div", { class: "install-body" })
    );
    const fill = () => card.querySelector(".install-body").replaceChildren(guide(fill));
    fill();
    return card;
  }

  root.ITE.installUi = { applies, isStandalone, settingsPanel, homeCard };
})(globalThis);
