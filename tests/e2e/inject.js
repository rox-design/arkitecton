()=>{const SK=/^(id|k|w|pid|kid|ref|scope|status|proc|role|typ|me|bkp|kind|type|date|due|qDue|sub|until|at|subForm|sig|sigRule|m|tag|iban|v|pay|cur|lang|theme|mode|f|c|state|unit|cat|seq)$/i;
const walk=(o,pa)=>{if(Array.isArray(o))o.forEach(x=>walk(x,pa));else if(o&&typeof o==='object')for(const k of Object.keys(o)){const v=o[k];
 if(typeof v==='string'&&!SK.test(k)&&!/^\d{4}-\d\d-\d\d$/.test(v)&&v.length<80)o[k]=v+'<img src=x data-p="'+pa+'.'+k+'" onerror="(window.__h=window.__h||[]).push(this.dataset.p)">';else walk(v,pa+'.'+k);}};
['firm','office','tenders','projects','contractors','contracts','invoices','fees','docs'].forEach(k=>walk(D[k],k));render();}
