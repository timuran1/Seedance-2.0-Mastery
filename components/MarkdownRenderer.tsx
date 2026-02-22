import React from 'react';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  // A very rudimentary markdown parser for our specific needs
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-brand-300 mt-6 mb-4">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold text-brand-200 mt-5 mb-3">{line.substring(3)}</h2>;
      }
      
      // Lists
      if (line.trim().startsWith('* ')) {
        // Handle bold within list items
        let processedLine = line.trim().substring(2);
        const parts = processedLine.split(/(\*\*.*?\*\*)/g);
        
        return (
          <li key={index} className="ml-6 mb-2 list-disc text-slate-300">
             {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="text-white">{part.substring(2, part.length - 2)}</strong>;
                }
                return <span key={i}>{part}</span>;
             })}
          </li>
        );
      }

      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-4"></div>;
      }

      // Paragraphs with inline styling
      let processedLine = line;
      // Italics
      const italicParts = processedLine.split(/(\*.*?\*)/g);
      
      return (
        <p key={index} className="mb-4 text-slate-300 leading-relaxed">
           {italicParts.map((part, i) => {
                if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                    return <em key={i} className="text-brand-100">{part.substring(1, part.length - 1)}</em>;
                }
                // Handle bold inside non-italic parts
                const boldParts = part.split(/(\*\*.*?\*\*)/g);
                return boldParts.map((bPart, j) => {
                     if (bPart.startsWith('**') && bPart.endsWith('**')) {
                        return <strong key={`${i}-${j}`} className="text-white">{bPart.substring(2, bPart.length - 2)}</strong>;
                    }
                    return <span key={`${i}-${j}`}>{bPart}</span>;
                });
             })}
        </p>
      );
    });
  };

  return (
    <div className="prose prose-invert max-w-none">
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
