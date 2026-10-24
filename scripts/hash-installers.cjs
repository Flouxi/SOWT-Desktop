const fs=require("node:fs"), path=require("node:path"), crypto=require("node:crypto");
const files=fs.readdirSync("dist").filter(name=>/\.(exe|dmg)$/.test(name));
if(!files.length)throw Error("No desktop installer was produced.");
const lines=files.map(name=>crypto.createHash("sha256").update(fs.readFileSync(path.join("dist",name))).digest("hex")+"  "+name);
fs.writeFileSync("dist/SHA256SUMS.txt",lines.join("\n")+"\n");
console.log(lines.join("\n"));
