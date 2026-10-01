import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const contactBlock = fs.readFileSync(path.resolve(import.meta.dirname, "contact/ContactSplitBlock.astro"), "utf8");
const contactForm = fs.readFileSync(path.resolve(import.meta.dirname, "../ui/molecules/ContactForm.astro"), "utf8");
const contactMap = fs.readFileSync(path.resolve(import.meta.dirname, "../ui/molecules/GoogleMapFrame.astro"), "utf8");
const formHandler = fs.readFileSync(path.resolve(import.meta.dirname, "../../../public/js/form-handler.js"), "utf8");

describe("global contact architecture", () => {
  it("composes the contact block from shared form, map and details molecules", () => {
    expect(contactBlock).toContain('import ContactForm from "@components/ui/molecules/ContactForm.astro"');
    expect(contactBlock).toContain('import GoogleMapFrame from "@components/ui/molecules/GoogleMapFrame.astro"');
    expect(contactBlock).toContain('import ContactDetails from "@components/ui/molecules/ContactDetails.astro"');
    expect(contactBlock).not.toContain("<form");
    expect(contactBlock).not.toContain("<iframe");
    expect(contactBlock).not.toContain("<script is:inline");
  });

  it("shows accessible inline form states and keeps failures generic", () => {
    expect(contactForm).toContain("showHeader?: boolean");
    expect(contactForm).toContain("includeRodoConsent?: boolean");
    expect(contactMap).toContain('data-map-iframe');
    expect(formHandler).toContain("function setFeedbackState(form, state, message)");
    expect(formHandler).toContain("data-form-reset");
    expect(formHandler).toContain("form.checkValidity()");
    expect(formHandler).toContain("formTransport");
    expect(formHandler).toContain("feedback.hidden = false");
    expect(formHandler).toContain("form.classList.toggle('is-submitted', state === 'success')");
    expect(formHandler).toContain("getMessage(form, 'Error'");
    expect(formHandler).toContain("getMessage(form, 'NetworkError'");
    expect(formHandler).toContain("getMessage(form, 'InvalidResponse'");
    expect(formHandler).not.toContain("error.message");
    expect(formHandler).not.toContain("Dziękujemy");
    expect(formHandler).toContain("formDebug");
    expect(formHandler).toContain("Form debug");
    expect(formHandler).not.toContain("alert(");
    expect(formHandler).toContain("document.readyState === 'loading'");
  });
});
