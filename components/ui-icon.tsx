import type { ReactNode } from "react";

export type UiIconName =
  | "arrow-right"
  | "arrow-up-right"
  | "bookmark"
  | "card"
  | "check"
  | "chevron-down"
  | "close"
  | "heart"
  | "library"
  | "play"
  | "sparkle";

export function UiIcon({ name, size = 18, className = "" }: { name: UiIconName; size?: number; className?: string }) {
  const paths: Record<UiIconName, ReactNode> = {
    "arrow-right": <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    "arrow-up-right": <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    "chevron-down": <path d="m7 10 5 5 5-5" />,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    library: <><path d="M4 19.5V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2Z" /><path d="M8 7h6" /><path d="M8 11h6" /></>,
    play: <path d="m9 6 9 6-9 6V6Z" />,
    sparkle: <><path d="m12 3 1.3 4.1L17 9l-3.7 1.9L12 15l-1.3-4.1L7 9l3.7-1.9L12 3Z" /><path d="m18.5 15 .7 2.1 1.8.9-1.8.9-.7 2.1-.7-2.1L16 18l1.8-.9.7-2.1Z" /></>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
