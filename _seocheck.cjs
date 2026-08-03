const fs = require("fs");
const path = require("path");
const files = ["index.html", "category/plumbing.html", "craftsman/plumbing-1.html", "categories.html", "join.html"];
for (const f of files) {
  const p = path.join(".next", "server", "app", f);
  const html = fs.readFileSync(p, "utf8");
  const scripts = (html.match(/<script type="application\/ld\+json">/g) || []).length;
  console.log(f, "-> ld+json scripts:", scripts);
}
// search page is dynamic — check its compiled route instead
const searchDir = ".next/server/app/search";
if (fs.existsSync(searchDir)) {
  const files2 = fs.readdirSync(searchDir);
  console.log("search dir files:", files2.join(", "));
}
