"use client";

export function ClickableText({
  text,
  onWordClick,
}: {
  text: string;
  onWordClick: (word: string, target: HTMLElement) => void;
}) {
  return <>{text.split(/([A-Za-z]+(?:['’][A-Za-z]+)?)/g).map((part, index) =>
    /^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(part) ? (
      <button key={`${part}-${index}`} type="button" className="reader-word" onClick={(event) => { event.stopPropagation(); onWordClick(part, event.currentTarget); }}>
        {part}
      </button>
    ) : part,
  )}</>;
}
