const sharp = require("sharp");
(async () => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
  <rect width='1200' height='630' fill='white'/>
  <text x='600' y='315' font-size='72' fill='black' text-anchor='middle' font-family='Tahoma, Segoe UI, Arial'>دليل الصنايعية السويس</text>
</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const stats = await sharp(buf).stats();
  const { b, g, r } = stats.channels;
  console.log("mean RGB:", r.mean.toFixed(1), g.mean.toFixed(1), b.mean.toFixed(1));
  console.log("bytes:", buf.length);
})().catch((e) => {
  console.error("ERR", e.message);
});
