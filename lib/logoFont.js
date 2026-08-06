import { Space_Grotesk } from "next/font/google";

/** Shared logo typeface (mark + wordmark). */
export const logoFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});
