
====================【u酷资源站】====================
// @name 采集站模板
// @downloadURL https://gh-proxy.org/https://github.com/Silent1566/OmniBox-Spider/raw/refs/heads/main/模板/JavaScript/采集站模板.js
/**
 * OmniBox 采集站直接爬虫脚本
 *
 * 此脚本直接调用采集站接口获取数据，参考 OmniBox 后端实现逻辑
 * 只需要配置采集站的 API 地址即可使用
 *
 * 配置说明：
 * 1. 在 OmniBox 后台添加采集站，获取采集站的 API 地址
 * 2. 将 API 地址配置到环境变量 SITE_API 中，或直接修改下面的 SITE_API 常量
 * 3. DANMU_API 已配置 LogVar弹幕API
 *
 * 采集站接口规范（参考 OmniBox 后端实现）：
 * - 首页：GET {API}?ac=list&pg={page}
 * - 分类：GET {API}?ac=class
 * - 分类列表：GET {API}?ac=videolist&t={typeId}&pg={page}
 * - 搜索：GET {API}?ac=list&wd={keyword}&pg={page}
 * - 详情：GET {API}?ac=detail&ids={videoId}
 */
const OmniBox = require("omnibox_sdk");
// ==================== 配置区域 ====================
const SITE_API = process.env.SITE_API || "https://api.ukuzy.com/api.php/provide/vod";
// LogVar弹幕API
const DANMU_API = process.env.DANMU_API || "http://39.106.115.4:9321/123456";
// ==================== 配置区域结束 ====================
async function requestSiteAPI(params = {}) {
if (!SITE_API) {
throw new Error("请配置采集站 API 地址（SITE_API 环境变量）");
  }
const url = new URL(SITE_API);
Object.keys(params).forEach((key) => {
if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      url.searchParams.append(key, params[key]);
    }
  });
OmniBox.log("info", `请求采集站: ${url.toString()}`);
try {
const response = await OmniBox.request(url.toString(), {
      method: "GET",
      headers: {
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
if (response.statusCode !== 200) {
throw new Error(`HTTP ${response.statusCode}: ${response.body}`);
    }
const data = JSON.parse(response.body);
return data;
  } catch (error) {
OmniBox.log("error", `请求采集站失败: ${error.message}`);
throw error;
  }
}
function toInt(value) {
if (typeof value === "number") return Math.floor(value);
if (typeof value === "string") {const num=parseInt(value,10);return isNaN(num)?0:num;}
return 0;
}
function formatVideos(list) {
if (!Array.isArray(list)) return [];
return list.map((item)=>{
if(!item||typeof item!=="object")return null;
const vodId=String(item.vod_id||item.VodID||"");
let vodPlayFrom=String(item.vod_play_from||item.VodPlayFrom||"");
if(vodPlayFrom&&vodId&&vodPlayFrom.includes("$$$")){
const lines=vodPlayFrom.split("$$$").map(l=>l.trim()).filter(Boolean);
vodPlayFrom=lines.map(l=>`${l}-${vodId}`).join("$$$");
}else if(vodPlayFrom&&vodId){
vodPlayFrom=`${vodPlayFrom}-${vodId}`;
}
return {
vod_id:vodId,vod_name:String(item.vod_name||""),vod_pic:String(item.vod_pic||""),
vod_remarks:String(item.vod_remarks||""),vod_year:String(item.vod_year||""),
vod_area:String(item.vod_area||""),vod_actor:String(item.vod_actor||""),
vod_director:String(item.vod_director||""),vod_content:String(item.vod_content||""),
vod_play_from:vodPlayFrom,vod_play_url:String(item.vod_play_url||"")
};
}).filter(x=>x&&x.vod_id);
}
function convertToPlaySources(vodPlayFrom,vodPlayUrl,vodId){
const playSources=[];
if(!vodPlayFrom||!vodPlayUrl)return playSources;
const sourceNames=vodPlayFrom.split("$$$").map(n=>n.trim()).filter(Boolean);
const sourceUrls=vodPlayUrl.split("$$$").map(u=>u.trim()).filter(Boolean);
const max=Math.max(sourceNames.length,sourceUrls.length);
for(let i=0;i<max;i++){
const name=sourceNames[i]||`线路${i+1}`;
let cleanName=name;
if(vodId&&name.endsWith(`-${vodId}`)) cleanName=name.slice(0,name.length-`-${vodId}`.length);
const surl=sourceUrls[i]||"";
const eps=[];
if(surl){
surl.split("#").map(s=>s.trim()).filter(Boolean).forEach(seg=>{
const parts=seg.split("$");
if(parts.length>=2){
const epName=parts[0].trim();
const pid=parts.slice(1).join("$").trim();
if(epName&&pid)eps.push({name:epName,playId:pid});
}else if(parts[0]){
eps.push({name:`第${eps.length+1}集`,playId:parts[0].trim()});
}
});
}
if(eps.length>0) playSources.push({name:cleanName,episodes:eps});
}
return playSources;
}
function formatDetailVideos(list){
if(!Array.isArray(list))return [];
return list.map(item=>{
if(!item||typeof item!=="object")return null;
const vodId=String(item.vod_id||item.VodID||"");
let vodPlayFrom=String(item.vod_play_from||item.VodPlayFrom||"");
if(vodPlayFrom&&vodId&&vodPlayFrom.includes("$$$")){
const lines=vodPlayFrom.split("$$$").map(l=>l.trim()).filter(Boolean);
vodPlayFrom=lines.map(l=>`${l}-${vodId}`).join("$$$");
}else if(vodPlayFrom&&vodId){
vodPlayFrom=`${vodPlayFrom}-${vodId}`;
}
const vodPlayUrl=String(item.vod_play_url||item.VodPlayURL||"");
const vodPlaySources=convertToPlaySources(vodPlayFrom,vodPlayUrl,vodId);
return {
vod_id:vodId,vod_name:String(item.vod_name||""),vod_pic:String(item.vod_pic||""),
type_name:String(item.type_name||""),vod_year:String(item.vod_year||""),
vod_area:String(item.vod_area||""),vod_remarks:String(item.vod_remarks||""),
vod_actor:String(item.vod_actor||""),vod_director:String(item.vod_director||""),
vod_content:String(item.vod_content||""),
vod_play_sources:vodPlaySources.length>0?vodPlaySources:undefined
};
}).filter(x=>x&&x.vod_id);
}
function formatClasses(classes){
if(!Array.isArray(classes))return [];
const seen=new Set(),res=[];
for(const cls of classes){
if(!cls||!cls.type_id)continue;
const tid=String(cls.type_id||cls.TypeID||"");
const tpid=String(cls.type_pid||cls.TypePID||"");
const tname=String(cls.type_name||cls.TypeName||"").trim();
if(!tid||seen.has(tid))continue;
seen.add(tid);
res.push({type_id:tid,type_pid:tpid,type_name:tname});
}
return res;
}
async function enrichVideosWithDetails(videos){
if(!Array.isArray(videos)||videos.length===0)return videos;
const ids=[],map=new Map();
for(const v of videos){
if(!v.vod_pic||!v.vod_year||!v.vod_douban_score){ids.push(v.vod_id);map.set(v.vod_id,v);}
}
if(ids.length===0)return videos;
const batch=20;
for(let i=0;i<ids.length;i+=batch){
const batchIds=ids.slice(i,Math.min(i+batch,ids.length));
try{
const resp=await requestSiteAPI({ac:"detail",ids:batchIds.join(",")});
if(Array.isArray(resp.list)){
for(const it of resp.list){
const vid=String(it.vod_id||"");
const o=map.get(vid);
if(!o)continue;
if(it.vod_pic)o.vod_pic=String(it.vod_pic);
if(it.vod_year)o.vod_year=String(it.vod_year);
if(it.vod_douban_score)o.vod_douban_score=String(it.vod_douban_score);
}
}
}catch(e){OmniBox.log("warn",`批量详情失败:${e.message}`);}
}
return videos;
}
async function matchDanmu(fileName){
if(!DANMU_API||!fileName)return [];
try{
const url=`${DANMU_API}/api/v2/match`;
const res=await OmniBox.request(url,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},body:JSON.stringify({fileName})});
if(res.statusCode!==200){OmniBox.log("warn",`弹幕匹配HTTP${res.statusCode}`);return [];}
const j=JSON.parse(res.body);
if(!j.isMatched||!j.matches||j.matches.length===0)return [];
const m=j.matches[0];
if(!m.episodeId)return [];
let dnName="弹幕";
if(m.animeTitle&&m.episodeTitle)dnName=`${m.animeTitle} - ${m.episodeTitle}`;
else if(m.animeTitle)dnName=m.animeTitle;
else if(m.episodeTitle)dnName=m.episodeTitle;
const danmuUrl=`${DANMU_API}/api/v2/comment/${m.episodeId}?format=xml`;
return [{name:dnName,url:danmuUrl}];
}catch(err){OmniBox.log("warn",`弹幕异常:${err.message}`);return [];}
}
function inferFileNameFromURL(u){try{const o=new URL(u);let s=o.pathname.split("/").pop()||"";const dot=s.lastIndexOf(".");if(dot>0)s=s.substring(0,dot);return s.replace(/[_-]/g," ").replace(/./g," ").trim()||u;}catch{return u;}}
function extractDigits(s){return typeof s==="string"?s.replace(/D/g,""):"";}
function extractVideoIdFromFlag(flag){if(!flag)return"";if(flag.includes("-")){const p=flag.split("-");const last=p[p.length-1];if(/^d+$/.test(last))return last;}if(/^d+$/.test(flag))return flag;return"";}
module.exports={home,category,search,detail,play};
const runner=require("spider_runner");runner.run(module.exports);
async function home(params){
try{
const pg=params.page||"1";
let resp=await requestSiteAPI({ac:"list",pg});
if((!resp.class||resp.class.length===0)){
try{const c=await requestSiteAPI({ac:"class"});if(c.class)resp.class=c.class;}catch(e){OmniBox.log("warn","获取分类失败");}
}
const classes=formatClasses(resp.class||[]);
let videos=formatVideos(resp.list||[]);
videos=await enrichVideosWithDetails(videos);
return {class:classes,list:videos};
}catch(e){OmniBox.log("error",`首页失败:${e.message}`);return{class:[],list:[]};}
}
async function category(params){
try{
const cid=params.categoryId;const pg=params.page||1;
if(!cid)throw new Error("分类ID为空");
const resp=await requestSiteAPI({ac:"videolist",t:cid,pg:String(pg)});
const list=formatVideos(resp.list||[]);
return {page:toInt(resp.page),pagecount:toInt(resp.pagecount),total:toInt(resp.total),list};
}catch(e){OmniBox.log("error",`分类失败:${e.message}`);return{page:1,pagecount:0,total:0,list:[]};}
}
async function detail(params){
try{
const vid=params.videoId;if(!vid)throw new Error("vid为空");
const resp=await requestSiteAPI({ac:"detail",ids:vid});
return {list:formatDetailVideos(resp.list||[])};
}catch(e){OmniBox.log("error",`详情失败:${e.message}`);return{list:[]};}
}
async function search(params){
try{
const kw=params.keyword||params.wd||"";const pg=params.page||1;
if(!kw)return{page:1,pagecount:0,total:0,list:[]};
const resp=await requestSiteAPI({ac:"list",wd:kw,pg:String(pg)});
let videos=formatVideos(resp.list||[]);
if(videos.length>0&&(!videos[0].vod_pic||videos[0].vod_pic==="")){
try{
const ids=videos.map(v=>v.vod_id);
const dr=await requestSiteAPI({ac:"detail",ids:ids.join(",")});
videos=formatVideos(dr.list||[]);
}catch(e){OmniBox.log("warn","搜索补详情失败");}
}
return {page:toInt(resp.page),pagecount:toInt(resp.pagecount),total:toInt(resp.total),list:videos};
}catch(e){OmniBox.log("error",`搜索失败:${e.message}`);return{page:1,pagecount:0,total:0,list:[]};}
}
async function play(params){
try{
const playId=params.playId;const flag=params.flag||"";
if(!playId)throw new Error("playId不能为空");
const vid=extractVideoIdFromFlag(flag);
OmniBox.log("info",`play playId=${playId} flag=${flag} vid=${vid}`);
let parse=/.(m3u8|mp4)$/.test(playId)?0:1;
const urlsResult=[{name:"播放",url:playId}];
const ret={urls:urlsResult,flag,header:{},parse};
if(DANMU_API&&vid){
let fileName="";
try{
const dResp=await requestSiteAPI({ac:"detail",ids:vid});
if(dResp.list&&dResp.list.length>0){
const v=dResp.list[0];
const vName=v.vod_name||"";
const pUrl=v.vod_play_url||"";
if(vName&&pUrl){
const seg=pUrl.split("#").filter(s=>s.trim());
if(seg.length===1)fileName=vName;
else{
let epIdx=0;
for(let idx=0;idx<seg.length;idx++){
const s=seg[idx];const pt=s.split("$");
if(pt.length>=2){
const epName=pt[0].trim();const epUrl=pt.slice(1).join("$").trim();
if(epUrl===playId||epUrl.includes(playId)||playId.includes(epUrl)){
const num=extractDigits(epName);
epIdx=num?parseInt(num,10):idx+1;break;
}
}
}
if(epIdx>0){
fileName=epIdx<10?`${vName} S01E0${epIdx}`:`${vName} S01E${epIdx}`;
}else fileName=vName;
}
}
}
}catch(err){OmniBox.log("warn","获取片名用于弹幕失败");}
if(!fileName)fileName=inferFileNameFromURL(playId);
if(fileName){
const danmuList=await matchDanmu(fileName);
if(danmuList.length>0)ret.danmaku=danmuList;
}
}
return ret;
}catch(e){OmniBox.log("error",`play接口异常:${e.message}`);return{urls:[],flag:params.flag||"",header:{}};}
}
