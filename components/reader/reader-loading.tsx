import Image from "next/image";

export function ReaderLoading({ title }: { title: string }) {
  return (
    <section className="reader-loading-screen" role="status" aria-live="polite" aria-label="Loading book">
      <div className="loading-book" aria-hidden="true">
        <span className="loading-book-spine" />
        <Image className="loading-book-mark" src="/logo.png" alt="" width={450} height={450} loading="eager" />
        <span className="loading-book-page loading-book-page-one" />
        <span className="loading-book-page loading-book-page-two" />
      </div>
      <p className="reader-loading-kicker">Preparing your reading room</p>
      <h1>{title || "Your book"}</h1>
      <p className="reader-loading-copy">Opening the first passages and getting the audio ready.</p>
      <div className="reader-loading-progress" aria-hidden="true"><i /></div>
    </section>
  );
}
