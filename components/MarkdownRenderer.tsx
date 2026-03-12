import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-3xl font-bold text-brand-300 mt-6 mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-semibold text-brand-200 mt-5 mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-semibold text-brand-100 mt-4 mb-2">{children}</h3>,
        p:  ({ children }) => <p className="mb-4 text-slate-300 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="mb-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="mb-4 space-y-1 list-decimal ml-6 text-slate-300">{children}</ol>,
        li: ({ children }) => <li className="ml-6 list-disc text-slate-300">{children}</li>,
        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
        em: ({ children }) => <em className="text-brand-100">{children}</em>,
        code: ({ children }) => <code className="bg-slate-800 text-brand-300 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-brand-500 pl-4 my-4 text-slate-400 italic">{children}</blockquote>,
        hr: () => <hr className="border-slate-700 my-6" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
