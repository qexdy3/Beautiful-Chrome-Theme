"use strict";

let updateVersion = 0;
async function updateIcon(icon) {
  const version = ++updateVersion;
  try {
    if (!icon) {
      await chrome.action.setIcon({path: {16: "assets/icons/icon16.png", 32: "assets/icons/icon32.png", 48: "assets/icons/icon48.png", 128: "assets/icons/icon128.png"}});
      return;
    }
    if (typeof icon !== "string" || !icon.startsWith("data:image/png;base64,")) return;
    const bitmap = await createImageBitmap(await (await fetch(icon)).blob());
    const canvas = new OffscreenCanvas(128, 128);
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, 128, 128);
    bitmap.close();
    if (version === updateVersion) await chrome.action.setIcon({imageData: context.getImageData(0, 0, 128, 128)});
  } catch (error) {
    console.warn("Unable to update the Qexdy3 toolbar icon.", error);
  }
}

async function restoreIcon() {
  try {
    const {commonIcon} = await chrome.storage.local.get("commonIcon");
    await updateIcon(commonIcon);
  } catch (error) {
    console.warn("Unable to restore the Qexdy3 toolbar icon.", error);
  }
}

chrome.runtime.onInstalled.addListener(restoreIcon);
chrome.runtime.onStartup.addListener(restoreIcon);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.commonIcon) void updateIcon(changes.commonIcon.newValue);
});
