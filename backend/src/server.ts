import { buildApp } from './app.ts';
import { seedDevData } from './dev-seed.ts';
import { createMemoryStore } from './store.ts';

const port = Number(process.env.PORT ?? 3000);
const store = createMemoryStore();
// `--seed` передаёт только `npm run dev`: данные в памяти, и без них после перезапуска пусто.
if (process.argv.includes('--seed')) seedDevData(store);
const app = buildApp({ store });

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
