import { CatalogClient } from "@/components/catalog-client";
import { Shell } from "@/components/shell";

export default function CatalogPage() { return <Shell><main className="catalog-page"><p className="eyebrow">THE LIBRARY</p><h1>Find a story you’ll love.</h1><p className="page-intro">Every book pairs the original English text with an easy translation, natural audio and progress tracking.</p><CatalogClient /></main></Shell>; }
