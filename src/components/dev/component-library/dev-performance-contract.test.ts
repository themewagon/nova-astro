import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('wydajność biblioteki komponentów developerskich', () => {
	it('uruchamia Lenis globalnie i ładuje go przed lifecycle Astro', () => {
		const layout = read('src/layouts/Layout.astro');

		expect(layout).toContain("data-lenis={enableLenis ? 'true' : undefined}");
		const lenisLibraryLine = layout.split('\n').find((line) => line.includes('src="/js/lenis-lib.min.js"'));
		expect(lenisLibraryLine).not.toContain('-->');
		const lenisScriptLine = layout.split('\n').find((line) => line.includes('src="/js/lenis.js"'));
		expect(lenisScriptLine).not.toContain('-->');
	});

	it('ładuje miniaturki dopiero blisko viewportu i nie uruchamia wideo w thumbnailach', () => {
		const gallery = read('src/components/dev/component-library/ComponentGallery.astro');
		const videoHero = read('src/components/registry/hero/HeroVideoBlock.astro');
		const previewFrame = read('src/components/dev/component-library/ComponentPreviewFrame.astro');
		const thumbnailRoute = read('src/pages/dev/components/thumbnail/[section]/[variant].astro');
		const metadataCatalog = read('src/components/dev/component-library/component-catalog-metadata.ts');
		const componentPreview = read('src/components/dev/component-library/ComponentPreview.astro');

		expect(gallery).toContain("rootMargin: '160px 0px'");
		expect(gallery).toContain('contain-intrinsic-size: 24rem');
		expect(gallery).toContain('resizeObserver.observe(root)');
		expect(gallery).toContain('data-load-more-button');
		expect(gallery).toContain("sessionStorage.getItem(galleryStateKey)");
		expect(gallery).toContain("sessionStorage.setItem(galleryStateKey");
		expect(gallery).toContain("'data-category-id': section.sectionId");
		expect(gallery).toContain("button.classList.toggle('hidden', !matches)");
		expect(gallery).toContain('enableLenis={false}');
		expect(previewFrame).toContain('clientRuntime={!isThumbnail}');
		expect(previewFrame).toContain('enableLenis={false}');
		expect(previewFrame).toContain('body.component-frame-thumbnail:not(.component-frame-standalone) main');
		expect(previewFrame).toContain('html:has(body.component-frame-thumbnail:not(.component-frame-standalone))');
		expect(previewFrame).toContain('component-frame-standalone');
		expect(previewFrame).toContain('--site-header-height: 0px');
		expect(componentPreview).toContain('const previewMinimumHeights = { mobile: 844 };');
		expect(componentPreview).toContain('new ResizeObserver(syncPreviewHeight)');
		expect(componentPreview).toContain('data-section={selected.sectionId}');
		expect(thumbnailRoute).toContain('<ComponentPreviewFrame selected={selected} thumbnail />');
		expect(metadataCatalog).not.toContain("from '@config/component-map'");
		expect(videoHero).toContain("component-frame-thumbnail");
	});
});
