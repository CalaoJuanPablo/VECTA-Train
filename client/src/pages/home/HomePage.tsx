import { useQuery } from '@tanstack/react-query';
import { trpc } from '@vecta/client/utils/trpc';

export const HomePage = () => {
  const { isPending, error, data } = useQuery(trpc.getHello.queryOptions());

  return (
    <div>
      <h1>Welcome to VECTA Train</h1>
      {isPending ? <p>Loading message...</p> : <p>{data}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
};
