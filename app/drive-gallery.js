'use strict';
// Optional direct-gallery mode for public Google Drive folders.
// Without DRIVE_API_KEY, the website displays Google's embedded folder view.
const cache=new Map();
function typeOf(mime){if(mime.startsWith('image/'))return 'photo';if(mime.startsWith('video/'))return 'video';if(mime==='application/pdf')return 'pdf';return null;}
async function listing(folderId,apiKey=process.env.DRIVE_API_KEY){
 if(!/^[A-Za-z0-9_-]{10,200}$/.test(folderId))throw Error('Folder ID tidak valid');
 if(!apiKey)return {configured:false,files:[]};
 const previous=cache.get(folderId);
 if(previous&&Date.now()-previous.at<300000)return previous.result;
 const q=`'${folderId}' in parents and trashed = false`;
 const params=new URLSearchParams({q,key:apiKey,pageSize:'100',fields:'files(id,name,mimeType),nextPageToken',orderBy:'modifiedTime desc'});
 const res=await fetch('https://www.googleapis.com/drive/v3/files?'+params,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
 if(!res.ok)throw Error('Google Drive API HTTP '+res.status);
 const json=await res.json();
 const files=(Array.isArray(json.files)?json.files:[]).filter(x=>/^[A-Za-z0-9_-]{10,200}$/.test(String(x.id))&&typeof x.name==='string'&&typeOf(String(x.mimeType||''))).map(x=>({id:x.id,title:x.name.slice(0,180),type:typeOf(x.mimeType)}));
 const result={configured:true,files};cache.set(folderId,{at:Date.now(),result});
 return result;
}
module.exports={listing,typeOf};
