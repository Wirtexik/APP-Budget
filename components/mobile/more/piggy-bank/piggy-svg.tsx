import { useId } from "react";

// Płaska świnka z makiety J2 (design/mobile/skarbonka.html), viewBox 200 × 160:
// tułów to elipsa 70 × 54 ze środkiem w 98/84. Gradient tułowia to te same
// kolory co `--gradient-primary` (identyczny w obu motywach; SVG nie przyjmuje
// gradientu CSS), cień – `--glow`, który zmienia się z motywem.
export function PiggySvg() {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 200 160"
      aria-hidden
      className="block w-full drop-shadow-[0_14px_22px_var(--glow)]"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* Nóżki */}
      <rect x="55.5" y="124" width="22" height="28" rx="9" fill="#6366f1" />
      <rect x="108" y="124" width="22" height="28" rx="9" fill="#6366f1" />
      {/* Ogonek-sprężynka */}
      <path
        d="M34 84 q-16 0 -14 -14 q2 -9 10 -5 q6 4 -2 9"
        fill="none"
        stroke="#a855f7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Ucho */}
      <path
        d="M110 43.56 C112 21.56 120 9.56 128 11.56 C136 19.56 142 31.56 144 43.56 Z"
        fill="#9b5cf6"
      />
      <ellipse cx="98" cy="84" rx="70" ry="54" fill={`url(#${gradientId})`} />
      {/* Ryjek z dziurkami */}
      <rect x="152" y="69" width="36" height="32" rx="14" fill="#c4b5fd" />
      <circle cx="164" cy="85" r="3.4" fill="#6d28d9" />
      <circle cx="176" cy="85" r="3.4" fill="#6d28d9" />
      {/* Oko */}
      <circle cx="141.4" cy="62.4" r="5" fill="#fff" />
      {/* Szczelina na monety */}
      <rect x="76" y="37" width="34" height="6" rx="3" fill="rgb(255 255 255 / 0.5)" />
    </svg>
  );
}
