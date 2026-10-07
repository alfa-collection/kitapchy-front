import Image from "next/image";
import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="brand" aria-label="Kitapchy home">
      <Image src="/logo.png" alt="Kitapchy" width={450} height={450} priority />
    </Link>
  );
}
