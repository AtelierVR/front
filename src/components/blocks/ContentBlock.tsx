interface ContentBlockProps {
  /** Raw HTML or plain-text content to display. */
  html?: string;
  /** Plain text content (mutually exclusive with html). */
  text?: string;
  className?: string;
}

/**
 * ContentBlock renders server-controlled HTML or plain-text content.
 * The html prop should only be populated from trusted, admin-controlled sources
 * (e.g., instance terms/privacy/rules pages fetched via wellKnown endpoints).
 */
export function ContentBlock({ html, text, className }: ContentBlockProps) {
  if (html) {
    return (
      <div
        className={`prose prose-neutral dark:prose-invert max-w-none ${className ?? ''}`}
        // Content sourced from the instance admin's own endpoints (trusted)
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (text) {
    return (
      <div className={`whitespace-pre-wrap text-foreground ${className ?? ''}`}>
        {text}
      </div>
    );
  }

  return null;
}
