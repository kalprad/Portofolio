"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Skrip pra-render: menyetel tema sebelum cat pertama supaya tidak berkedip. */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("tema");
    var dark = stored ? stored === "gelap"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setSiap(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tema", next ? "gelap" : "terang");
    } catch {
      // Mode penyamaran memblokir localStorage — tema tetap berlaku sesi ini.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
    >
      {/* Sebelum hidrasi selesai, ikon disamakan supaya tidak ada loncatan. */}
      {siap && dark ? (
        <Sun className="size-[18px]" aria-hidden />
      ) : (
        <Moon className="size-[18px]" aria-hidden />
      )}
    </button>
  );
}
