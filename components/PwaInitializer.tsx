"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

export const PwaInitializer = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
        if (existingRegistration) {
          await existingRegistration.update();
          return;
        }
        await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" });
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    void register();
  }, []);

  return null;
};
