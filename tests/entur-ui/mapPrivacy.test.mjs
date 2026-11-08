import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import React, {act} from "react";
import {JSDOM} from "jsdom";
import MapPrivacy from "../../src/components/content/MapPrivacy";
import {en} from "../../src/i18n/en";
import {nb} from "../../src/i18n/nb";
import {ne} from "../../src/i18n/ne";

for (const [language, translation] of Object.entries({en, nb, ne})) {
  test(`${language}: map-only privacy dialog is localized, accessible and restores focus`, async () => {
    const dom = new JSDOM('<!doctype html><button id="background">Outside</button><div id="root"></div>', {url: "https://nepali.no"});
    const saved = {window: globalThis.window, document: globalThis.document, navigator: globalThis.navigator};
    for (const [key, value] of Object.entries({window: dom.window, document: dom.window.document, navigator: dom.window.navigator})) {
      Object.defineProperty(globalThis, key, {value, configurable: true});
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const {createRoot} = await import("react-dom/client");
    const root = createRoot(dom.window.document.getElementById("root"));
    const labels = translation.common.maps;
    try {
      await act(async () => root.render(React.createElement(MapPrivacy, {language, labels})));
      const document = dom.window.document;
      const trigger = document.querySelector(".map-privacy__link");
      const dialog = document.querySelector("dialog");
      dialog.showModal = function () {this.setAttribute("open", "");};
      dialog.close = function () {this.removeAttribute("open");};
      dialog.getBoundingClientRect = () => ({left: 10, top: 10, right: 300, bottom: 300});
      assert.equal(trigger.textContent, labels.privacyTitle);
      assert.equal(dialog.open, false);
      assert.equal(dialog.getAttribute("role"), "dialog");
      assert.equal(dialog.getAttribute("aria-modal"), "true");
      assert.equal(document.getElementById(dialog.getAttribute("aria-labelledby")).textContent, labels.privacyTitle);
      assert.equal(dialog.querySelectorAll("p").length, 1);
      assert.equal(dialog.querySelector("p").textContent, labels.privacyExplanation);
      const link = dialog.querySelector("a");
      assert.equal(link.getAttribute("href"), language === "nb" ? "/nb/privacy/" : "/ne/privacy/");
      assert.equal(link.textContent, labels.privacyMore);
      const close = dialog.querySelector("button");
      assert.equal(close.textContent, labels.privacyClose);
      await act(async () => trigger.click());
      assert.equal(dialog.open, true);
      assert.equal(document.activeElement, close);
      assert.equal(document.body.style.overflow, "hidden");
      await act(async () => close.dispatchEvent(new dom.window.KeyboardEvent("keydown", {key: "Tab", shiftKey: true, bubbles: true, cancelable: true})));
      assert.equal(document.activeElement, link);
      await act(async () => link.dispatchEvent(new dom.window.KeyboardEvent("keydown", {key: "Tab", bubbles: true, cancelable: true})));
      assert.equal(document.activeElement, close);
      document.getElementById("background").focus();
      assert.equal(document.activeElement, close);
      await act(async () => dialog.querySelector("p").click());
      assert.equal(dialog.open, true);
      await act(async () => dialog.dispatchEvent(new dom.window.Event("cancel", {cancelable: true})));
      assert.equal(dialog.open, false);
      assert.equal(document.activeElement, trigger);
      assert.equal(document.body.style.overflow, "");
      await act(async () => trigger.click());
      await act(async () => dialog.dispatchEvent(new dom.window.MouseEvent("click", {bubbles: true, clientX: 1, clientY: 1})));
      assert.equal(dialog.open, false);
      assert.equal(document.activeElement, trigger);
      await act(async () => trigger.click());
      await act(async () => close.click());
      assert.equal(dialog.open, false);
      assert.equal(document.activeElement, trigger);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, value] of Object.entries(saved)) Object.defineProperty(globalThis, key, {value, configurable: true});
      delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    }
  });
}

test("map privacy link is unbordered and modal scrolling and focus styles are bounded", async () => {
  const css = await readFile(new URL("../../src/components/content/mapPrivacy.css", import.meta.url), "utf8");
  assert.match(css, /\.map-privacy__link\s*\{[^}]*border: 0;[^}]*text-decoration: underline/);
  assert.match(css, /max-block-size: calc\(100dvh - 2rem\)/);
  assert.match(css, /overflow: auto/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  const component = await readFile(new URL("../../src/components/content/MapPrivacy.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(component, /fetch\(|navigator\.geolocation|localStorage|\/api\/entur/);
});
