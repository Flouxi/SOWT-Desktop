import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN;
if(repo!=='Flouxi/SOWT-Desktop'||!token)throw Error('Wrong release scope.');
const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const api='https://api.github.com/repos/'+repo;
async function request(path,method='GET',body){const r=await fetch(api+path,{method,headers:{...headers,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Release request failed (${r.status}).`);return r.json();}
const files=[];
function find(dir){for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())find(p);else if(/^SOWT-0\.0\.29-(mac-(arm64|x64)\.dmg|win-x64\.exe)$/.test(name)){
 const bytes=statSync(p).size,sha256=createHash('sha256').update(readFileSync(p)).digest('hex');
 const checksum=readFileSync(join(dir,'SHA256SUMS.txt'),'utf8');if(!checksum.split(/\r?\n/).includes(sha256+'  '+name))throw Error('Installer digest did not match its build.');
 files.push({name,path:p,sha256,bytes});
}}}
find('release-assets');if(files.length!==3||new Set(files.map(f=>f.name)).size!==3)throw Error('All three distinct installers are required.');
const checksum=files.map(f=>f.sha256+'  '+f.name).join('\n')+'\n';writeFileSync('release-assets/SHA256SUMS.txt',checksum);
const notes=readFileSync('RELEASE.md','utf8')+`\nBuilt from desktop source ${process.env.GITHUB_SHA}; workflow: https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}.\n`;
const releases=await request('/releases');let release=releases.find(r=>r.tag_name==='v0.0.29-preview.1'&&r.draft)||releases.find(r=>r.tag_name==='v0.0.29-preview.1');
if(!release)release=await request('/releases','POST',{tag_name:'v0.0.29-preview.1',name:'SOWT 0.0.29 — Desktop preview',target_commitish:process.env.GITHUB_SHA,body:notes,draft:true,prerelease:true});
for(const f of [...files,{name:'SHA256SUMS.txt',path:'release-assets/SHA256SUMS.txt',bytes:Buffer.byteLength(checksum)}]){
 const old=release.assets.find(a=>a.name===f.name);
 if(old)await fetch(api+'/releases/assets/'+old.id,{method:'DELETE',headers});
 const response=await fetch(release.upload_url.replace(/\{.*$/,'')+'?name='+encodeURIComponent(f.name),{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream','Content-Length':String(f.bytes)},body:readFileSync(f.path),signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw Error('Installer upload failed '+response.status);
 const asset=await response.json();if(asset.size!==f.bytes)throw Error('Published installer size differed.');console.log('Uploaded '+f.name);
}
release=await request('/releases/'+release.id,'PATCH',{draft:false,prerelease:true,target_commitish:process.env.GITHUB_SHA,body:notes});
for(const draft of releases.filter(r=>r.draft&&r.id!==release.id&&r.name==='SOWT 0.0.29 — Desktop preview'&&r.assets.length===0))await fetch(api+'/releases/'+draft.id,{method:'DELETE',headers});
console.log('Published '+release.html_url);
