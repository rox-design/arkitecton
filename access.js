/* Test access: the app opens only with a valid access code.
   Codes are stored as SHA-256 of the upper-case code, each with an end (Swiss time) or none.
   This is a hurdle for test persons, not real security: everything is checked in the browser.
   Real protection comes with the server (see BACKLOG.md).
   New test person: add a line {h:<sha256 of the code>, until:"YYYY-MM-DDTHH:MM:SS+01:00", who:"..."}. */
var ACCESS={
  codes:[
    {h:"1ae2d0b6eab8d17b35199d1ab991ffe338cf99a9d0fcc753b62fdc37d733b6b2",until:null,who:"Rox"},
    {h:"ebaa7b8815ba15fe19757294e6d27857bceced70633443d6a23f06611c9cd0d2",until:"2026-11-28T23:59:59+01:00",who:"Architekt, Testrunde 28.11.2026"}
  ],
  KEY:"arkitecton:access",
  /* on this computer while building: no gate, unless forced with localStorage arkitecton:gate=1 */
  off:function(){try{return /^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&localStorage.getItem("arkitecton:gate")!=="1";}catch(e){return false;}},
  find:function(h){for(var i=0;i<this.codes.length;i++)if(this.codes[i].h===h)return this.codes[i];return null;},
  live:function(c){return !!c&&(!c.until||Date.now()<=Date.parse(c.until));},
  /* "ok" | "expired" | "none" for the code this browser remembers */
  state:function(){if(this.off())return "ok";var h="";try{h=localStorage.getItem(this.KEY)||"";}catch(e){}var c=this.find(h);return c?(this.live(c)?"ok":"expired"):"none";},
  hash:function(s){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(s).trim().toUpperCase())).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return ("0"+x.toString(16)).slice(-2);}).join("");});},
  /* resolves to "ok" | "expired" | "wrong"; a valid code is remembered in this browser */
  check:function(code){var self=this;return this.hash(code).then(function(h){var c=self.find(h);if(!c)return "wrong";if(!self.live(c))return "expired";try{localStorage.setItem(self.KEY,h);}catch(e){}return "ok";});}
};
