import { copyFile, mkdir, writeFile } from 'node:fs/promises';

await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');

await writeFile('dist/server/index.js', `
export default {
  async fetch(request, env) {
    if (env?.ASSETS?.fetch) {
      const url = new URL(request.url);
      const isPageRoute = url.pathname === '/' || !url.pathname.split('/').pop().includes('.');
      if (isPageRoute) {
        url.pathname = '/index.html';
        return env.ASSETS.fetch(new Request(url, request));
      }
      return env.ASSETS.fetch(request);
    }
    return new Response('SUCCESS OS', {
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }
};
`);
