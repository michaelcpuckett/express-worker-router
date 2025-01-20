export type PageComponent = React.ComponentType<any>;

export type Params = Record<string, string>;

export type GetStaticProps = ({
  params,
}: {
  params: Params;
}) => Promise<Record<string, any>>;

export interface Metadata {
  title: string;
  description?: string;
}

export type GetMetadata = ({ params }: { params: Params }) => Promise<Metadata>;

export type PageModule = {
  default: PageComponent;
  getStaticProps: GetStaticProps;
  metadata: Metadata | GetMetadata;
};

declare module '*.module.css';
