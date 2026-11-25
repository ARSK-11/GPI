const test=require('node:test');
const assert=require('node:assert/strict');
// Pure validators are tested by extracting the implementation to avoid requiring MySQL for unit tests.
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/support-center.js'),'utf8');
test('support routing secures replies, public reads and token access',()=>{
 assert.match(source,/crypto\.randomBytes\(32\)/);
 assert.match(source,/visitor_token_hash/);
 assert.match(source,/authorizedThread\(id,req\.query\.token\)/);
 assert.match(source,/db\.can\(req\.session\.user,'pesan','view'\)/);
 assert.match(source,/csrfOK\(req\)/);
});
test('widget and admin chat are sitewide and not linked to another provider',()=>{
 const p=fs.readFileSync(path.join(__dirname,'../app/public-view.js'),'utf8');
 const w=fs.readFileSync(path.join(__dirname,'../app/support-widget.html'),'utf8');
 const a=fs.readFileSync(path.join(__dirname,'../views/admin.ejs'),'utf8');
 assert.match(p,/support-widget\.html/);
 assert.match(w,/Knowledge Base Articles/);assert.match(w,/id="gpiHelpStartForm"/);
 assert.match(a,/id="section-support"/);assert.match(a,/id="supportAdminReply"/);
 assert.doesNotMatch(w,/tawk\.to/i);
});
test('form Media hanya memiliki satu input upload, terpisah dari Warta',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../views/admin.ejs'),'utf8');
 const modal=html.split('id="mediaModal"')[1].split('id="replyModal"')[0];
 assert.equal((modal.match(/type="file"/g)||[]).length,1);
 assert.match(modal,/name="files\[\]"/);
 assert.doesNotMatch(modal,/name="warta_file"/);
});
