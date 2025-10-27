"use client";
import { useEffect, useState } from "react";

export function useDriverAvailability() {
  const [active, setActive] = useState<boolean>(false);
  useEffect(() => {
    try {
      // Non-auth data: driver availability state
      const v = localStorage.getItem("eatnow_driver_active");
      setActive(v === "1");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      // Non-auth data: driver availability state
      localStorage.setItem("eatnow_driver_active", active ? "1" : "0");
    } catch {}
  }, [active]);
  return { active, setActive };
}


