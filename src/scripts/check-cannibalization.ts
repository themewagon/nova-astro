import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Guardian of blog content cannibalization.
 *
 * Compares articles (title + tags + description) by Jaccard similarity
 * on sets of normalized tokens and signals pairs that compete
 * about the same search intent. It is used to block the publication of articles
 * cannibalizing existing content and controlling the topic plan.
 */

type ArticleMeta = {
    slug: string;
    title: string;
    description: string;
    tags: string[];
};

type SimilarityPair = {
    left: string;
    right: string;
    score: number;
};

type CheckResult = {
    file: string;
    title: string;
    blocked: boolean;
    blockers: SimilarityPair[];
    warnings: SimilarityPair[];
    all: SimilarityPair[];
};

const BLOCK_THRESHOLD = 0.3;
const WARN_THRESHOLD = 0.2;
const PLAN_HARD_THRESHOLD = 0.35;

// Phrases with low information value; after normalization of diacritics
// "sie" becomes "sie", "maybe" becomes "maybe", etc.
const STOP_WORDS = new Set([
    "czy", "jak", "co", "ile", "za", "do", "na", "w", "o", "z", "ze", "dla",
    "nie", "to", "sie", "jest", "sa", "oraz", "moze", "strony", "strona",
    "internetowa", "internetowej", "firm", "firmy", "firma", "twojej", "twoj", "twoja",
]);

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "src", "content", "blog");
const PLAN_PATH = path.join(ROOT, "src", "content", "blog_content_plan.json");

function normalizeText(text: string): string[] {
    // We remove the Polish tails (NFD + strip) and replace l with l,
    // so that "page" and "page" count as the same token.
    const flattened = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l");

    return flattened
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenSet(article: Pick<ArticleMeta, "title" | "description" | "tags">): Set<string> {
    const sources = [article.title, article.description, ...article.tags];
    return new Set(sources.flatMap((source) => normalizeText(source ?? "")));
}

function jaccard(left: Set<string>, right: Set<string>): number {
    if (left.size === 0 || right.size === 0) return 0;

    let shared = 0;
    for (const token of left) {
        if (right.has(token)) shared += 1;
    }

    // |A ∩ B| / |A ∪ B|
    return shared / (left.size + right.size - shared);
}

function parseFrontmatter(text: string): { title: string; description: string; tags: string[] } | null {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;

    const raw = match[1];
    const get = (key: string): string | undefined => {
        const found = raw.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
        return found?.[1]?.trim();
    };

    const unquote = (value: string | undefined): string => (value ?? "").replace(/^["']|["']$/g, "");

    const tags: string[] = [];
    const tagsMatch = raw.match(/^tags:\s*\[([^\]]*)\]/m);
    if (tagsMatch) {
        tags.push(
            ...tagsMatch[1]
                .split(",")
                .map((tag) => unquote(tag.trim()))
                .filter(Boolean),
        );
    }

    return { title: unquote(get("title")), description: unquote(get("description")), tags };
}

async function loadArticles(): Promise<ArticleMeta[]> {
    const files = (await readdir(BLOG_DIR)).filter((file) => file.endsWith(".md"));
    const articles: ArticleMeta[] = [];

    for (const file of files) {
        const text = await readFile(path.join(BLOG_DIR, file), "utf8");
        const meta = parseFrontmatter(text);
        if (!meta) continue;

        articles.push({ slug: file.replace(/\.md$/, ""), ...meta });
    }

    return articles;
}

function comparePair(left: ArticleMeta, right: ArticleMeta): SimilarityPair {
    return {
        left: left.slug,
        right: right.slug,
        score: jaccard(tokenSet(left), tokenSet(right)),
    };
}

function pairLabel(pair: SimilarityPair, articles: ArticleMeta[]): string {
    const target = articles.find((article) => article.slug === pair.right);
    const title = target ? ` („${target.title}")` : "";
    return `${path.join("src", "content", "blog", `${pair.right}.md`)}${title} — ${Math.round(pair.score * 100)}%`;
}

// For the corpus report, we show both members of the pair because neither side
// is not a "reference point" known from the headline.
function pairBothSides(pair: SimilarityPair, articles: ArticleMeta[]): string {
    const left = articles.find((article) => article.slug === pair.left);
    const right = articles.find((article) => article.slug === pair.right);
    const leftLabel = left ? `${pair.left} („${left.title}")` : pair.left;
    const rightLabel = right ? `${pair.right} („${right.title}")` : pair.right;
    return `${leftLabel}  <->  ${rightLabel} — ${Math.round(pair.score * 100)}%`;
}

function printSection(heading: string, pairs: SimilarityPair[], articles: ArticleMeta[]): void {
    if (pairs.length === 0) {
        console.log(`  ${heading}: brak`);
        return;
    }

    console.log(`  ${heading}:`);
    for (const pair of pairs) {
        console.log(`    ${pairLabel(pair, articles)}`);
    }
}

/**
 * Checks a single article against the entire corpus.
 * Prints a report and returns the result (block at >= 0.30, warning at 0.20-0.29).
 */
export async function checkArticle(filePath: string): Promise<CheckResult> {
    const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT, filePath);
    const relative = path.relative(ROOT, absolute).replaceAll("\\", "/");

    const [articleText, allArticles] = await Promise.all([
        readFile(absolute, "utf8"),
        loadArticles(),
    ]);

    const meta = parseFrontmatter(articleText);
    if (!meta) {
        throw new Error(`Nie można sparsować frontmattera artykułu: ${relative}`);
    }

    const article: ArticleMeta = {
        slug: path.basename(absolute).replace(/\.md$/, ""),
        ...meta,
    };

    const pairs = allArticles
        .filter((other) => other.slug !== article.slug)
        .map((other) => comparePair(article, other))
        .sort((a, b) => b.score - a.score);

    const blockers = pairs.filter((pair) => pair.score >= BLOCK_THRESHOLD);
    const warnings = pairs.filter(
        (pair) => pair.score >= WARN_THRESHOLD && pair.score < BLOCK_THRESHOLD,
    );

    console.log(`=== Strażnik kanibalizacji: ${relative} ===`);
    console.log(`Artykuł: ${meta.title}`);
    console.log(`Porównano z ${allArticles.length - 1} innymi artykułami.`);
    console.log("");

    printSection("BLOKADA (>= 30%)", blockers, allArticles);
    printSection("Ostrzeżenia (20-29%)", warnings, allArticles);

    if (blockers.length > 0) {
        console.log("");
        console.log(`WYNIK: BLOKADA — artykuł kanibalizuje ${blockers.length} istniejące treści.`);
    } else {
        console.log("");
        console.log("WYNIK: OK — brak kanibalizacji powyżej progu blokady.");
    }

    return { file: relative, title: meta.title, blocked: blockers.length > 0, blockers, warnings, all: pairs };
}

/**
 * Checks the topic plan (blog_content_plan.json): each topic "planned"
 * in relation to existing articles and in relation to other topics of the plan.
 * Exit code 1 at any similarity >= 0.35.
 */
async function runPlanCheck(): Promise<void> {
    // Starter-kit does not have a topic plan at the start (blog_content_plan.json);
    // --plan mode remains for projects that add such a plan.
    if (!existsSync(PLAN_PATH)) {
        console.log("Brak blog_content_plan.json, tryb --plan pominął kontrolę planu.");
        return;
    }
    const plan = JSON.parse(await readFile(PLAN_PATH, "utf8")) as {
        topics: Array<{ id: string; title: string; status: string }>;
    };
    const articles = await loadArticles();

    const planned = plan.topics.filter((topic) => topic.status === "planned");
    const plannedMeta: ArticleMeta[] = planned.map((topic) => ({
        slug: topic.id,
        title: topic.title,
        description: "",
        tags: [],
    }));

    const hardBlockers: SimilarityPair[] = [];
    const blockers: SimilarityPair[] = [];
    const warnings: SimilarityPair[] = [];

    // Each plan topic relative to existing articles
    for (const topic of plannedMeta) {
        for (const article of articles) {
            const pair = { left: topic.slug, right: article.slug, score: jaccard(tokenSet(topic), tokenSet(article)) };
            if (pair.score >= PLAN_HARD_THRESHOLD) hardBlockers.push(pair);
            else if (pair.score >= BLOCK_THRESHOLD) blockers.push(pair);
            else if (pair.score >= WARN_THRESHOLD) warnings.push(pair);
        }
    }

    // Plan topics relative to each other (each pair counted once)
    for (let i = 0; i < plannedMeta.length; i += 1) {
        for (let j = i + 1; j < plannedMeta.length; j += 1) {
            const pair = {
                left: plannedMeta[i].slug,
                right: plannedMeta[j].slug,
                score: jaccard(tokenSet(plannedMeta[i]), tokenSet(plannedMeta[j])),
            };
            if (pair.score >= PLAN_HARD_THRESHOLD) hardBlockers.push(pair);
            else if (pair.score >= BLOCK_THRESHOLD) blockers.push(pair);
            else if (pair.score >= WARN_THRESHOLD) warnings.push(pair);
        }
    }

    const allSuspects = [...hardBlockers, ...blockers, ...warnings].sort((a, b) => b.score - a.score);
    const findTitle = (slug: string): string => {
        const topic = planned.find((entry) => entry.id === slug);
        if (topic) return `temat planu „${topic.title}”`;
        const article = articles.find((entry) => entry.slug === slug);
        return article ? `artykuł „${article.title}”` : slug;
    };

    console.log("=== Strażnik kanibalizacji planu tematów ===");
    console.log(`Tematów w planie (status=planned): ${planned.length}`);
    console.log(`Istniejących artykułów: ${articles.length}`);
    console.log("");

    console.log(`TWARDA BLOKADA planu (>= 35%): ${hardBlockers.length}`);
    console.log(`Kanibalizacja (30-34%): ${blockers.length}`);
    console.log(`Ostrzeżenia (20-29%): ${warnings.length}`);
    console.log("");

    if (allSuspects.length > 0) {
        console.log("Najbardziej podejrzane pary:");
        for (const [index, pair] of allSuspects.slice(0, 10).entries()) {
            console.log(`  ${index + 1}. ${findTitle(pair.left)}  <->  ${findTitle(pair.right)} — ${Math.round(pair.score * 100)}%`);
        }
        console.log("");
    }

    if (hardBlockers.length > 0) {
        console.log(`WYNIK: TWARDA BLOKADA — ${hardBlockers.length} par w planie >= 35%. Przepisz tematy przed generowaniem treści.`);
        process.exitCode = 1;
    } else {
        console.log("WYNIK: plan przechodzi kontrolę (brak par >= 35%).");
    }
}

/**
 * Full corpus report: strongest pairs between existing articles.
 */
async function runCorpusReport(): Promise<void> {
    const articles = await loadArticles();
    const pairs: SimilarityPair[] = [];

    for (let i = 0; i < articles.length; i += 1) {
        for (let j = i + 1; j < articles.length; j += 1) {
            pairs.push(comparePair(articles[i], articles[j]));
        }
    }

    pairs.sort((a, b) => b.score - a.score);
    const overThreshold = pairs.filter((pair) => pair.score >= BLOCK_THRESHOLD);

    console.log("=== Strażnik kanibalizacji: raport korpusu ===");
    console.log(`Artykułów w korpusie: ${articles.length}`);
    console.log(`Par powyżej progu blokady (>= 30%): ${overThreshold.length}`);
    console.log("");

    console.log("TOP 30 najbardziej podobnych par:");
    for (const [index, pair] of pairs.slice(0, 30).entries()) {
        console.log(`  ${index + 1}. ${pairBothSides(pair, articles)}`);
    }
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

async function main(): Promise<void> {
    const fileArgIndex = process.argv.indexOf("--file");
    if (fileArgIndex >= 0) {
        const filePath = process.argv[fileArgIndex + 1];
        if (!filePath) {
            console.error("Brak ścieżki po --file.");
            process.exitCode = 1;
            return;
        }

        const result = await checkArticle(filePath);
        if (result.blocked) process.exitCode = 1;
        return;
    }

    if (process.argv.includes("--plan")) {
        await runPlanCheck();
        return;
    }

    await runCorpusReport();
}

if (isCli) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}