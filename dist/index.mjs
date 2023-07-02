#!/usr/bin/env node
import de from"path";import{program as b}from"commander";import se from"path";var ne="useful_tasks.json",P=!0,D=()=>{b.name("useful-tasks").version("0.1.18").option("--cwd <string>","Change working directory").option("-c, --config <string>","A path of json configuraion",ne).option("-i, --include <items>","Include tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-a, --include-cta <items>","Include tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-e, --exclude <items>","Exclude tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-x, --exclude-cta <items>","Exclude tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("--camel-keys <boolean>",'Specify whether to use camel case for the key of the variable. If the value is true, the paramter "--var-my-key" will be converted to "myKey" otherwise it will be "my-key"',P).allowUnknownOption(!0),b.parse();let e=b.opts();if(e.include=w(e.include),e.includeCta=w(e.includeCta),e.exclude=w(e.exclude),e.excludeCta=w(e.excludeCta),e.camelKeys!==void 0&&typeof e.camelKeys=="string"){let t=e.camelKeys;t=t.trim().toLowerCase(),t==="false"||t==="0"||t==="no"?e.camelKeys=!1:t==="true"||t==="1"||t==="yes"?e.camelKeys=!0:e.camelKeys=P}return e.extraArgs=[...b.args??[]],e.cwd&&process.chdir(se.resolve(e.cwd)),console.log("######################################################################"),{typedOptions:e,program:b}},w=(r,e=!0)=>{if(!r)return[];if(typeof r=="string"){let t=[];return r.split(",").forEach(o=>{let i=o.trim();e?i.length>0&&t.push(i):t.push(i)}),t}return[]};import V from"path";import G from"fs";import L from"path";import re from"json5";var C=r=>{if(!G.existsSync(r))throw new Error(`ERROR: The Path '${r}' does not exists!`);let e=G.readFileSync(r,{encoding:"utf-8"});return re.parse(e)},S=r=>{let e=C(r);if(e.extends){let t=L.dirname(r),s=L.resolve(t,e.extends);e=Object.assign({},e,S(s))}return e},E=(r,e)=>{if(!e)return r;let t="",s=r.split("-");for(let o=0;o<s.length;o++){let i=s[o];o===0?t=i:(i.length>0&&(i=`${i[0].toUpperCase()}${i.substring(1)}`),t=`${t}${i}`)}return t},$=(r,e)=>{if(r.length<1)return!1;for(let t of r)for(let s of e)if(t===s)return!0;return!1},R=(r,e)=>{if(r.length<1)return!1;for(let t of r){let s=!1;for(let o of e)if(o===t){s=!0;break}if(!s)return!1}return!0};import Q from"debug";var k="useful-tasks",K="\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}",U="--var-",j="--env-";import m from"fs";import{execSync as ae}from"child_process";import x from"path";import{CheckRepoActions as oe,ResetMode as ie,simpleGit as N}from"simple-git";import{copySync as le,mkdirpSync as ce}from"fs-extra";import{removeSync as M}from"fs-extra";import pe from"debug";import fe from"json5";var h=pe(k),X=async(r,e)=>{let t=x.resolve(e.localPath);m.existsSync(t)||m.mkdirSync(t,{recursive:!0}),m.readdirSync(t).length===0&&e.url&&await N().clone(e.url,t);let s=N(t,{binary:e.binary});if(!await s.checkIsRepo(oe.IS_REPO_ROOT))throw Error(`${t} is not a git repository!!!`);if(e.updateSubmodules&&(await s.submoduleInit(),await s.submoduleUpdate()),await s.fetch(),e.branch){let l=!1,c=await s.branchLocal();for(var i of c.all)if(i===e.branch){l=!0;break}let d=e.branch??"",p=e.startPoint??"";l?(c.current!==e.branch&&await s.checkout(d),await s.reset(ie.HARD,[p])):await s.checkoutBranch(d,p)}},J=async(r,e)=>{let t=x.resolve(e.target),s=x.resolve(e.path);if(m.existsSync(s)){let o=m.lstatSync(s);h(`LSTAT is symlink? ${o.isSymbolicLink()}, is directory? ${o.isDirectory()}`),e.forced&&(o.isSymbolicLink()||o.isFile()?(h(`Unlink ${s}`),m.unlinkSync(s)):o.isDirectory()&&(h(`Remove directory '${s}'`),M(s)))}if(m.existsSync(s))h(`Could not create symbolic link cause '${s}' already exists`);else{h(`Create symbolic link ${t} => ${s}`),m.symlinkSync(t,s,e.linkType);let o=m.lstatSync(s);h(`LSTAT is symlink? ${o.isSymbolicLink()}, is directory? ${o.isDirectory()}`)}},H=async(r,e)=>{h(`Start execution... ${e.cmd}`),ae(e.cmd,{shell:e.shell,env:process.env,stdio:[process.stdin,process.stdout,process.stderr],encoding:"utf-8"})},F=(r,e,t)=>{h(`Sets the variable ${e}=${t}`),r.vars[e]=t},q=async(r,e)=>{if(e.key===void 0||!e.key||typeof e.key!="string"||e.key.length<1)throw new Error(`Invalid key ${e.key}. It must be a string.`);let t=e.var;if(e.varType==="file"){if(typeof t!="string")throw new Error(`The "var" must contain path of a file with "varType":"${e.varType}"`);let s=x.resolve(t);if(!m.existsSync(s))throw new Error(`File "${s}" does not exist to use as a variable`);t=m.readFileSync(s,{encoding:"utf8"}),e.fileFormat==="json"&&(t=fe.parse(t))}F(r,e.key,t)},A=(r,e,t)=>{var s=typeof t;s!=="string"&&s!=="number"&&s!=="boolean"?h(`Ignoring the invalid typed(${s}) environment variable ${e}=${t}`):String(t).length<1?h(`Ignoring the invalid environment variable ${e}=${t}`):(h(`Sets the environment variable ${e}=${t}`),process.env[e]=String(t))},B=async(r,e)=>{let t=e.var;if(e.varType==="file"){if(typeof t!="string")throw new Error(`The "var" must contain path of a file with "varType":"${e.varType}"`);let s=x.resolve(t);t=C(s)}if(typeof t!="object")throw new Error('The content of the "var" must be in the form of key-value pairs. For example: {"KEY_A":"value_a", "KEY_B":"value_b"}');Object.keys(t).forEach(s=>{A(r,s,t[s])})},Y=async(r,e)=>{let t=e.text??"",s=(e.target??"c").trim(),o=e.path;if(s==="c"||s==="console")console.log(t);else{if(!o)throw new Error(`The parameter 'path' is required for a target '${s}'!`);let i=x.resolve(o),l=x.dirname(i);if(m.existsSync(l)||ce(l),s=="fa"||s=="file-append"){let c,d;try{d=m.openSync(i,"a"),m.appendFileSync(d,t,"utf8")}catch(p){c=p}finally{d!==void 0&&m.closeSync(d)}if(c)throw c}else m.writeFileSync(i,t)}},z=async(r,e)=>{le(e.src,e.dest,e.options)},W=async(r,e)=>{M(e.path)},Z=async(r,e)=>{let t=e;Object.keys(t).forEach(s=>{if(t[s]!==void 0&&typeof t[s]=="string"){let o=t[s];for(;;){let i=r.replaceRegex.exec(o);if(i==null)break;let l=i[0],c=i[1],d=r.vars;if(c.length>0){let a=c.split(".");for(let y=0;y<a.length;y++){let v=a[y];if(d.hasOwnProperty(v))d=d[v];else throw new Error(`The value of ${c} could not be found!`)}}let p=o.substring(0,i.index),T=`${d}`,_=o.substring(i.index+l.length);o=`${p}${T}${_}`,h(`Updated value ${o}`)}t[s]=o}})},O=(r,e,t,s)=>{let o,i=!1;for(let l of r){if(l.trim()==="--"){h("Stop parsing by '--'");break}if(i&&o){let d=l.startsWith("-")?"":l;s(o,d),o=void 0,i=!1}else if(l.indexOf(e)>=0){let p=l.indexOf("=");if(p>=0){let T=E(l.substring(e.length,p),t),_=l.substring(p+1);s(T,_)}else o=E(l.substring(e.length),t),i=!0}}};var I=(r,e,t)=>{let s={},o=V.resolve(e.config);try{s=S(o)}catch(a){a instanceof Error?console.log(a.message):console.log(a),console.log(""),t.help()}let i="",l=K;if(s.env&&typeof s.env=="object"){let a=s.env;a.verbose&&(i=`${k}, ${k}:*`),a.verboseGit&&(i=`${i},simple-git,simple-git:*`),a.replaceRegex&&(l=a.replaceRegex)}if(typeof l!="string")throw new Error(`replaceRegex '${l}'  must be a string`);if(l.length<1)throw new Error(`replaceRegex '${l}' cannot be empty`);if(l.indexOf("(")<0||l.indexOf(")")<0)throw new Error(`replaceRegex '${l}' must contain regex group express '(' and ')'`);i&&Q.enable(i);let c=Q(k),d=V.resolve(process.cwd()),p={replaceRegex:new RegExp(l),vars:{__env:{cwd_startup:r,cwd_base:d}}};e.extraArgs&&(c("Setting up the variables from the additional arguments"),O(e.extraArgs,U,e.camelKeys,(a,y)=>{F(p,a,y)}),c("Setting up the environment variables from the additional arguments"),O(e.extraArgs,j,e.camelKeys,(a,y)=>{A(p,a,y)})),console.log("######################################################################"),console.log(`[${s.name}] Start task processing`);let T=(a,y)=>y!=null?a.id!==void 0?`[${y}]${a.id}/${a.type}`:`[${y}]${a.type}`:a.id!==void 0?`${a.id}/${a.type}`:`${a.type}`;(async()=>{let a=s.tasks??[];for(let f=0;f<a.length;f++){let n=a[f];if(n.id!==void 0&&n.id!==null){if(typeof n.id!="string")throw new Error("The task id must be a 'string' type");if(n.id.length<1)throw new Error("The task id cannot be empty");for(let u=f+1;u<a.length;u++){let g=a[u];if(g.id!==void 0&&g.id===n.id)throw new Error(`The task id '${n.id}' must be unique`)}}if(n.__compare__elements=[],n.id&&(n.id=n.id.trim(),n.__compare__elements.push(n.id.trim())),n.tags){let u=g=>{c(`Ignoring invalid tags '${g}'`)};if(typeof n.tags=="string")n.tags.length>0?(n.tags=n.tags.trim(),n.__compare__elements.push(n.tags)):u(n.tags);else if(Array.isArray(n.tags)){n.tags=n.tags.map(g=>g.trim());for(let g of n.tags)typeof g=="string"&&g.length>0?n.__compare__elements.push(g):u(g)}else u(n.tags)}}if(e.exclude&&e.exclude.length>0){let f=e.exclude;c(`Excluding tasks by specified IDs or Tags : --exclude=${f}`),a=a.filter((n,u,g)=>{if($(f,n.__compare__elements)===!1)return n})}if(e.excludeCta&&e.excludeCta.length>0){let f=e.excludeCta;c(`Excluding tasks by specified IDs or Tags : --exclude-cta=${f}`),a=a.filter((n,u,g)=>{if(R(f,n.__compare__elements)===!1)return n})}let y=e.include&&e.include.length>0,v=e.includeCta&&e.includeCta.length>0;if(y||v){let f=e.include,n=e.includeCta;c(`Including tasks by specified IDs or Tags : --include=${f} / --include-cta=${n}`),a=a.filter((u,g,ye)=>{if(y&&$(f,u.__compare__elements)===!0||v&&R(n,u.__compare__elements)===!0)return u})}c(`Tasks : ${a.map((f,n)=>T(f,n))}`);let te=a.length??0;for(let f=0;f<te;f++){let n=a[f];Z(p,n);let u=T(n,f);if(n.enabled===!1){c(`Skip the task without execution => ${u}`);continue}else c(`Task : ${u}`);if(n.comment&&c(n.comment),n.cwd){let g=V.resolve(n.cwd);c(`Changing the current working directory => ${g}`),process.chdir(g)}n.type==="git-repo-prepare"?await X(p,n):n.type==="symlink"?await J(p,n):n.type==="cmd"?await H(p,n):n.type==="set-var"?await q(p,n):n.type==="env-var"?await B(p,n):n.type==="output"?await Y(p,n):n.type==="fs-copy"?await z(p,n):n.type==="fs-del"&&await W(p,n),process.chdir(d)}})().then(()=>{}).catch(a=>{throw a}).finally(()=>{process.chdir(d),console.log(`[${s.name}] Tasks completed`),console.log("######################################################################")})};var ge=de.resolve(process.cwd()),ee=D(),ue=ee.typedOptions,me=ee.program;I(ge,ue,me);export{I as usefulTasks};
//# sourceMappingURL=index.mjs.map