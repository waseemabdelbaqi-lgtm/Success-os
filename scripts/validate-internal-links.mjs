import fs from 'node:fs';
import path from 'node:path';

const appRoot=path.resolve('app');
const pages=new Set(['/']);
const source=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(/\.(jsx|js)$/.test(item.name))source.push(file)}}
walk(appRoot);
for(const file of source){if(path.basename(file)==='page.jsx'){const rel=path.relative(appRoot,path.dirname(file)).split(path.sep).join('/');pages.add(rel?`/${rel}`:'/')}}
const broken=[];
for(const file of source){const text=fs.readFileSync(file,'utf8');for(const match of text.matchAll(/href=(?:["'`]([^"'`$#?]+)|\{["'`]([^"'`$#?]+))/g)){const href=match[1]||match[2];if(href?.startsWith('/')&&!href.startsWith('/api')&&!pages.has(href))broken.push(`${path.relative(process.cwd(),file)} → ${href}`)}}
if(broken.length){console.error(`Broken internal links (${broken.length}):\n${broken.join('\n')}`);process.exit(1)}
console.log(`Internal links validated across ${source.length} source files and ${pages.size} routes.`);
