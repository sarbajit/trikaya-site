// No Tailwind Typography plugin is installed, so rich-text HTML (from RichTextEditor,
// rendered raw in StaticPageView) is styled via child-selector utilities instead of `prose`.
export const RICH_TEXT_CLASS =
  "max-w-none text-sm leading-relaxed text-foreground/85 " +
  "[&_h2]:font-display [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:text-foreground [&_h2]:first:mt-0 " +
  "[&_h3]:font-display [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:text-foreground " +
  "[&_p]:mt-3 [&_p]:first:mt-0 " +
  "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:mt-1 " +
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_blockquote]:mt-3 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/70 " +
  "[&_strong]:font-semibold";
