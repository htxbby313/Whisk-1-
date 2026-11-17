import * as React from 'react';
import { Check, Copy, ExternalLink, Mail, Scale, X } from 'lucide-react';
import {
  CURRENT_LEGAL_EFFECTIVE_DATE,
  LEGAL_DOCS_BY_ID,
  LEGAL_DOCUMENTS,
  LegalDocId,
} from '../legal/catalog';

interface LegalModalProps {
  activeDocId: LegalDocId | null;
  onSelectDoc: (docId: LegalDocId) => void;
  onClose: () => void;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`|privacy@whisk\.travel)/g);
  return segments.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-[var(--whisk-navy)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 bg-slate-100 text-[var(--whisk-navy)] rounded-md text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part === 'privacy@whisk.travel') {
      return (
        <a
          key={idx}
          href="mailto:privacy@whisk.travel"
          className="text-[var(--whisk-terracotta)] font-semibold hover:underline"
        >
          privacy@whisk.travel
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function LegalMarkdownView({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.trim() === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-slate-200" />);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${i}`}
          className="text-2xl sm:text-3xl font-black text-[var(--whisk-navy)] tracking-tight mb-3"
        >
          {line.slice(2).trim()}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className="text-lg sm:text-xl font-black text-[var(--whisk-navy)] tracking-tight mt-7 mb-2.5"
        >
          {line.slice(3).trim()}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className="text-base font-extrabold text-[var(--whisk-navy)] mt-5 mb-2"
        >
          {line.slice(4).trim()}
        </h4>
      );
      i++;
      continue;
    }

    // Markdown table block
    if (line.trimStart().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines
        .filter((row) => !/^\|[\s:|-]+\|$/.test(row))
        .map((row) =>
          row
            .slice(1, row.endsWith('|') ? -1 : undefined)
            .split('|')
            .map((cell) => cell.trim())
        );

      if (rows.length > 0) {
        const [header, ...body] = rows;
        elements.push(
          <div key={`tbl-${i}`} className="my-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {header.map((cell, ci) => (
                    <th key={ci} className="px-4 py-3 font-bold text-[var(--whisk-navy)]">
                      {renderInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {body.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-slate-600 align-top">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet list block
    if (line.trimStart().startsWith('- ')) {
      const listItems: Array<{ indent: boolean; text: string }> = [];
      while (i < lines.length && lines[i].trimStart().startsWith('- ')) {
        const raw = lines[i];
        listItems.push({
          indent: raw.startsWith('  '),
          text: raw.trimStart().slice(2).trim(),
        });
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 space-y-2 text-sm text-slate-600 leading-relaxed">
          {listItems.map((item, li) => (
            <li
              key={li}
              className={`flex items-start gap-2.5 ${item.indent ? 'ml-6' : ''}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--whisk-terracotta)] shrink-0 mt-2" />
              <span>{renderInlineMarkdown(item.text)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Paragraph block
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      lines[i].trim() !== '---' &&
      !lines[i].startsWith('#') &&
      !lines[i].trimStart().startsWith('- ') &&
      !lines[i].trimStart().startsWith('|')
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      elements.push(
        <p key={`p-${i}`} className="my-2.5 text-sm text-slate-600 leading-relaxed">
          {paraLines.map((pl, pi) => (
            <React.Fragment key={pi}>
              {pi > 0 && ' '}
              {renderInlineMarkdown(pl)}
            </React.Fragment>
          ))}
        </p>
      );
    }
  }

  return <div className="space-y-1">{elements}</div>;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  activeDocId,
  onSelectDoc,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!activeDocId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeDocId, onClose]);

  if (!activeDocId) return null;

  const currentDoc = LEGAL_DOCS_BY_ID[activeDocId];
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${currentDoc.path}`
      : currentDoc.path;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div
      className="fixed inset-0 z-[360] flex items-center justify-center p-3 sm:p-6 bg-[var(--whisk-navy)]/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="vibrant-gradient w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="legal-modal-title"
                className="text-lg sm:text-xl font-black text-[var(--whisk-navy)] truncate"
              >
                Whisk Legal Center
              </h2>
              <p className="text-xs font-semibold text-slate-500 truncate">
                Effective {CURRENT_LEGAL_EFFECTIVE_DATE} · Whisk, Inc. (California, USA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[40px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Link Copied' : 'Copy Link'}
            </button>
            <a
              href={currentDoc.apiPath}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors min-h-[40px]"
            >
              <span>API View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close legal document viewer"
              className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-200/70 text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-8 py-3 border-b border-slate-200 bg-white flex gap-2 overflow-x-auto shrink-0">
          {LEGAL_DOCUMENTS.map((docItem) => {
            const active = docItem.id === activeDocId;
            return (
              <button
                key={docItem.id}
                type="button"
                onClick={() => onSelectDoc(docItem.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer min-h-[40px] ${
                  active
                    ? 'vibrant-gradient text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-[var(--whisk-navy)]'
                }`}
              >
                {docItem.shortTitle}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
          <div className="max-w-3xl mx-auto">
            <LegalMarkdownView markdown={currentDoc.markdown} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 sm:px-8 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <a
            href="mailto:privacy@whisk.travel"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[var(--whisk-terracotta)]"
          >
            <Mail className="w-4 h-4 text-[var(--whisk-terracotta)]" />
            <span>Questions, GDPR/CCPA requests & opt-outs: privacy@whisk.travel</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[var(--whisk-navy)] text-white text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer min-h-[42px]"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
