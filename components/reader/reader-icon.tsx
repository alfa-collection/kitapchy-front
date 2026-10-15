export type ReaderIconName =
  | "back"
  | "previous"
  | "next"
  | "play"
  | "pause"
  | "sound";

export function ReaderIcon({
  name,
  size = 18,
}: {
  name: ReaderIconName;
  size?: number;
}) {
  const paths = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
    previous: <><path d="M7 6v12" /><path d="m18 6-7 6 7 6V6Z" /></>,
    next: <><path d="M17 6v12" /><path d="m6 6 7 6-7 6V6Z" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 6v12" /><path d="M16 6v12" /></>,
    sound: <><path d="M5 10v4h3l4 3V7l-4 3H5Z" /><path d="M16 9.5a4 4 0 0 1 0 5" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
