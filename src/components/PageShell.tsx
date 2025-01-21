import React from 'react';
import { GetStaticProps, Metadata } from '../types';

export function PageShell({
  staticProps,
  metadata,
  criticalCss,
  cssRefs,
  js,
  children,
}: React.PropsWithChildren<{
  staticProps: Awaited<ReturnType<GetStaticProps>>;
  metadata: Metadata;
  criticalCss: string;
  cssRefs: string[];
  js: string;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{metadata.title}</title>
        <meta
          httpEquiv="Cache-Control"
          content="no-store"
        />
        <link
          href="/favicon.ico"
          rel="icon"
          type="image/x-icon"
        />
        <link
          href="/favicon.png"
          rel="icon"
          type="image/png"
        />
        {metadata.description && (
          <meta
            name="description"
            content={metadata.description}
          />
        )}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: criticalCss,
          }}
        ></style>
      </head>
      <body>
        <div id="root">{children}</div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__INITIAL_PROPS__ = ${JSON.stringify(
              staticProps.props,
            )}`,
          }}
        />
        {cssRefs.map((ref) => (
          <link
            key={ref}
            rel="stylesheet"
            href={ref}
          />
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: js.replace(/<\/script>/g, '</scr"+"ipt>'),
          }}
        />
      </body>
    </html>
  );
}
