import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const { App } = await server.ssrLoadModule('/src/main.jsx');
const markup = renderToStaticMarkup(React.createElement(App, { initialLang: 'ar' }));
const css = await readFile('src/styles.css', 'utf8');

const preview = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SUCCESS OS Preview</title>
  <style>${css}</style>
</head>
<body><div id="root">${markup}</div></body>
</html>`;

await writeFile('../success-os-preview.html', preview);
await server.close();
