import {env} from 'cloudflare:workers';
import {getChatGPTUser, type ChatGPTUser} from '@/app/chatgpt-auth';
export const isAdmin=(user:ChatGPTUser|null)=>!!user&&String(env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).includes(user.email.toLowerCase());
export async function auth(){const user=await getChatGPTUser();if(!user)throw new Error('AUTH_REQUIRED');return user;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function mutationGuard(request:Request){const origin=request.headers.get('origin');const host=request.headers.get('host');if(!origin||new URL(origin).host!==host)throw new Error('INVALID_ORIGIN');if(request.headers.get('sec-fetch-site')==='cross-site')throw new Error('INVALID_ORIGIN');}
export async function readJson(request:Request){if(Number(request.headers.get('content-length')||0)>30000)throw new Error('Request is too large.');const text=await request.text();if(text.length>30000)throw new Error('Request is too large.');try{return JSON.parse(text)}catch{throw new Error('Invalid request format.')}}
export const backupReady=()=>!!env.GITHUB_BACKUP_TOKEN&&!!env.GITHUB_BACKUP_REPO;
// Optional owner-configured, private-repository backup. Never exposes credentials to browsers.
export async function backupRecord(id:string,record:unknown){
 if(!backupReady())return {ok:false,reason:'not_configured'};
 const repo=String(env.GITHUB_BACKUP_REPO);if(!/^[\w.-]+\/[\w.-]+$/.test(repo))return {ok:false,reason:'invalid_repository'};
 const headers={'Authorization':'Bearer '+env.GITHUB_BACKUP_TOKEN,'Accept':'application/vnd.github+json','User-Agent':'Games-Planet-Console-Portal','X-GitHub-Api-Version':'2022-11-28'};
 const info=await fetch('https://api.github.com/repos/'+repo,{headers});if(!info.ok)return {ok:false,reason:'repository_unavailable'};const metadata=await info.json() as {private?:boolean};if(metadata.private!==true)return {ok:false,reason:'private_repository_required'};
 // One immutable file per snapshot avoids concurrent updates overwriting one another.
 const path='backups/'+id+'/'+Date.now()+'-'+crypto.randomUUID()+'.json';
 const bytes=new TextEncoder().encode(JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:record}));let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 const result=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Back up console sell record '+id,content:btoa(binary)})});
 return {ok:result.ok,reason:result.ok?'saved':'backup_failed'};
}
