"use strict";

(() => {
  const picker = document.querySelector("#icon-picker");
  const reset = document.querySelector("#icon-reset");
  const status = document.querySelector("#icon-status");
  const favicon = document.querySelector("#page-icon");
  const defaultIcon = favicon.getAttribute("href");

  function applyIcon(icon) {
    favicon.href = typeof icon === "string" && icon.startsWith("data:image/png;base64,") ? icon : defaultIcon;
  }

  if (globalThis.chrome?.storage?.local) {
    chrome.storage.local.get("commonIcon").then(({commonIcon}) => applyIcon(commonIcon)).catch(() => {
      status.textContent = "Unable to load the saved icon.";
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.commonIcon) applyIcon(changes.commonIcon.newValue);
    });
  }

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) throw new Error("Invalid image");
      const image = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 128;
      const scale = Math.min(128 / image.width, 128 / image.height);
      const width = image.width * scale, height = image.height * scale;
      canvas.getContext("2d").drawImage(image, (128 - width) / 2, (128 - height) / 2, width, height);
      image.close();
      const commonIcon = canvas.toDataURL("image/png");
      if (!globalThis.chrome?.storage?.local) throw new Error("Storage unavailable");
      await chrome.storage.local.set({commonIcon});
      applyIcon(commonIcon);
      status.textContent = "Icon saved.";
    } catch {
      status.textContent = "Could not save the image. Choose an image smaller than 10 MB.";
    } finally {
      picker.value = "";
    }
  });

  reset.addEventListener("click", async () => {
    try {
      if (!globalThis.chrome?.storage?.local) throw new Error("Storage unavailable");
      await chrome.storage.local.remove("commonIcon");
      applyIcon(null);
      status.textContent = "Default icons restored.";
    } catch {
      status.textContent = "Could not reset the icon.";
    }
  });
})();
