import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { loadFilesSync } from '@graphql-tools/load-files';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './graphql/resolvers';
import { createContext } from './graphql/context';
import path from 'path';

// Load schema files
const typeDefs = loadFilesSync(path.join(__dirname, 'graphql/schema/**/*.graphql'));

// Create schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create a Yoga instance
const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: '/graphql',
});

// Pass it into a server to hook into request handlers
const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  return yoga(req, res);
});

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.info(`Server is running on http://${HOST}:${PORT}/graphql`);
});
