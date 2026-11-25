'use strict';
// Input rupiah from manual entry or Excel/CSV, no silent truncation or locale ambiguity.
function parseMoney(input){
 if(typeof input==='number')return Number.isFinite(input)?input:NaN;
 let v=String(input??'').trim().replace(/^rp\s*/i,'').replace(/\s/g,'');
 if(!v)return NaN;
 if(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(v))v=v.replace(/\./g,'').replace(',','.');
 else if(/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(v))v=v.replace(/,/g,'');
 else if(/^\d+(?:[.,]\d{1,2})?$/.test(v))v=v.replace(',','.');
 else return NaN;
 const amount=Number(v);
 return Number.isFinite(amount)&&Math.round(amount*100)/100===amount?amount:NaN;
}
function summary(rows){
 let masuk=0,keluar=0,janji=0;
 for(const r of rows||[]){
  const a=Number(r.jumlah)||0;
  if(r.jenis_transaksi==='Janji Iman'&&r.status_janji==='janji')janji+=a;
  else if(r.arus_kas==='keluar')keluar+=a;
  else masuk+=a;
 }
 return {masuk,keluar,saldo:masuk-keluar,janji};
}
module.exports={parseMoney,summary};
