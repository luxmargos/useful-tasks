#!/usr/bin/env node
import je from"path";import{Command as Te}from"commander";import be from"path";var ve="useful_tasks.json",X=!0,G="restore",I="keep",ke=[G,I],we="info",Ce="debug",Se="none",$=[Se,we,Ce],_e={cwdMode:`Choose between ${ke.map(s=>`'${s}'`).join(" or ")}. If you use 'cwd' property in a specific task, consider using this parameter. This parameter determines the behavior of the current working directory (CWD) when each task ends. In '${G}' mode, the CWD will be restored to its original state (or the one specified at --cwd) when each task ends, while in '${I}' mode, the CWD will remain unchanged.`},E=s=>{let e=new Te;e.name("useful-tasks").version("0.1.29").option("--cwd <string>","Change working directory").option("-c, --config <string>","A path of json configuraion",ve).option("-i, --include <items>","Include tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-a, --include-cta <items>","Include tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-e, --exclude <items>","Exclude tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-x, --exclude-cta <items>","Exclude tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("--camel-keys <boolean>",'Specify whether to use camel case for the key of the variable. If the value is true, the paramter "--var-my-key" will be converted to "myKey" otherwise it will be "my-key"',X).option("--cwd-mode <string>",_e.cwdMode,G).option("--log-level <string>",`Specify the logging level as ${$.join(",")}. This parameter takes higher priority than the 'json' configuration.`).allowUnknownOption(!0),s!==void 0?e.parse(s,{from:"user"}):e.parse();let t=e.opts();if(t.include=_(t.include),t.includeCta=_(t.includeCta),t.exclude=_(t.exclude),t.excludeCta=_(t.excludeCta),t.cwdModeIsContinue=t.cwdMode===I,t.camelKeys!==void 0&&typeof t.camelKeys=="string"){let r=t.camelKeys;r=r.trim().toLowerCase(),r==="false"||r==="0"||r==="no"?t.camelKeys=!1:r==="true"||r==="1"||r==="yes"?t.camelKeys=!0:t.camelKeys=X}return t.extraArgs=[...e.args??[]],t.cwd&&process.chdir(be.resolve(t.cwd)),{opt:t,program:e}},_=(s,e=!0)=>{if(!s)return[];if(typeof s=="string"){let n=[];return s.split(",").forEach(r=>{let i=r.trim();e?i.length>0&&n.push(i):n.push(i)}),n}return[]};import W from"path";import H from"fs";import q from"path";import $e from"json5";var D=s=>{if(!H.existsSync(s))throw new Error(`ERROR: The Path '${s}' does not exists!`);let e=H.readFileSync(s,{encoding:"utf-8"});return $e.parse(e)},V=s=>{let e=D(s);if(e.extends){let n=q.dirname(s),t=q.resolve(n,e.extends);e=Object.assign({},e,V(t))}return e},P=(s,e)=>{if(!e)return s;let n="",t=s.split("-");for(let r=0;r<t.length;r++){let i=t[r];r===0?n=i:(i.length>0&&(i=`${i[0].toUpperCase()}${i.substring(1)}`),n=`${n}${i}`)}return n},M=(s,e)=>{if(s.length<1)return!1;for(let n of s)for(let t of e)if(n===t)return!0;return!1},j=(s,e)=>{if(s.length<1)return!1;for(let n of s){let t=!1;for(let r of e)if(r===n){t=!0;break}if(!t)return!1}return!0};import Me from"debug";var Y="useful-tasks",R=`${Y}:debug`,w=`${Y}:info`,z="\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}",Z="--var-",Q="--env-";import ee from"debug";var f=ee(R),T=ee(w);var te=async(s,e)=>{let n=e;for(let t of Object.keys(n))if(typeof t=="string"&&!(t==="id"||t==="tags")&&n[t]!==void 0&&typeof n[t]=="string"){let r=n[t];for(;;){let i=s.replaceRegex.exec(r);if(i==null)break;let c=i[0],l=i[1],p=s.vars;if(l.length>0){let a=l.split(".");for(let h=0;h<a.length;h++){let k=a[h];if(p.hasOwnProperty(k))p=p[k];else throw new Error(`The value of ${l} could not be found!`)}}let u=r.substring(0,i.index),b=`${p}`,S=r.substring(i.index+c.length);r=`${u}${b}${S}`,f(`Variable injection: '${t}'=>'${r}'`)}n[t]=r}},K=(s,e,n,t)=>{let r,i=!1;for(let c of s){if(c.trim()==="--"){f("Stop parsing by '--'");break}if(i&&r){let p=c.startsWith("-")?"":c;t(r,p),r=void 0,i=!1}else if(c.indexOf(e)>=0){let u=c.indexOf("=");if(u>=0){let b=P(c.substring(e.length,u),n),S=c.substring(u+1);t(b,S)}else r=P(c.substring(e.length),n),i=!0}}},F=(s,e,n,t)=>{if(t&&s.vars[e]!==void 0){f(`Skips assigning the variable ${e}=${n} because it already exists.`);return}f(`Sets the variable ${e}=${n}`),s.vars[e]=n},A=(s,e,n,t)=>{var r=typeof n;if(r!=="string"&&r!=="number"&&r!=="boolean")f(`Ignoring the invalid typed(${r}) environment variable ${e}=${n}`);else if(String(n).length<1)f(`Ignoring the invalid environment variable ${e}=${n}`);else{if(t&&process.env[e]!==void 0){f(`Skips assigning the environment variable ${e}=${n} because it already exists.`);return}f(`Sets the environment variable ${e}=${n}`),process.env[e]=String(n)}};import Ee from"string-argv";var ne=async(s,e)=>{if(!e.args||typeof e.args!="string")throw new Error("Found missing or invalid property 'args' that is required");let n=Ee(e.args),t=E(n);C(s.originCwd,t.opt,t.program)};import d from"fs";import{execSync as Fe}from"child_process";import x from"path";import{CheckRepoActions as Ae,ResetMode as Le,simpleGit as re}from"simple-git";import{copySync as Oe,mkdirpSync as Ge,removeSync as ae}from"fs-extra";import Ie from"json5";import Re from"fs";import{globSync as L}from"glob";var O=(s,e,n,t,r,i)=>{if(Re.statSync(e).isDirectory()===!1)return!1;let c=r===!0,l=n.length>0,p=t.length>0;return!l&&p?(s(L("**",{ignore:[".",...t],cwd:e,nodir:c})),!0):l&&!p?(s(L(n,{cwd:e,nodir:c})),!0):l&&p?(s(L(n,{ignore:t,cwd:e,nodir:c})),!0):i?(s(L("**",{ignore:["."],cwd:e,nodir:c})),!0):!1};var N=(s,e)=>{throw new Error(`The parameter '${String(e)}' has an invalid value ${s[e]}`)},le=async(s,e)=>{let n=x.resolve(e.localPath);d.existsSync(n)||d.mkdirSync(n,{recursive:!0}),d.readdirSync(n).length===0&&e.url&&await re().clone(e.url,n);let t=re(n,{binary:e.binary});if(!await t.checkIsRepo(Ae.IS_REPO_ROOT))throw Error(`${n} is not a git repository!!!`);if(e.updateSubmodules&&(await t.submoduleInit(),await t.submoduleUpdate()),await t.fetch(),e.branch){let c=!1,l=await t.branchLocal();for(var i of l.all)if(i===e.branch){c=!0;break}let p=e.branch??"",u=e.startPoint??"";c?(l.current!==e.branch&&await t.checkout(p),await t.reset(Le.HARD,[u])):await t.checkoutBranch(p,u)}},ce=async(s,e)=>{let n=x.resolve(e.target),t=x.resolve(e.path);if(d.existsSync(t)){let r=d.lstatSync(t);f(`LSTAT is symlink? ${r.isSymbolicLink()}, is directory? ${r.isDirectory()}`),e.forced&&(r.isSymbolicLink()||r.isFile()?(f(`Unlink ${t}`),d.unlinkSync(t)):r.isDirectory()&&(f(`Remove directory '${t}'`),ae(t)))}if(d.existsSync(t))f(`Could not create symbolic link cause '${t}' already exists`);else{f(`Create symbolic link ${n} => ${t}`),d.symlinkSync(n,t,e.linkType);let r=d.lstatSync(t);f(`LSTAT is symlink? ${r.isSymbolicLink()}, is directory? ${r.isDirectory()}`)}},pe=async(s,e)=>{f(`Start execution... ${e.cmd}`),Fe(e.cmd,{shell:e.shell,env:process.env,stdio:[process.stdin,process.stdout,process.stderr],encoding:"utf-8"})},fe=async(s,e)=>{if(e.key===void 0||!e.key||typeof e.key!="string"||e.key.length<1)throw new Error(`Invalid key ${e.key}. It must be a string.`);let n=e.value;if(n==null&&e.var&&(n=e.var),e.isFallback!==!0&&(e.isFallback=!1),e.varType==="file"){if(typeof n!="string")throw new Error(`The "value" must contain path of a file with "varType":"${e.varType}"`);let t=x.resolve(n);if(!d.existsSync(t))throw new Error(`File "${t}" does not exist to use as a variable`);n=d.readFileSync(t,{encoding:"utf8"}),e.fileFormat==="json"&&(n=Ie.parse(n))}F(s,e.key,n,e.isFallback)},de=async(s,e)=>{let n=e.value;n==null&&e.var&&(n=e.var),e.isFallback!==!0&&(e.isFallback=!1);let t=e.isFallback;if(e.varType==="file"){if(typeof n!="string")throw new Error(`The "value" must contain path of a file with "varType":"${e.varType}"`);let r=x.resolve(n);n=D(r)}if(typeof n!="object")throw new Error('The content of the "value" must be in the form of key-value pairs. For example: {"KEY_A":"value_a", "KEY_B":"value_b"}');Object.keys(n).forEach(r=>{A(s,r,n[r],t)})},ge=async(s,e)=>{let n=e.text??"",t=(e.target??"c").trim(),r=e.path;if(t==="c"||t==="console")console.log(n);else{if(!r)throw new Error(`The parameter 'path' is required for a target '${t}'!`);let i=x.resolve(r),c=x.dirname(i);if(d.existsSync(c)||Ge(c),t=="fa"||t=="file-append"){let l,p;try{p=d.openSync(i,"a"),d.appendFileSync(p,n,"utf8")}catch(u){l=u}finally{p!==void 0&&d.closeSync(p)}if(l)throw l}else d.writeFileSync(i,n)}},v=(s,e)=>{if(s!=null){if(typeof s=="string")return[s];if(Array.isArray(s))return s.filter(n=>typeof n=="string")}return[]},se=(s,e,n)=>{f(`Copy: ${s} => ${e}`),Oe(s,e,n)},ue=async(s,e)=>{if(!d.existsSync(e.src))throw new Error(`The source '${e.src}' does not exist`);let n=e?.options?.conflict,t=n==null||typeof n=="string"&&n.trim()==="overwrite";e.options&&"overwrite"in e?.options&&typeof e?.options?.overwrite=="boolean"&&(t=e.options.overwrite);let r={overwrite:t};O(l=>{for(let p of l){let u=x.join(e.src,p),b=x.join(e.dest,p);se(u,b,r)}},e.src,v(e.include,[]),v(e.exclude,[]),!1,!1)||se(e.src,e.dest,r)},oe=s=>{f(`Delete: ${s}`),ae(s)},me=async(s,e)=>{if(!d.existsSync(e.path)){f(`The '${e.path}' does not exist and cannot be deleted`);return}O(r=>{for(let i of r)oe(x.join(e.path,i))},e.path,v(e.include,[]),v(e.exclude,[]),!1,!1)||oe(e.path)},De=(s,e,n,t)=>{var r=s;if(t<1)for(;e.test(r);)r=r.replace(e,n);else for(var i=0;i<t;i++)e.test(r)&&(r=r.replace(e,n));return r},Ve=(s,e,n,t)=>{var r=s;if(t<1)for(;r.indexOf(e)>=0;)r=r.replace(e,n);else for(var i=0;i<t;i++)r.indexOf(e)>=0&&(r=r.replace(e,n));return r},Pe=s=>s!=null&&typeof s=="object"&&"pattern"in s&&typeof s.pattern=="string",ie=(s,e,n,t,r)=>{f(`Find and Replace: ${s}`);let i=d.readFileSync(s,"utf-8"),c=e(i,n,t,r);d.writeFileSync(s,c,"utf-8")},ye=async(s,e)=>{if(!d.existsSync(e.path)){f(`The '${e.path}' does not exist`);return}(e.replace===void 0||typeof e.replace!="string")&&N(e,"replace");let n=e.loop===void 0||e.loop===null?1:e.loop;typeof n=="string"?n=parseInt(n,10):typeof n!="number"&&N(e,"loop");let t,r;if(Pe(e.find)){let l=e.find;t=new RegExp(l.pattern,l.flags),r=De}else if(typeof e.find=="string")t=e.find,r=Ve;else{N(e,"find");return}O(l=>{for(let p of l){let u=x.join(e.path,p);d.statSync(u).isDirectory()||ie(x.join(e.path,p),r,t,e.replace,n)}},e.path,v(e.include,[]),v(e.exclude,[]),!0,!0)||ie(e.path,r,t,e.replace,n)};var U={"git-repo-prepare":le,symlink:ce,cmd:pe,"set-var":fe,output:ge,"fs-copy":ue,"fs-del":me,"env-var":de,"sub-tasks":ne,"content-replace":ye};var C=(s,e,n)=>{let t={},r=W.resolve(e.config);try{t=V(r)}catch(a){a instanceof Error?console.log(a.message):console.log(a),console.log(""),n.help()}let i,c="info",l=z;if(t.env&&typeof t.env=="object"){let a=t.env;(a.verbose||a.verboseGit)&&(c="debug"),a.logLevel&&$.includes(a.logLevel)&&(c=a.logLevel),a.replaceRegex&&(l=a.replaceRegex)}if(e.logLevel&&$.includes(e.logLevel)&&(c=e.logLevel),c==="debug"?(i=`${w},${R}`,i=`${i},simple-git,simple-git:*`):c==="info"&&(i=`${w}`),i&&Me.enable(i),f("CLI Options",e),typeof l!="string")throw new Error(`replaceRegex '${l}'  must be a string`);if(l.length<1)throw new Error(`replaceRegex '${l}' cannot be empty`);if(l.indexOf("(")<0||l.indexOf(")")<0)throw new Error(`replaceRegex '${l}' must contain regex group express '(' and ')'`);let p=W.resolve(process.cwd()),u={originCwd:s,baseCwd:p,replaceRegex:new RegExp(l),vars:{__env:{cwd_startup:s,cwd_base:p}}};e.extraArgs&&(f("Setting up the variables from the additional arguments"),K(e.extraArgs,Z,e.camelKeys,(a,h)=>{F(u,a,h,!1)}),f("Setting up the environment variables from the additional arguments"),K(e.extraArgs,Q,e.camelKeys,(a,h)=>{A(u,a,h,!1)})),T(""),T(`[${t.name}] Start task processing`);let b=(a,h)=>h!=null?a.id!==void 0?`[${h}]${a.id}/${a.type}`:`[${h}]${a.type}`:a.id!==void 0?`${a.id}/${a.type}`:`${a.type}`;(async()=>{let a=t.tasks??[];for(let g=0;g<a.length;g++){let o=a[g];if(o.id!==void 0&&o.id!==null){if(typeof o.id!="string")throw new Error("The task id must be a 'string' type");if(o.id.length<1)throw new Error("The task id cannot be empty");for(let y=g+1;y<a.length;y++){let m=a[y];if(m.id!==void 0&&m.id===o.id)throw new Error(`The task id '${o.id}' must be unique`)}}if(!o.type||!(o.type in U))throw new Error(`Found the invalid task type '${o.type}'`);if(o.__compare__elements=[],o.id&&(o.id=o.id.trim(),o.__compare__elements.push(o.id.trim())),o.tags){let y=m=>{f(`Ignoring invalid tags '${m}'`)};if(typeof o.tags=="string")o.tags.length>0?(o.tags=o.tags.trim(),o.__compare__elements.push(o.tags)):y(o.tags);else if(Array.isArray(o.tags)){o.tags=o.tags.map(m=>m.trim());for(let m of o.tags)typeof m=="string"&&m.length>0?o.__compare__elements.push(m):y(m)}else y(o.tags)}}if(e.exclude&&e.exclude.length>0){let g=e.exclude;f(`Excluding tasks by specified IDs or Tags : --exclude=${g}`),a=a.filter((o,y,m)=>{if(M(g,o.__compare__elements)===!1)return o})}if(e.excludeCta&&e.excludeCta.length>0){let g=e.excludeCta;f(`Excluding tasks by specified IDs or Tags : --exclude-cta=${g}`),a=a.filter((o,y,m)=>{if(j(g,o.__compare__elements)===!1)return o})}let h=e.include&&e.include.length>0,k=e.includeCta&&e.includeCta.length>0;if(h||k){let g=e.include,o=e.includeCta;f(`Including tasks by specified IDs or Tags : --include=${g} / --include-cta=${o}`),a=a.filter((y,m,B)=>{if(h&&M(g,y.__compare__elements)===!0||k&&j(o,y.__compare__elements)===!0)return y})}T(`Tasks : ${a.map((g,o)=>b(g,o))}`);let xe=a.length??0;for(let g=0;g<xe;g++){let o=a[g];te(u,o);let y=b(o,g);if(o.enabled===!1){T(`
### Skip the task without execution => ${y}`);continue}else T(`
### Task : ${y}`);o.comment&&T(o.comment);let m=!1;if(o.cwd){let J=W.resolve(o.cwd);T(`Changing the current working directory => ${J}`),m=!0,process.chdir(J)}let B=U[o.type];await B(u,o),e.cwdModeIsContinue||(m&&T(`Restoring the current working directory => ${p}`),process.chdir(p))}})().then(()=>{}).catch(a=>{throw a}).finally(()=>{process.chdir(p),T(`[${t.name}] Tasks done
`)})};var Ke=je.resolve(process.cwd()),he=E();C(Ke,he.opt,he.program);export{C as usefulTasks};
//# sourceMappingURL=index.mjs.map