export type BlogFrontmatter = {
  title: string;
  description: string;
  pubDate: string;
  tags?: string[];
  heroImage?: string;
};

export const PER_PAGE = 9;

export function getPostSlug(file?: string, title?: string): string {
  const fromFile = file?.split(/[/\\]/).pop()?.replace(/\.md$/i, "");
  if (fromFile) return fromFile;

  return (title ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function paginate<T>(items: T[], page: number, perPage: number = PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  return { items: pageItems, totalPages, page, perPage };
}
