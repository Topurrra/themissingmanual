// Server-only. Per-guide EPUB export - the offline story's other half (PWA
// covers "read in the browser without a connection"; this covers "read on an
// actual e-reader"). Hand-rolled ZIP container using only node:zlib
// (deflateRawSync + the crc32 stabilized in Node 22) - no new dependency for
// what is a small, fixed-shape archive (mimetype + a handful of XML/XHTML
// files), and it avoids trusting a third-party zip lib to get the one byte-
// exact requirement (mimetype stored, uncompressed, first entry) right.
import { deflateRawSync, crc32 } from 'node:zlib';

function dosDateTime() {
  // Fixed date - ZIP requires SOME date/time, but its value doesn't affect
  // validity or reader behavior for an on-demand generated file like this.
  return { time: 0, day: (2026 - 1980) << 9 | (1 << 5) | 1 };
}

class ZipWriter {
  constructor() {
    this.entries = [];
    this.chunks = [];
    this.offset = 0;
  }

  add(name, data, { store = false } = {}) {
    const nameBuf = Buffer.from(name, 'utf8');
    const content = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const crc = crc32(content) >>> 0;
    const compressed = store ? content : deflateRawSync(content);
    const method = store ? 0 : 8;
    const { time, day } = dosDateTime();

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    const entryOffset = this.offset;
    this.chunks.push(local, nameBuf, compressed);
    this.offset += local.length + nameBuf.length + compressed.length;
    this.entries.push({ nameBuf, crc, compressedSize: compressed.length, size: content.length, method, time, day, offset: entryOffset });
  }

  finalize() {
    const central = [];
    let centralSize = 0;
    for (const e of this.entries) {
      const rec = Buffer.alloc(46);
      rec.writeUInt32LE(0x02014b50, 0);
      rec.writeUInt16LE(20, 4);
      rec.writeUInt16LE(20, 6);
      rec.writeUInt16LE(0, 8);
      rec.writeUInt16LE(e.method, 10);
      rec.writeUInt16LE(e.time, 12);
      rec.writeUInt16LE(e.day, 14);
      rec.writeUInt32LE(e.crc, 16);
      rec.writeUInt32LE(e.compressedSize, 20);
      rec.writeUInt32LE(e.size, 24);
      rec.writeUInt16LE(e.nameBuf.length, 28);
      rec.writeUInt16LE(0, 30);
      rec.writeUInt16LE(0, 32);
      rec.writeUInt16LE(0, 34);
      rec.writeUInt16LE(0, 36);
      rec.writeUInt32LE(0, 38);
      rec.writeUInt32LE(e.offset, 42);
      central.push(rec, e.nameBuf);
      centralSize += rec.length + e.nameBuf.length;
    }
    const centralOffset = this.offset;

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(this.entries.length, 8);
    eocd.writeUInt16LE(this.entries.length, 10);
    eocd.writeUInt32LE(centralSize, 12);
    eocd.writeUInt32LE(centralOffset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...this.chunks, ...central, eocd]);
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const VOID_TAGS = 'br|hr|img|input|meta|link|source|track|col|wbr';

// The site's phase.html is real HTML5, not XHTML - e-readers need XHTML.
// Self-close void elements, and drop the interactive-widget fences (raw
// quiz/exercise/playground/explainer JSON - config for client JS, not prose;
// showing it as text would be actively worse than omitting it). Real code
// blocks (language-python, language-mermaid, etc.) are left as-is - that IS
// content worth reading in a book.
function sanitizeForEpub(html) {
  let out = String(html || '');
  out = out.replace(/<pre>\s*<code class="language-(quiz|exercise|playground-[\w-]+|explainer-[\w-]+)">[\s\S]*?<\/code>\s*<\/pre>/g, '');
  // Server-rendered mermaid diagrams are inline SVG themed via the site's CSS vars,
  // which the e-book doesn't have - strip them rather than ship raw sentinel colors.
  out = out.replace(/<figure class="mmd-ssr"[\s\S]*?<\/figure>/g, '');
  const voidRe = new RegExp(`<(${VOID_TAGS})((?:\\s+[^<>]*)?)>`, 'gi');
  out = out.replace(voidRe, (m, tag, attrs) => (attrs.trimEnd().endsWith('/') ? `<${tag}${attrs}>` : `<${tag}${attrs.trimEnd()} />`));
  return out;
}

const STYLE_CSS = `body{font-family:Georgia,'Times New Roman',serif;line-height:1.6;margin:1.2em;color:#1a1a1a}
h1,h2,h3{font-family:Helvetica,Arial,sans-serif;line-height:1.3}
pre,code{font-family:'Courier New',monospace;background:#f2f2f2;border-radius:3px}
code{padding:0.15em 0.35em}
pre{padding:0.8em;overflow-x:auto;white-space:pre-wrap;word-wrap:break-word}
pre code{padding:0;background:none}
img{max-width:100%}
a{color:#0e7c86}`;

// chapters: [{ id, title, html }] - one per real phase, in reading order.
export function buildEpub({ title, author, slug, chapters }) {
  const zip = new ZipWriter();
  zip.add('mimetype', 'application/epub+zip', { store: true });

  zip.add('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  zip.add('OEBPS/style.css', STYLE_CSS);

  const uid = `urn:uuid:tmm-${slug}`;
  const manifestItems = chapters.map((c, i) => `<item id="chap${i}" href="${c.id}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ');
  const spineItems = chapters.map((c, i) => `<itemref idref="chap${i}"/>`).join('\n    ');

  zip.add('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${esc(uid)}</dc:identifier>
    <dc:title>${esc(title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>${esc(author)}</dc:creator>
    <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" properties="nav" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`);

  const navItems = chapters.map((c) => `<li><a href="${c.id}.xhtml">${esc(c.title)}</a></li>`).join('\n      ');
  zip.add('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${esc(title)}</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${esc(title)}</h1>
    <ol>
      ${navItems}
    </ol>
  </nav>
</body>
</html>`);

  const navPoints = chapters.map((c, i) => `<navPoint id="np${i}" playOrder="${i + 1}">
      <navLabel><text>${esc(c.title)}</text></navLabel>
      <content src="${c.id}.xhtml"/>
    </navPoint>`).join('\n    ');
  zip.add('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${esc(uid)}"/></head>
  <docTitle><text>${esc(title)}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`);

  for (const c of chapters) {
    zip.add(`OEBPS/${c.id}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${esc(c.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
${sanitizeForEpub(c.html)}
</body>
</html>`);
  }

  return zip.finalize();
}
