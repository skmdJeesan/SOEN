import { WebContainer } from "@webcontainer/api";

let webcontainerPromise = null;
export const getWebContainer = () => {
  if (!window.crossOriginIsolated)
    return Promise.reject(new Error("WebContainer requires cross-origin isolation"));

  if (!webcontainerPromise) webcontainerPromise = WebContainer.boot();
  return webcontainerPromise;
};
