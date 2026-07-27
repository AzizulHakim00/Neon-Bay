import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(process.argv[2] || 'dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const match = html.match(/<script id="neon-bay-v18-recovery">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Embedded v1.8 recovery bootstrap was not found');

function storage(initial = {}) { const values = new Map(Object.entries(initial)); return { getItem:key=>values.has(key)?values.get(key):null, setItem:(key,value)=>values.set(key,String(value)), removeItem:key=>values.delete(key), has:key=>values.has(key) }; }
function classList(initial=[]){const values=new Set(initial);return{add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v)}}
function element(){const listeners=new Map();return{textContent:'',classList:classList(),addEventListener:(type,handler)=>listeners.set(type,handler),click:()=>listeners.get('click')?.({preventDefault(){}})}}
const domReady=[];const windowEvents=new Map();
const elements=new Map([['startup-recovery',element()],['startup-recovery-diagnostics',element()],['startup-recovery-status',element()],['recovery-safe',element()],['recovery-retry',element()],['recovery-reset',element()],['loading-screen',{classList:classList(['active'])}],['main-menu',{classList:classList()}]]);
const keys=['neon-bay-save-v6-index','neon-bay-save-v6-slot-1','neon-bay-save-v6-slot-2','neon-bay-save-v6-slot-3','neon-bay-save-v6-backup-1','neon-bay-save-v6-backup-2','neon-bay-save-v6-backup-3','neon-bay-save-v5-index','neon-bay-save-v5-slot-1','neon-bay-save-v5-slot-2','neon-bay-save-v5-slot-3','neon-bay-save-v5-backup-1','neon-bay-save-v5-backup-2','neon-bay-save-v5-backup-3','neon-bay-save-v4','neon-bay-save-v3','neon-bay-save-v2','neon-bay-save-v1'];
const localStorage=storage(Object.fromEntries([['neon-bay-quality','high'],...keys.map(key=>[key,'{}'])]));const sessionStorage=storage();let replacedUrl='';
const location={search:'?safe=1',pathname:'/index.html',href:'https://example.test/index.html?safe=1',replace:value=>{replacedUrl=String(value)}};
const loadingText=element();
const document={getElementById:id=>elements.get(id)||null,querySelector:selector=>selector==='#loading-screen .loading-card p'?loadingText:null,createElement:name=>name==='canvas'?{getContext:type=>type==='webgl2'?{}:null}:element(),addEventListener:(type,handler)=>{if(type==='DOMContentLoaded')domReady.push(handler)}};
const window={addEventListener:(type,handler)=>windowEvents.set(type,handler),setInterval:()=>1,clearInterval(){},setTimeout:handler=>{handler();return 1}};
const context=vm.createContext({window,document,location,navigator:{userAgent:'Neon Bay v1.8 recovery test'},localStorage,sessionStorage,URL,URLSearchParams,Date,Error,JSON,Object,String,setTimeout:window.setTimeout,clearTimeout(){}});
vm.runInContext(match[1],context,{filename:'neon-bay-v18-recovery.js'});for(const handler of domReady)handler();
if(localStorage.getItem('neon-bay-quality')!=='low')throw new Error('Safe query did not force low graphics');
window.__NEON_BAY_STARTUP_RECOVERY__.show('SMOKE_TEST','v1.8 recovery',false);
if(!elements.get('startup-recovery').classList.contains('visible'))throw new Error('Recovery panel did not become visible');
elements.get('recovery-reset').click();for(const key of keys)if(localStorage.has(key))throw new Error(`Reset did not remove ${key}`);
if(!replacedUrl.includes('safe=1')||!replacedUrl.includes('reset=1')||!replacedUrl.includes('retry='))throw new Error(`Reset navigation incomplete: ${replacedUrl}`);
console.log(JSON.stringify({recovery:'ok',saveSchema:'v6',legacyV5Reset:'ok',redirected:replacedUrl},null,2));
