import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('component preview motion scope', () => {
	it('keeps hover transitions enabled in the full component preview', () => {
		const layout = read('src/layouts/Layout.astro');
		const previewFrame = read('src/components/dev/component-library/ComponentPreviewFrame.astro');

		expect(previewFrame).toContain("...(isThumbnail ? ['component-frame-thumbnail'] : [])");
		expect(layout).toContain("const isComponentThumbnail = bodyClassNames.includes('component-frame-thumbnail');");
		expect(layout).toContain("data-motion-disabled={isComponentThumbnail ? '' : undefined}");
	});

	it('uses the global motion reveal for service cards', () => {
		const servicesGrid = read('src/components/registry/services/ServicesGridBlock.astro');
		const serviceCard = read('src/components/ui/molecules/ServiceCard.astro');

		expect(servicesGrid).toContain('global auto reveal');
		expect(servicesGrid).not.toContain('service-enter');
		expect(servicesGrid).not.toContain('IntersectionObserver');
		expect(serviceCard).toContain('service-card');
		expect(serviceCard).toContain('transition: transform 400ms');
		expect(serviceCard).toContain('transform: translateY(-4px)');
	});

	it('disables thumbnail entry animations without cancelling hover transitions', () => {
		const motionStyles = read('src/styles/motion.css');

		expect(motionStyles).toContain('html[data-motion-disabled] *');
		expect(motionStyles).toContain('animation: none !important;');
		expect(motionStyles).toContain('scroll-behavior: auto !important;');
		expect(motionStyles).not.toContain('html[data-motion-disabled] * {\n    animation: none !important;\n    transition: none !important;');
	});
});
