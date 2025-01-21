# Swarf

**Swarf** stands for **Service Worker App Router Framework**.

It is a package that provides an API similar to Next.js's App Router, but
designed for a Service Worker context.

## Philosophy

Swarf is an opinionated framework that requires using TypeScript and TSX.

Under the hood, this package uses
[@express-worker/app](https://github.com/michaelcpuckett/express-worker) to
serve the routes. If this framework is too opinionated for your needs, consider
using @express-worker/app directly. For a more fully-featured Service Worker
framework, look to Google's
[Workbox](https://developer.chrome.com/docs/workbox).

## Features

### App Router

Similar to [Next.js](https://nextjs.org/), routes are defined as a directory
structure under `src/app`.

### React SSR

The initial page HTML is rendered by React-DOM/Server which then gets hydrated
by React-DOM/Client.

### Static File Handling

Static files in the `src/app` directory are cached and served by the service
worker.

## Installation

1. In a new repository, run `npm install swarf --save`

2. Run `npx swarf init` to establish the essential file structure.

You can also use the template for the
[starter kit](https://github.com/michaelcpuckett/swarf-starter).

## Usage

The folders inside `src/app` are used to define the routes. Folders can be
nested. The `page.tsx` file inside each folder is the component that renders the
body of the page.

Note: Unlike Next.js, there is no `layout.tsx` file.

To add a new route:

1. Create a new folder in the `src/app` directory and create a `page.tsx` file
   inside it.

   Dynamic routes are defined by using square brackets in the folder name. For
   example, if you want to create a dynamic route for user profiles, you can
   create a folder with a path of `src/app/profiles/[id]`.

2. Define the React component for the page as the `default` export.

3. Define and export `getStaticProps` and `metadata`. (See below.)

4. Run `swarf build` to regenerate the routes.

### Static Props

`getStaticProps` is an asynchronous function used to fetch data at render time.
It allows you to call an API or query a database and pass the results as props
to the page component. The path params are passed to this function. You can
define `getStaticProps` as follows:

```ts
export const getStaticProps: swarf.GetStaticProps = async function ({
  params: { id },
}) {
  const apiData = await fetch(`https://myapi.example/data/${id}`).then((res) =>
    res.json(),
  );

  return {
    props: {
      apiData,
    },
  };
};
```

If the data is unlikely to change, you can use this function to handle caching
using the browser's `caches` API:

```ts
export const getStaticProps: swarf.GetStaticProps = async function ({
  params: { id },
}) {
  const todosCache = await caches.open('todos-page-props');
  const cachedTodo = await todosCache.match(id);

  // Check the cache first.

  if (cachedTodo) {
    return await cachedTodo.json();
  }

  const todo = await fetchTodo({ id });

  // Save to cache.

  todosCache.put(id, new Response(JSON.stringify(todo)));

  return {
    props: {
      todo,
    },
  };
};
```

Using a similar strategy, images and other resources can be precached at this
stage:

```ts
export const getStaticProps: swarf.GetStaticProps = async function ({
  params: { id },
}) {
  const userComment = await fetchUserComment({ id });
  const userAvatarUrl = userComment.avatarUrl;

  const userAvatarsCache = await caches.open('user-avatars');
  const cachedUserAvatar = await userAvatarsCache.match(userAvatarUrl);

  if (!cachedUserAvatar) {
    const userAvatarFileContents = await fetch(userAvatarUrl).then((res) =>
      res.blob(),
    );

    // The image will be available immediately on page load.
    userAvatarsCache.put(userAvatarUrl, new Response(userAvatarFileContents));
  }

  return {
    props: {
      userComment,
    },
  };
};
```

### Metadata

`metadata` is an object that contains information about the page, such as the
title and description. You can define `metadata` as follows:

```ts
export const metadata: swarf.Metadata = {
  title: 'Page Title',
  description: 'Page description',
};
```

If you need to access the route params, you can export a function instead:

```ts
export const metadata: swarf.GetMetadata = ({ params: { id } }) => ({
  title: 'Note ' + id,
});
```

### Page Component

The `default` export should be the Page component. It will receive the props
defined in `getStaticProps`. It will be wrapped in the `PageShell`.

```tsx
export default function HomePage({ data }: { data: Data }) {
  return <main>{data.foo}</main>;
}
```

## Development

Run `swarf dev` during development.

For easiest debugging, in the Web Inspector, under the Application tab, under
Service Workers, select the checkbox for "Update on reload".

## Production Builds

Run `swarf build` to generate a production build/

The built-in strategy for invalidating the old cache and serving the updated
content is through incrementing the version in `router.config.json`.

Publish the `public` directory to a static file hosting service. A 404.html file
should be served as a catch-all route.

## Benefits

### Fast Page Rendering

Routes can pre-cache or inline key assets.

### Simplified Hosting

The server only needs to be able to serve the initial static assets. This
project uses Firebase Static Hosting.

### Offline-Ready

When a user navigates to a route while offline, the service worker can serve a
previously cached response or generate a new one based on stored data.

## Drawbacks

### No Search Engine Indexing

Pages generated by a service worker aren't indexed by search engines. You may
need alternative strategies for SEO, such as generating static HTML snapshots or
using a separate build process to create server-rendered pages.

## License

This project is licensed under the MIT License.
