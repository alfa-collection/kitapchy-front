import { redirect } from "next/navigation";

/** Keep legacy /books links pointing at the current library route. */
export default function BooksPage() {
  redirect("/catalog");
}
