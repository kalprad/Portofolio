"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Bungkus elemen supaya muncul halus begitu masuk area pandang saat di-scroll,
 * bukan langsung tampil semua saat halaman dimuat.
 *
 * Animasinya cuma sekali per elemen — begitu terlihat, tidak terulang lagi
 * kalau di-scroll naik-turun. Ini juga yang membuatnya aman dipakai untuk
 * daftar panjang (portofolio, tulisan, arsip): observer berhenti memantau
 * elemen setelah animasinya jalan, jadi tidak menumpuk kerja di background.
 *
 * `prefers-reduced-motion` sudah ditangani secara global lewat CSS (lihat
 * globals.css) — durasi transisi otomatis dipangkas nyaris nol, jadi elemen
 * tetap langsung terlihat tanpa gerakan untuk pengguna yang memintanya.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Jeda dalam milidetik, dipakai untuk efek berurutan pada daftar/grid. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTerlihat(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("scroll-reveal", terlihat && "masuk", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
