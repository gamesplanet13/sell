import {env} from 'cloudflare:workers';
import {eq} from 'drizzle-orm';
import {getDb} from '@/db';
import {photos} from '@/db/schema';
import {auth,isAdmin,json} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await auth(),{id}=await params,p=await getDb().select().from(photos).where(eq(photos.id,id)).get();if(!p||p.userId!==user.userId&&!isAdmin(user))return json({error:'Photo unavailable'},404);const object=await env.BUCKET?.get(p.objectKey);if(!object)return json({error:'Photo unavailable'},404);return new Response(object.body,{headers:{'Content-Type':p.contentType,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}})}catch{return json({error:'Sign in required'},401)}}
