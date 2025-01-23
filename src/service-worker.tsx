declare var self: ServiceWorkerGlobalScope;

import { ExpressWorker } from '@express-worker/app';
import { renderToString } from 'react-dom/server';
import NotFoundPageModule, {
  getStaticProps as getNotFoundPageModuleStaticProps,
} from './components/NotFoundPage';
import { PageShell } from './components/PageShell';
import { PageModule } from './types';

function convertPath(path: string) {
  return path.replace(/\[([^\]]+)\]/g, ':$1');
}

export function useAppRouter({
  routesConfig,
  staticFiles,
  version,
}: {
  routesConfig: Record<string, PageModule>;
  staticFiles: string[];
  version: number;
}) {
  // Populates the cache on install.
  self.addEventListener('install', function handleInstall(event: Event) {
    if (!(event instanceof ExtendableEvent)) {
      return;
    }

    self.skipWaiting();

    event.waitUntil(
      (async () => {
        const urlsToCache = staticFiles.map((url) => {
          return new Request(new URL(url, self.location.origin).href);
        });
        const cache = await caches.open('public');
        await cache.addAll(urlsToCache);
      })(),
    );
  });

  // Immediately takes control of the page on activation.
  self.addEventListener('activate', () => {
    self.clients.claim();
  });

  const app = new ExpressWorker();

  // Serve static files.
  (function useStaticFiles() {
    app.get('*', async (req, res) => {
      const cachedResponse = await Promise.all(
        (await caches.keys()).map(async (cacheName) => {
          return await (await caches.open(cacheName)).match(req.url);
        }),
      ).then((responses) => responses.find((response) => response));

      if (cachedResponse) {
        res.wrap(cachedResponse);
      } else {
        const notFoundPageStaticProps =
          await getNotFoundPageModuleStaticProps();

        const renderResult = renderToString(
          <NotFoundPageModule {...notFoundPageStaticProps.props} />,
        );

        res.status(404).send(renderResult);
      }
    });
  })();

  (function useReactSSR() {
    for (const [path, module] of Object.entries<PageModule>(routesConfig)) {
      const { default: Component, getStaticProps } = module;

      app.get(convertPath(path), async (req, res) => {
        if (navigator.onLine) {
          fetch('/cache.json', {
            cache: 'no-cache',
          })
            .then((response) => response.json())
            .then((cache) => {
              if (cache.version !== version) {
                console.log(
                  'Cache version mismatch. Reinstalling service worker.',
                );

                self.registration.unregister();
              }
            })
            .catch((error) => {
              console.log(error);
            });
        }

        try {
          const staticProps = await getStaticProps({ params: req.params });
          const cache = await caches.open('public');

          const cssUrls = staticFiles.filter((url) => url.endsWith('.css'));
          const jsFile = await cache.match('/window.js');

          if (!jsFile) {
            throw new Error('Cache miss.');
          }

          const jsFileContents = await jsFile.text();

          const metadata =
            typeof module.metadata === 'function'
              ? await module.metadata({ params: req.params })
              : module.metadata;

          const FullPageComponent = (
            <PageShell
              metadata={metadata}
              staticProps={staticProps}
              cssRefs={cssUrls}
              js={jsFileContents}
            >
              <Component {...staticProps.props} />
            </PageShell>
          );

          const renderResult = renderToString(FullPageComponent);

          res.send(renderResult);
        } catch (error) {
          console.log(error);

          const notFoundPageStaticProps =
            await getNotFoundPageModuleStaticProps();

          const renderResult = renderToString(
            <NotFoundPageModule {...notFoundPageStaticProps.props} />,
          );

          res.status(404).send(renderResult);
        }
      });
    }
  })();

  return app;
}
