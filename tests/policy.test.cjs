const {test} = require("node:test");
const assert = require("node:assert/strict");
const {isAppUrl,isExternalUrl,mayUseMicrophone} = require("../policy.cjs");
test("only the exact production origin stays in the app", () => {
  assert.equal(isAppUrl("https://app.sowt.ai/auth?next=%2F"),true);
  for(const value of ["http://app.sowt.ai", "https://app.sowt.ai.evil.example", "https://evil.example@app.sowt.ai/", "https://app.sowt.ai:8443", "file:///etc/passwd", "javascript:alert(1)"]) assert.equal(isAppUrl(value),false,value);
});
test("external links cannot launch local files or custom handlers", () => {
  assert.equal(isExternalUrl("https://sowt.ai/download"),true);
  for(const value of ["javascript:alert(1)", "file:///C:/Windows/system32/cmd.exe", "ms-settings:privacy-microphone", "mailto:hello@example.com", "https://user:secret@example.com"]) assert.equal(isExternalUrl(value),false,value);
});
test("only SOWT's main frame can request audio, never camera or screen", () => {
  const trusted = {origin:"https://app.sowt.ai/",mainFrame:true,mediaTypes:["audio"]};
  assert.equal(mayUseMicrophone(trusted),true);
  for(const change of [{origin:"https://evil.example"},{mainFrame:false},{mediaTypes:["video"]},{mediaTypes:["audio","video"]},{mediaTypes:[]}]) assert.equal(mayUseMicrophone({...trusted,...change}),false);
});
