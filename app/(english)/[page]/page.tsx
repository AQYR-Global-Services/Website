import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegacyPage } from "@/components/LegacyPage";
import { pages, pageMetadata, type PageSlug } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  if (!Object.hasOwn(pages, page)) notFound();
  const details = pages[page as PageSlug];
  return pageMetadata(details.title, details.description, `/${page}`);
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (!Object.hasOwn(pages, page)) notFound();
  return <LegacyPage fileName={pages[page as PageSlug].fileName} />;
}
