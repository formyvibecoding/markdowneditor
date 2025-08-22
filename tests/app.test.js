import test from 'node:test';
import assert from 'node:assert/strict';
import { convertMarkdown, createMarkdownBlob } from '../utils.js';
import { exportMultipagePDF } from '../preview.js';

// stub libraries
const fakeMarked = { parse: md => `<p>${md}</p><script>alert('x')</script>` };
const fakeDOMPurify = { sanitize: html => html.replace(/<script.*?>.*?<\/script>/g, '') };

test('convertMarkdown sanitizes script tags', () => {
  const html = convertMarkdown('hello', fakeMarked, fakeDOMPurify);
  assert.equal(html, '<p>hello</p>');
});

test('createMarkdownBlob generates markdown file', () => {
  const blob = createMarkdownBlob('# title');
  assert.equal(blob.type, 'text/markdown;charset=utf-8');
  assert.equal(blob.size, 7);
});

test('exportMultipagePDF invokes html2pdf', () => {
  let called = false;
  const stub = () => ({
    from: () => ({
      set: () => ({ save: () => { called = true; } })
    })
  });
  exportMultipagePDF({}, stub);
  assert.ok(called);
});

