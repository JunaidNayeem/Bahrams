import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Typography for MDX content (journal articles, craft guides). Plain Tailwind classes so it does
 * not depend on design-system components; semantic colour tokens fall back gracefully.
 */

function MdxLink({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) {
  const className =
    "font-medium text-foreground underline decoration-1 underline-offset-4 hover:decoration-2";
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

/**
 * Markdown images carry no dimensions. Journal photography is exported at 3:2, so that ratio is
 * reserved up front to avoid layout shift; use <Image> in MDX directly for other ratios.
 */
function MdxImage({ src, alt = "", title }: ComponentPropsWithoutRef<"img">) {
  if (typeof src !== "string" || src.length === 0) return null;
  return (
    <span className="my-8 block">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1067}
        sizes="(min-width: 768px) 720px, 100vw"
        className="h-auto w-full rounded-sm"
      />
      {title ? <span className="mt-2 block text-sm text-foreground/70 italic">{title}</span> : null}
    </span>
  );
}

const components = {
  h1: (props) => (
    <h1
      className="mt-2 mb-6 font-serif text-4xl leading-tight font-semibold text-balance md:text-5xl"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mt-12 mb-4 scroll-mt-24 font-serif text-3xl leading-snug font-semibold text-balance"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-8 mb-3 scroll-mt-24 font-serif text-2xl leading-snug font-semibold"
      {...props}
    />
  ),
  h4: (props) => <h4 className="mt-6 mb-2 text-lg font-semibold" {...props} />,
  p: (props) => (
    <p className="my-4 text-base leading-7 text-pretty md:text-lg md:leading-8" {...props} />
  ),
  a: MdxLink,
  strong: (props) => <strong className="font-semibold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6 leading-7" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6 leading-7" {...props} />,
  li: (props) => <li className="pl-1 marker:text-foreground/60" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-8 border-l-2 border-current/30 pl-5 font-serif text-xl leading-8 italic"
      {...props}
    />
  ),
  hr: (props) => <hr className="my-12 border-t border-current/20" {...props} />,
  img: MdxImage,
  code: (props) => (
    <code className="rounded-sm bg-foreground/5 px-1.5 py-0.5 font-mono text-[0.9em]" {...props} />
  ),
  pre: (props) => (
    <pre
      className="my-6 overflow-x-auto rounded-md bg-foreground/5 p-4 font-mono text-sm leading-6"
      {...props}
    />
  ),
  table: (props) => (
    <div className="my-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm md:text-base" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border-b border-current/30 px-3 py-2 font-semibold" scope="col" {...props} />
  ),
  td: (props) => <td className="border-b border-current/10 px-3 py-2 align-top" {...props} />,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
