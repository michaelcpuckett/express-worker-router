import { PageShell } from './PageShell';

export async function getStaticProps() {
  return {
    props: {},
  };
}

export default function NotFoundPage() {
  return (
    <PageShell
      staticProps={{}}
      metadata={{
        title: 'Not Found',
      }}
      cssRefs={['/globals.css']}
      js=""
    >
      <header>
        <h1>Not Found</h1>
      </header>
      <main>
        <p>Page not found</p>
      </main>
    </PageShell>
  );
}
