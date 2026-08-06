import { logoFont } from "@/lib/logoFont";

/**
 * Mindflow monogram: dark-blue mark with M and a tilted F overlaid on it.
 */
export default function LogoMark({ className = "" }) {
  return (
    <span
      className={`${logoFont.className} relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0B1F3A] text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <span className="select-none text-[15px] font-semibold leading-none tracking-tight text-white/40">
        M
      </span>
      <span
        className="pointer-events-none absolute left-[13px] top-[7px] select-none origin-center -rotate-[22deg] text-[13px] font-bold leading-none tracking-tight text-white"
        aria-hidden="true"
      >
        F
      </span>
    </span>
  );
}
