#!/usr/bin/env node
import Je from"path";import{Command as be}from"commander";import ve from"path";var we="useful_tasks.json",H=!0,I="restore",G="keep",ke=[I,G],Ce="info",Se="debug",_e="none",$=[_e,Ce,Se],$e={cwdMode:`Choose between ${ke.map(r=>`'${r}'`).join(" or ")}. If you use 'cwd' property in a specific task, consider using this parameter. This parameter determines the behavior of the current working directory (CWD) when each task ends. In '${I}' mode, the CWD will be restored to its original state (or the one specified at --cwd) when each task ends, while in '${G}' mode, the CWD will remain unchanged.`},E=r=>{let e=new be;e.name("useful-tasks").version("0.1.29").option("--cwd <string>","Change working directory").option("-c, --config <string>","A path of json configuraion",we).option("-i, --include <items>","Include tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-a, --include-cta <items>","Include tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-e, --exclude <items>","Exclude tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("-x, --exclude-cta <items>","Exclude tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02").option("--camel-keys <boolean>",'Specify whether to use camel case for the key of the variable. If the value is true, the paramter "--var-my-key" will be converted to "myKey" otherwise it will be "my-key"',H).option("--cwd-mode <string>",$e.cwdMode,I).option("--log-level <string>",`Specify the logging level as ${$.join(",")}. This parameter takes higher priority than the 'json' configuration.`).allowUnknownOption(!0),r!==void 0?e.parse(r,{from:"user"}):e.parse();let t=e.opts();if(t.include=_(t.include),t.includeCta=_(t.includeCta),t.exclude=_(t.exclude),t.excludeCta=_(t.excludeCta),t.cwdModeIsContinue=t.cwdMode===G,t.camelKeys!==void 0&&typeof t.camelKeys=="string"){let s=t.camelKeys;s=s.trim().toLowerCase(),s==="false"||s==="0"||s==="no"?t.camelKeys=!1:s==="true"||s==="1"||s==="yes"?t.camelKeys=!0:t.camelKeys=H}return t.extraArgs=[...e.args??[]],t.cwd&&process.chdir(ve.resolve(t.cwd)),{opt:t,program:e}},_=(r,e=!0)=>{if(!r)return[];if(typeof r=="string"){let n=[];return r.split(",").forEach(s=>{let o=s.trim();e?o.length>0&&n.push(o):n.push(o)}),n}return[]};import W from"path";import q from"fs";import Y from"path";import Ee from"json5";var D=r=>{if(!q.existsSync(r))throw new Error(`ERROR: The Path '${r}' does not exists!`);return q.readFileSync(r,{encoding:"utf-8"})},Fe=r=>V(D(r)),V=r=>Ee.parse(r),P=r=>{let e=Fe(r);if(e.extends){let n=Y.dirname(r),t=Y.resolve(n,e.extends);e=Object.assign({},e,P(t))}return e},j=(r,e)=>{if(!e)return r;let n="",t=r.split("-");for(let s=0;s<t.length;s++){let o=t[s];s===0?n=o:(o.length>0&&(o=`${o[0].toUpperCase()}${o.substring(1)}`),n=`${n}${o}`)}return n},M=(r,e)=>{if(r.length<1)return!1;for(let n of r)for(let t of e)if(n===t)return!0;return!1},N=(r,e)=>{if(r.length<1)return!1;for(let n of r){let t=!1;for(let s of e)if(s===n){t=!0;break}if(!t)return!1}return!0};import Ue from"debug";var z="useful-tasks",F=`${z}:debug`,k=`${z}:info`,Q="\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}",Z="--var-",ee="--env-";import te from"debug";var f=te(F),T=te(k);var ne=async(r,e)=>{let n=e;for(let t of Object.keys(n))if(typeof t=="string"&&!(t==="id"||t==="tags")&&n[t]!==void 0&&typeof n[t]=="string"){let s=n[t];for(;;){let o=r.replaceRegex.exec(s);if(o==null)break;let l=o[0],c=o[1],p=r.vars;if(c.length>0){let a=c.split(".");for(let h=0;h<a.length;h++){let w=a[h];if(p.hasOwnProperty(w))p=p[w];else throw new Error(`The value of ${c} could not be found!`)}}let u=s.substring(0,o.index),b=`${p}`,S=s.substring(o.index+l.length);s=`${u}${b}${S}`,f(`Variable injection: '${t}'=>'${s}'`)}n[t]=s}},K=(r,e,n,t)=>{let s,o=!1;for(let l of r){if(l.trim()==="--"){f("Stop parsing by '--'");break}if(o&&s){let p=l.startsWith("-")?"":l;t(s,p),s=void 0,o=!1}else if(l.indexOf(e)>=0){let u=l.indexOf("=");if(u>=0){let b=j(l.substring(e.length,u),n),S=l.substring(u+1);t(b,S)}else s=j(l.substring(e.length),n),o=!0}}},R=(r,e,n,t)=>{if(t&&r.vars[e]!==void 0){f(`Skips assigning the variable ${e}=${n} because it already exists.`);return}f(`Sets the variable ${e}=${n}`),r.vars[e]=n},A=(r,e,n,t)=>{var s=typeof n;if(s!=="string"&&s!=="number"&&s!=="boolean")f(`Ignoring the invalid typed(${s}) environment variable ${e}=${n}`);else if(String(n).length<1)f(`Ignoring the invalid environment variable ${e}=${n}`);else{if(t&&process.env[e]!==void 0){f(`Skips assigning the environment variable ${e}=${n} because it already exists.`);return}f(`Sets the environment variable ${e}=${n}`),process.env[e]=String(n)}};import Re from"string-argv";var re=async(r,e)=>{if(!e.args||typeof e.args!="string")throw new Error("Found missing or invalid property 'args' that is required");let n=Re(e.args),t=E(n);C(r.originCwd,t.opt,t.program)};import d from"fs";import{execSync as Le}from"child_process";import x from"path";import{CheckRepoActions as Oe,ResetMode as Ie,simpleGit as se}from"simple-git";import{copySync as Ge,mkdirpSync as De,removeSync as le}from"fs-extra";import Ve from"json5";import Ae from"fs";import{globSync as L}from"glob";var O=(r,e,n,t,s,o)=>{if(Ae.statSync(e).isDirectory()===!1)return!1;let l=s===!0,c=n.length>0,p=t.length>0;return!c&&p?(r(L("**",{ignore:[".",...t],cwd:e,nodir:l})),!0):c&&!p?(r(L(n,{cwd:e,nodir:l})),!0):c&&p?(r(L(n,{ignore:t,cwd:e,nodir:l})),!0):o?(r(L("**",{ignore:["."],cwd:e,nodir:l})),!0):!1};var U=(r,e)=>{throw new Error(`The parameter '${String(e)}' has an invalid value ${r[e]}`)},ce=async(r,e)=>{let n=x.resolve(e.localPath);d.existsSync(n)||d.mkdirSync(n,{recursive:!0}),d.readdirSync(n).length===0&&e.url&&await se().clone(e.url,n);let t=se(n,{binary:e.binary});if(!await t.checkIsRepo(Oe.IS_REPO_ROOT))throw Error(`${n} is not a git repository!!!`);if(e.updateSubmodules&&(await t.submoduleInit(),await t.submoduleUpdate()),await t.fetch(),e.branch){let l=!1,c=await t.branchLocal();for(var o of c.all)if(o===e.branch){l=!0;break}let p=e.branch??"",u=e.startPoint??"";l?(c.current!==e.branch&&await t.checkout(p),await t.reset(Ie.HARD,[u])):await t.checkoutBranch(p,u)}},pe=async(r,e)=>{let n=x.resolve(e.target),t=x.resolve(e.path);if(d.existsSync(t)){let s=d.lstatSync(t);f(`LSTAT is symlink? ${s.isSymbolicLink()}, is directory? ${s.isDirectory()}`),e.forced&&(s.isSymbolicLink()||s.isFile()?(f(`Unlink ${t}`),d.unlinkSync(t)):s.isDirectory()&&(f(`Remove directory '${t}'`),le(t)))}if(d.existsSync(t))f(`Could not create symbolic link cause '${t}' already exists`);else{f(`Create symbolic link ${n} => ${t}`),d.symlinkSync(n,t,e.linkType);let s=d.lstatSync(t);f(`LSTAT is symlink? ${s.isSymbolicLink()}, is directory? ${s.isDirectory()}`)}},fe=async(r,e)=>{f(`Start execution... ${e.cmd}`),Le(e.cmd,{shell:e.shell,env:process.env,stdio:[process.stdin,process.stdout,process.stderr],encoding:"utf-8"})},de=async(r,e)=>{if(e.key===void 0||!e.key||typeof e.key!="string"||e.key.length<1)throw new Error(`Invalid key ${e.key}. It must be a string.`);let n=e.value;if(n==null&&e.var&&(n=e.var),e.isFallback!==!0&&(e.isFallback=!1),e.varType==="file"){if(typeof n!="string")throw new Error(`The "value" must contain path of a file with "varType":"${e.varType}"`);let t=x.resolve(n);if(!d.existsSync(t))throw new Error(`File "${t}" does not exist to use as a variable`);n=d.readFileSync(t,{encoding:"utf8"}),e.fileFormat==="json"&&(n=Ve.parse(n))}R(r,e.key,n,e.isFallback)},Pe=/(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;function je(r){let e={},n=r.toString();n=n.replace(/\r\n?/mg,`
`);let t;for(;(t=Pe.exec(n))!=null;){let s=t[1],o=t[2]||"";o=o.trim();let l=o[0];o=o.replace(/^(['"`])([\s\S]*)\1$/mg,"$2"),l==='"'&&(o=o.replace(/\\n/g,`
`),o=o.replace(/\\r/g,"\r")),e[s]=o}return e}var ge=async(r,e)=>{let n=e.value;n==null&&e.var&&(n=e.var),e.isFallback!==!0&&(e.isFallback=!1);let t=e.isFallback;if(e.varType==="file"){if(typeof n!="string")throw new Error(`The "value" must contain path of a file with "varType":"${e.varType}"`);let s=x.resolve(n),o,l=D(s);try{o=V(l)}catch{}o||(f("Parsing with JSON failed, for now, trying to parse line literals."),o=je(l)),n=o}if(typeof n!="object")throw new Error('The content of the "value" must be in the form of key-value pairs. For example: {"KEY_A":"value_a", "KEY_B":"value_b"}');Object.keys(n).forEach(s=>{A(r,s,n[s],t)})},ue=async(r,e)=>{let n=e.text??"",t=(e.target??"c").trim(),s=e.path;if(t==="c"||t==="console")console.log(n);else{if(!s)throw new Error(`The parameter 'path' is required for a target '${t}'!`);let o=x.resolve(s),l=x.dirname(o);if(d.existsSync(l)||De(l),t=="fa"||t=="file-append"){let c,p;try{p=d.openSync(o,"a"),d.appendFileSync(p,n,"utf8")}catch(u){c=u}finally{p!==void 0&&d.closeSync(p)}if(c)throw c}else d.writeFileSync(o,n)}},v=(r,e)=>{if(r!=null){if(typeof r=="string")return[r];if(Array.isArray(r))return r.filter(n=>typeof n=="string")}return[]},oe=(r,e,n)=>{f(`Copy: ${r} => ${e}`),Ge(r,e,n)},me=async(r,e)=>{if(!d.existsSync(e.src))throw new Error(`The source '${e.src}' does not exist`);let n=e?.options?.conflict,t=n==null||typeof n=="string"&&n.trim()==="overwrite";e.options&&"overwrite"in e?.options&&typeof e?.options?.overwrite=="boolean"&&(t=e.options.overwrite);let s={overwrite:t};O(c=>{for(let p of c){let u=x.join(e.src,p),b=x.join(e.dest,p);oe(u,b,s)}},e.src,v(e.include,[]),v(e.exclude,[]),!1,!1)||oe(e.src,e.dest,s)},ie=r=>{f(`Delete: ${r}`),le(r)},ye=async(r,e)=>{if(!d.existsSync(e.path)){f(`The '${e.path}' does not exist and cannot be deleted`);return}O(s=>{for(let o of s)ie(x.join(e.path,o))},e.path,v(e.include,[]),v(e.exclude,[]),!1,!1)||ie(e.path)},Me=(r,e,n,t)=>{var s=r;if(t<1)for(;e.test(s);)s=s.replace(e,n);else for(var o=0;o<t;o++)e.test(s)&&(s=s.replace(e,n));return s},Ne=(r,e,n,t)=>{var s=r;if(t<1)for(;s.indexOf(e)>=0;)s=s.replace(e,n);else for(var o=0;o<t;o++)s.indexOf(e)>=0&&(s=s.replace(e,n));return s},Ke=r=>r!=null&&typeof r=="object"&&"pattern"in r&&typeof r.pattern=="string",ae=(r,e,n,t,s)=>{f(`Find and Replace: ${r}`);let o=d.readFileSync(r,"utf-8"),l=e(o,n,t,s);d.writeFileSync(r,l,"utf-8")},he=async(r,e)=>{if(!d.existsSync(e.path)){f(`The '${e.path}' does not exist`);return}(e.replace===void 0||typeof e.replace!="string")&&U(e,"replace");let n=e.loop===void 0||e.loop===null?1:e.loop;typeof n=="string"?n=parseInt(n,10):typeof n!="number"&&U(e,"loop");let t,s;if(Ke(e.find)){let c=e.find;t=new RegExp(c.pattern,c.flags),s=Me}else if(typeof e.find=="string")t=e.find,s=Ne;else{U(e,"find");return}O(c=>{for(let p of c){let u=x.join(e.path,p);d.statSync(u).isDirectory()||ae(x.join(e.path,p),s,t,e.replace,n)}},e.path,v(e.include,[]),v(e.exclude,[]),!0,!0)||ae(e.path,s,t,e.replace,n)};var J={"git-repo-prepare":ce,symlink:pe,cmd:fe,"set-var":de,output:ue,"fs-copy":me,"fs-del":ye,"env-var":ge,"sub-tasks":re,"content-replace":he};var C=(r,e,n)=>{let t={},s=W.resolve(e.config);try{t=P(s)}catch(a){a instanceof Error?console.log(a.message):console.log(a),console.log(""),n.help()}let o,l="info",c=Q;if(t.env&&typeof t.env=="object"){let a=t.env;(a.verbose||a.verboseGit)&&(l="debug"),a.logLevel&&$.includes(a.logLevel)&&(l=a.logLevel),a.replaceRegex&&(c=a.replaceRegex)}if(e.logLevel&&$.includes(e.logLevel)&&(l=e.logLevel),l==="debug"?(o=`${k},${F}`,o=`${o},simple-git,simple-git:*`):l==="info"&&(o=`${k}`),o&&Ue.enable(o),f("CLI Options",e),typeof c!="string")throw new Error(`replaceRegex '${c}'  must be a string`);if(c.length<1)throw new Error(`replaceRegex '${c}' cannot be empty`);if(c.indexOf("(")<0||c.indexOf(")")<0)throw new Error(`replaceRegex '${c}' must contain regex group express '(' and ')'`);let p=W.resolve(process.cwd()),u={originCwd:r,baseCwd:p,replaceRegex:new RegExp(c),vars:{__env:{cwd_startup:r,cwd_base:p}}};e.extraArgs&&(f("Setting up the variables from the additional arguments"),K(e.extraArgs,Z,e.camelKeys,(a,h)=>{R(u,a,h,!1)}),f("Setting up the environment variables from the additional arguments"),K(e.extraArgs,ee,e.camelKeys,(a,h)=>{A(u,a,h,!1)})),T(""),T(`[${t.name}] Start task processing`);let b=(a,h)=>h!=null?a.id!==void 0?`[${h}]${a.id}/${a.type}`:`[${h}]${a.type}`:a.id!==void 0?`${a.id}/${a.type}`:`${a.type}`;(async()=>{let a=t.tasks??[];for(let g=0;g<a.length;g++){let i=a[g];if(i.id!==void 0&&i.id!==null){if(typeof i.id!="string")throw new Error("The task id must be a 'string' type");if(i.id.length<1)throw new Error("The task id cannot be empty");for(let y=g+1;y<a.length;y++){let m=a[y];if(m.id!==void 0&&m.id===i.id)throw new Error(`The task id '${i.id}' must be unique`)}}if(!i.type||!(i.type in J))throw new Error(`Found the invalid task type '${i.type}'`);if(i.__compare__elements=[],i.id&&(i.id=i.id.trim(),i.__compare__elements.push(i.id.trim())),i.tags){let y=m=>{f(`Ignoring invalid tags '${m}'`)};if(typeof i.tags=="string")i.tags.length>0?(i.tags=i.tags.trim(),i.__compare__elements.push(i.tags)):y(i.tags);else if(Array.isArray(i.tags)){i.tags=i.tags.map(m=>m.trim());for(let m of i.tags)typeof m=="string"&&m.length>0?i.__compare__elements.push(m):y(m)}else y(i.tags)}}if(e.exclude&&e.exclude.length>0){let g=e.exclude;f(`Excluding tasks by specified IDs or Tags : --exclude=${g}`),a=a.filter((i,y,m)=>{if(M(g,i.__compare__elements)===!1)return i})}if(e.excludeCta&&e.excludeCta.length>0){let g=e.excludeCta;f(`Excluding tasks by specified IDs or Tags : --exclude-cta=${g}`),a=a.filter((i,y,m)=>{if(N(g,i.__compare__elements)===!1)return i})}let h=e.include&&e.include.length>0,w=e.includeCta&&e.includeCta.length>0;if(h||w){let g=e.include,i=e.includeCta;f(`Including tasks by specified IDs or Tags : --include=${g} / --include-cta=${i}`),a=a.filter((y,m,B)=>{if(h&&M(g,y.__compare__elements)===!0||w&&N(i,y.__compare__elements)===!0)return y})}T(`Tasks : ${a.map((g,i)=>b(g,i))}`);let Te=a.length??0;for(let g=0;g<Te;g++){let i=a[g];ne(u,i);let y=b(i,g);if(i.enabled===!1){T(`
### Skip the task without execution => ${y}`);continue}else T(`
### Task : ${y}`);i.comment&&T(i.comment);let m=!1;if(i.cwd){let X=W.resolve(i.cwd);T(`Changing the current working directory => ${X}`),m=!0,process.chdir(X)}let B=J[i.type];await B(u,i),e.cwdModeIsContinue||(m&&T(`Restoring the current working directory => ${p}`),process.chdir(p))}})().then(()=>{}).catch(a=>{throw a}).finally(()=>{process.chdir(p),T(`[${t.name}] Tasks done
`)})};var We=Je.resolve(process.cwd()),xe=E();C(We,xe.opt,xe.program);export{C as usefulTasks};
//# sourceMappingURL=index.mjs.map