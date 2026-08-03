const fs = require("fs");
const path = require("path");
const files = ["index.html", "category/plumbing.html", "craftsman/plumbing-1.html", "categories.html", "join.html"];
for (const f of files) {
  const p = path.join(".next", "server", "app", f);
  if (!fs.existsSync(p)) {
    console.log(f, "MISSING");
    continue;
  }
  const html = fs.readFileSync(p, "utf8");
  const ld = (html.match(/application\/ld\+json/g) || []).length;
  const og = html.includes("property=\"og:title\"");
  const can = (html.match(/rel="canonical"/g) || []).length;
  const desc = html.includes("name=\"description\"");
  console.log(f, "-> ld+json:", ld, "canonical:", can, "og:", og, "desc:", desc);
}
