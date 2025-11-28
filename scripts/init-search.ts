import { initSearch } from '../lib/search';

async function main() {
    console.log('Initializing Typesense collections...');
    await initSearch();
    console.log('Done.');
}

main().catch(console.error);
