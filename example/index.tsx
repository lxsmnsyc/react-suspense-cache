import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createResource, ResourceCache } from '../src';

const randomDog = createResource(
  (kind) => `https://dog.ceo/api/breed/${kind}/images/random`,
  async (kind) => {
    const response = await fetch(`https://dog.ceo/api/breed/${kind}/images/random`);
    const json = await response.json();
    return json.message;
  },
  {
    storage: ResourceCache.LOCAL_CACHE,
  },
);


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
  const message = randomDog.get(kind);

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
        <button type="button" onClick={() => randomDog.refetch('shiba')}>Refetch Shiba</button>
        <button type="button" onClick={() => randomDog.refetch('samoyed')}>Refetch Samoyed</button>
        <button type="button" onClick={() => randomDog.refetch('husky')}>Refetch Husky</button>
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
