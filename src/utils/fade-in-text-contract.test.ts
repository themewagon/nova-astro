import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('shared motion contract', () => {
	it('uses one viewport engine without a scroll listener or component keyframes', () => {
		const motion = read('public/js/motion.js');
		const styles = read('src/styles/motion.css');
		const layout = read('src/layouts/Layout.astro');

		expect(motion).toContain('function init()');
		expect(motion).toContain('function collectViewportTargets()');
		expect(motion).toContain("var viewportSelector = '[data-motion=\"viewport\"]'");
		expect(motion).toContain('function autoTargets(section)');
		expect(motion).toContain('IntersectionObserver');
		expect(motion).toContain('observer.observe(element)');
		expect(motion).toContain('compareDocumentPosition');
		expect(motion).toContain("document.addEventListener('astro:page-load', scheduleInit)");
		expect(motion).toContain("document.addEventListener('astro:after-swap', scheduleInit)");
		expect(motion).not.toContain("addEventListener('scroll'");
		expect(motion).toContain("'[data-motion-section], footer[id]'");
		expect(motion).toContain("section.tagName === 'FOOTER'");
		expect(motion).toContain('data-motion-auto-target');
		expect(motion).toContain("hasAttribute('data-motion-disabled')");

		expect(styles).toContain('--motion-duration: 1000ms');
		expect(styles).toContain('--motion-ease: cubic-bezier(0.16, 1, 0.3, 1)');
		expect(styles).toContain('--motion-stagger: 120ms');
		expect(styles).toContain('--motion-blur: 3px');
		expect(styles).toContain('--motion-distance: 0.6rem');
		expect(styles).toContain('[data-motion-profile="soft"] > *');
		expect(styles).toContain('[data-motion="viewport"]');
		expect(styles).toContain('filter: blur(var(--motion-blur))');
		expect(styles).toContain('prefers-reduced-motion: reduce');
		expect(styles).toContain('animation: none !important');

		expect(layout).toContain('src="/js/motion.js"');
		expect(layout).toContain('data-astro-rerun');
		expect(layout).not.toContain('__novaViewportMotionFallback');
		expect(layout).not.toContain('motionScript');
	});

	it('marks Nova sections with the soft profile instead of local animation systems', () => {
		const hero = read('src/components/registry/hero/NovaHeroResponsiveBlock.astro');
		const team = read('src/components/registry/about/TeamBlock.astro');
		const testimonials = read('src/components/registry/social/TestimonialV2Block.astro');

		expect(hero).toContain('data-motion-sequence="fade"');
		expect(hero).toContain('data-motion="fade"');
		expect(team).toContain('data-motion="viewport"');
		expect(team).toContain('data-motion-sequence="viewport" data-motion-profile="soft"');
		expect(testimonials).toContain('data-motion-sequence="viewport" data-motion-profile="soft"');
		expect(team).not.toContain('@keyframes');
		expect(testimonials).toContain('@keyframes testimonial-v2-up');
		expect(testimonials).not.toContain('@keyframes nova-testimonials-entry');
	});

	it('keeps the section motion marker available to the global engine', () => {
		expect(read('src/components/ui/layout/Section.astro')).toContain('data-motion-section');
	});
});
