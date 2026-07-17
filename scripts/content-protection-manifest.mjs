import {createHash,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {basename,resolve} from 'node:path';

const args=process.argv.slice(2);
const file=args[0];
const value=(flag,fallback=null)=>{const i=args.indexOf(flag);return i>=0&&args[i+1]?args[i+1]:fallback};
if(!file){console.error('Usage: npm run protect:manifest -- <file> --title "Title" --type lesson --owner "Success 4 Sure"');process.exit(1)}
const path=resolve(file);
const bytes=await readFile(path);
const sha256=createHash('sha256').update(bytes).digest('hex');
const manifest={
  schemaVersion:'1.0',assetId:value('--asset-id',`s4s-${randomUUID()}`),title:value('--title',basename(path)),assetType:value('--type','other'),owner:value('--owner','Success 4 Sure'),sha256,sourceAssetId:value('--source-id'),
  rights:{basis:value('--rights','owned'),licenseReference:value('--license'),territories:['GLOBAL'],allowedUses:['view']},
  protection:{profile:value('--profile','protected'),downloadAllowed:false,dynamicWatermark:true,auditRequired:true,expiresAt:null,maxDevices:2},
  review:{teacherApprovedBy:null,academicApprovedBy:null,approvedAt:null},createdAt:new Date().toISOString()
};
const output=`${path}.manifest.json`;
await writeFile(output,JSON.stringify(manifest,null,2),{mode:0o600});
console.log(JSON.stringify({status:'created',manifest:output,assetId:manifest.assetId,sha256}));
