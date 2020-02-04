import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createResource, strategies, plugins } from '../src';

const randomDog = createResource({
  keyFactory(kind) {
    return `https://dog.ceo/api/breed/${kind}/images/random`;
  },
  async fetcher(kind) {
    const response = await fetch(`https://dog.ceo/api/breed/${kind}/images/random`);
    const json = await response.json();
    return json.message;
  },
  strategy: new strategies.FetcherOnly({
    plugins: [
      new plugins.ExpirationPlugin(10),
    ],
  }),
  revalidateOnVisibility: true,
});


const flexbox: React.CSSProperties = {
  width: '100%',
  height: '50%',
  display: 'flex',
  flexDirection: 'row',
};

const image: React.CSSProperties = {
  width: '25%',
  height: '100%',
  objectFit: 'contain',
};

function Image({ kind }: { kind: string }) {
  const message = randomDog.read(kind);

  console.log(message);

  return <img style={image} src={message} />;
}

function Loading() {
  return <h1>Loading...</h1>;
}

function App() {
  return (
    <>
      <div style={flexbox}>
        <React.Suspense fallback={<Loading />}>
          <Image kind="shiba" />
        </React.Suspense>
        <React.Suspense fallback={<Loading />}>
          <Image kind="samoyed"/>
        </React.Suspense>
        <React.Suspense fallback={<Loading />}>
          <Image kind="husky" />
        </React.Suspense>
      </div>
      <div style={flexbox}>
        <button type="button" onClick={() => randomDog.trigger('shiba')}>Refetch Shiba</button>
        <button type="button" onClick={() => randomDog.trigger('samoyed')}>Refetch Samoyed</button>
        <button type="button" onClick={() => randomDog.trigger('husky')}>Refetch Husky</button>
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
