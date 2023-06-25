"use strict";var de=Object.create;var S=Object.defineProperty;var ge=Object.getOwnPropertyDescriptor;var ue=Object.getOwnPropertyNames;var me=Object.getPrototypeOf,ye=Object.prototype.hasOwnProperty;var he=(n,e)=>{for(var t in e)S(n,t,{get:e[t],enumerable:!0})},M=(n,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of ue(e))!ye.call(n,a)&&a!==t&&S(n,a,{get:()=>e[a],enumerable:!(s=ge(e,a))||s.enumerable});return n};var x=(n,e,t)=>(t=n!=null?de(me(n)):{},M(e||!n||!n.__esModule?S(t,"default",{value:n,enumerable:!0}):t,n)),xe=n=>M(S({},"__esModule",{value:!0}),n);var _e={};he(_e,{usefulTasks:()=>F});module.exports=xe(_e);var ce=x(require("path"));var b=require("commander"),J=x(require("path")),Te="useful_tasks.json",X=!0,H=()=>{b.program.name("useful-tasks").version("0.1.18").option("--cwd <string>","Change working directory").option("-c, --config <string>","A path of json configuraion",Te).option("-i, --include <items>","Include tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-a, --include-cta <items>","Include tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-e, --exclude <items>","Exclude tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-x, --exclude-cta <items>","Exclude tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("--camel-keys <boolean>",'Specify whether to use camel case for the key of the variable. If the value is true, the paramter "--var-my-key" will be converted to "myKey" otherwise it will be "my-key"',X).allowUnknownOption(!0),b.program.parse();let e=b.program.opts();if(e.include=E(e.include),e.includeCta=E(e.includeCta),e.exclude=E(e.exclude),e.excludeCta=E(e.excludeCta),e.camelKeys!==void 0&&typeof e.camelKeys=="string"){let t=e.camelKeys;t=t.trim().toLowerCase(),t==="false"||t==="0"||t==="no"?e.camelKeys=!1:t==="true"||t==="1"||t==="yes"?e.camelKeys=!0:e.camelKeys=X}return e.extraArgs=[...b.program.args??[]],e.cwd&&process.chdir(J.default.resolve(e.cwd)),console.log("######################################################################"),{typedOptions:e,program:b.program}},E=(n,e=!0)=>{if(!n)return[];if(typeof n=="string"){let t=[];return n.split(",").forEach(a=>{let i=a.trim();e?i.length>0&&t.push(i):t.push(i)}),t}return[]};var R=x(require("path"));var A=x(require("fs")),O=x(require("path")),q=x(require("json5")),V=n=>{if(!A.default.existsSync(n))throw new Error(`ERROR: The Path '${n}' does not exists!`);let e=A.default.readFileSync(n,{encoding:"utf-8"});return q.default.parse(e)},I=n=>{let e=V(n);if(e.extends){let t=O.default.dirname(n),s=O.default.resolve(t,e.extends);e=Object.assign({},e,I(s))}return e},P=(n,e)=>{if(!e)return n;let t="",s=n.split("-");for(let a=0;a<s.length;a++){let i=s[a];a===0?t=i:(i.length>0&&(i=`${i[0].toUpperCase()}${i.substring(1)}`),t=`${t}${i}`)}return t},D=(n,e)=>{if(n.length<1)return!1;for(let t of n)for(let s of e)if(t===s)return!0;return!1},G=(n,e)=>{if(n.length<1)return!1;for(let t of n){let s=!1;for(let a of e)if(a===t){s=!0;break}if(!s)return!1}return!0};var N=x(require("debug"));var _="useful-tasks",B="\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}",Y="--var-",z="--env-";var u=x(require("fs")),W=require("child_process"),T=x(require("path")),k=require("simple-git"),$=require("fs-extra"),L=require("fs-extra"),Z=x(require("debug"));var Q=x(require("json5")),h=(0,Z.default)(_),ee=async(n,e)=>{let t=T.default.resolve(e.localPath);u.default.existsSync(t)||u.default.mkdirSync(t,{recursive:!0}),u.default.readdirSync(t).length===0&&e.url&&await(0,k.simpleGit)().clone(e.url,t);let s=(0,k.simpleGit)(t,{binary:e.binary});if(!await s.checkIsRepo(k.CheckRepoActions.IS_REPO_ROOT))throw Error(`${t} is not a git repository!!!`);if(e.updateSubmodules&&(await s.submoduleInit(),await s.submoduleUpdate()),await s.fetch(),e.branch){let l=!1,c=await s.branchLocal();for(var i of c.all)if(i===e.branch){l=!0;break}let d=e.branch??"",p=e.startPoint??"";l?(c.current!==e.branch&&await s.checkout(d),await s.reset(k.ResetMode.HARD,[p])):await s.checkoutBranch(d,p)}},te=async(n,e)=>{let t=T.default.resolve(e.target),s=T.default.resolve(e.path);if(u.default.existsSync(s)){let a=u.default.lstatSync(s);h(`LSTAT is symlink? ${a.isSymbolicLink()}, is directory? ${a.isDirectory()}`),e.forced&&(a.isSymbolicLink()||a.isFile()?(h(`Unlink ${s}`),u.default.unlinkSync(s)):a.isDirectory()&&(h(`Remove directory '${s}'`),(0,L.removeSync)(s)))}if(u.default.existsSync(s))h(`Could not create symbolic link cause '${s}' already exists`);else{h(`Create symbolic link ${t} => ${s}`),u.default.symlinkSync(t,s,e.linkType);let a=u.default.lstatSync(s);h(`LSTAT is symlink? ${a.isSymbolicLink()}, is directory? ${a.isDirectory()}`)}},se=async(n,e)=>{h(`Start execution... ${e.cmd}`),(0,W.execSync)(e.cmd,{shell:e.shell,env:process.env,stdio:[process.stdin,process.stdout,process.stderr],encoding:"utf-8"})},K=(n,e,t)=>{h(`Sets the variable ${e}=${t}`),n.vars[e]=t},re=async(n,e)=>{if(e.key===void 0||!e.key||typeof e.key!="string"||e.key.length<1)throw new Error(`Invalid key ${e.key}. It must be a string.`);let t=e.var;if(e.varType==="file"){if(typeof t!="string")throw new Error(`The "var" must contain path of a file with "varType":"${e.varType}"`);let s=T.default.resolve(t);if(!u.default.existsSync(s))throw new Error(`File "${s}" does not exist to use as a variable`);t=u.default.readFileSync(s,{encoding:"utf8"}),e.fileFormat==="json"&&(t=Q.default.parse(t))}K(n,e.key,t)},U=(n,e,t)=>{var s=typeof t;s!=="string"&&s!=="number"&&s!=="boolean"?h(`Ignoring the invalid typed(${s}) environment variable ${e}=${t}`):String(t).length<1?h(`Ignoring the invalid environment variable ${e}=${t}`):(h(`Sets the environment variable ${e}=${t}`),process.env[e]=String(t))},ne=async(n,e)=>{let t=e.var;if(e.varType==="file"){if(typeof t!="string")throw new Error(`The "var" must contain path of a file with "varType":"${e.varType}"`);let s=T.default.resolve(t);t=V(s)}if(typeof t!="object")throw new Error('The content of the "var" must be in the form of key-value pairs. For example: {"KEY_A":"value_a", "KEY_B":"value_b"}');Object.keys(t).forEach(s=>{U(n,s,t[s])})},ae=async(n,e)=>{let t=e.text??"",s=(e.target??"c").trim(),a=e.path;if(s==="c"||s==="console")console.log(t);else{if(!a)throw new Error(`The parameter 'path' is required for a target '${s}'!`);let i=T.default.resolve(a),l=T.default.dirname(i);if(u.default.existsSync(l)||(0,$.mkdirpSync)(l),s=="fa"||s=="file-append"){let c,d;try{d=u.default.openSync(i,"a"),u.default.appendFileSync(d,t,"utf8")}catch(p){c=p}finally{d!==void 0&&u.default.closeSync(d)}if(c)throw c}else u.default.writeFileSync(i,t)}},oe=async(n,e)=>{(0,$.copySync)(e.src,e.dest)},ie=async(n,e)=>{(0,L.removeSync)(e.path)},le=async(n,e)=>{let t=e;Object.keys(t).forEach(s=>{if(t[s]!==void 0&&typeof t[s]=="string"){let a=t[s];for(;;){let i=n.replaceRegex.exec(a);if(i==null)break;let l=i[0],c=i[1],d=n.vars;if(c.length>0){let o=c.split(".");for(let y=0;y<o.length;y++){let w=o[y];if(d.hasOwnProperty(w))d=d[w];else throw new Error(`The value of ${c} could not be found!`)}}let p=a.substring(0,i.index),v=`${d}`,C=a.substring(i.index+l.length);a=`${p}${v}${C}`,h(`Updated value ${a}`)}t[s]=a}})},j=(n,e,t,s)=>{let a,i=!1;for(let l of n){if(l.trim()==="--"){h("Stop parsing by '--'");break}if(i&&a){let d=l.startsWith("-")?"":l;s(a,d),a=void 0,i=!1}else if(l.indexOf(e)>=0){let p=l.indexOf("=");if(p>=0){let v=P(l.substring(e.length,p),t),C=l.substring(p+1);s(v,C)}else a=P(l.substring(e.length),t),i=!0}}};var F=(n,e,t)=>{let s={},a=R.default.resolve(e.config);try{s=I(a)}catch(o){o instanceof Error?console.log(o.message):console.log(o),console.log(""),t.help()}let i="",l=B;if(s.env&&typeof s.env=="object"){let o=s.env;o.verbose&&(i=`${_}, ${_}:*`),o.verboseGit&&(i=`${i},simple-git,simple-git:*`),o.replaceRegex&&(l=o.replaceRegex)}if(typeof l!="string")throw new Error(`replaceRegex '${l}'  must be a string`);if(l.length<1)throw new Error(`replaceRegex '${l}' cannot be empty`);if(l.indexOf("(")<0||l.indexOf(")")<0)throw new Error(`replaceRegex '${l}' must contain regex group express '(' and ')'`);i&&N.default.enable(i);let c=(0,N.default)(_),d=R.default.resolve(process.cwd()),p={replaceRegex:new RegExp(l),vars:{__env:{cwd_startup:n,cwd_base:d}}};e.extraArgs&&(c("Setting up the variables from the additional arguments"),j(e.extraArgs,Y,e.camelKeys,(o,y)=>{K(p,o,y)}),c("Setting up the environment variables from the additional arguments"),j(e.extraArgs,z,e.camelKeys,(o,y)=>{U(p,o,y)})),console.log("######################################################################"),console.log(`[${s.name}] Start task processing`);let v=(o,y)=>y!=null?o.id!==void 0?`[${y}]${o.id}/${o.type}`:`[${y}]${o.type}`:o.id!==void 0?`${o.id}/${o.type}`:`${o.type}`;(async()=>{let o=s.tasks??[];for(let f=0;f<o.length;f++){let r=o[f];if(r.id!==void 0&&r.id!==null){if(typeof r.id!="string")throw new Error("The task id must be a 'string' type");if(r.id.length<1)throw new Error("The task id cannot be empty");for(let m=f+1;m<o.length;m++){let g=o[m];if(g.id!==void 0&&g.id===r.id)throw new Error(`The task id '${r.id}' must be unique`)}}if(r.__compare__elements=[],r.id&&(r.id=r.id.trim(),r.__compare__elements.push(r.id.trim())),r.tags){let m=g=>{c(`Ignoring invalid tags '${g}'`)};if(typeof r.tags=="string")r.tags.length>0?(r.tags=r.tags.trim(),r.__compare__elements.push(r.tags)):m(r.tags);else if(Array.isArray(r.tags)){r.tags=r.tags.map(g=>g.trim());for(let g of r.tags)typeof g=="string"&&g.length>0?r.__compare__elements.push(g):m(g)}else m(r.tags)}}if(e.exclude&&e.exclude.length>0){let f=e.exclude;c(`Excluding tasks by specified IDs or Tags : --exclude=${f}`),o=o.filter((r,m,g)=>{if(D(f,r.__compare__elements)===!1)return r})}if(e.excludeCta&&e.excludeCta.length>0){let f=e.excludeCta;c(`Excluding tasks by specified IDs or Tags : --exclude-cta=${f}`),o=o.filter((r,m,g)=>{if(G(f,r.__compare__elements)===!1)return r})}let y=e.include&&e.include.length>0,w=e.includeCta&&e.includeCta.length>0;if(y||w){let f=e.include,r=e.includeCta;c(`Including tasks by specified IDs or Tags : --include=${f} / --include-cta=${r}`),o=o.filter((m,g,we)=>{if(y&&D(f,m.__compare__elements)===!0||w&&G(r,m.__compare__elements)===!0)return m})}c(`Tasks : ${o.map((f,r)=>v(f,r))}`);let fe=o.length??0;for(let f=0;f<fe;f++){let r=o[f];le(p,r);let m=v(r,f);if(r.enabled===!1){c(`Skip the task without execution => ${m}`);continue}else c(`Task : ${m}`);if(r.comment&&c(r.comment),r.cwd){let g=R.default.resolve(r.cwd);c(`Changing the current working directory => ${g}`),process.chdir(g)}r.type==="git-repo-prepare"?await ee(p,r):r.type==="symlink"?await te(p,r):r.type==="cmd"?await se(p,r):r.type==="set-var"?await re(p,r):r.type==="env-var"?await ne(p,r):r.type==="output"?await ae(p,r):r.type==="fs-copy"?await oe(p,r):r.type==="fs-del"&&await ie(p,r),process.chdir(d)}})().then(()=>{}).catch(o=>{throw o}).finally(()=>{process.chdir(d),console.log(`[${s.name}] Tasks completed`),console.log("######################################################################")})};var ke=ce.default.resolve(process.cwd()),pe=H(),ve=pe.typedOptions,be=pe.program;F(ke,ve,be);0&&(module.exports={usefulTasks});
//# sourceMappingURL=index.js.map