/** Generate the dossier's local map asset from public-domain Natural Earth data. */
import { writeFile } from "node:fs/promises";

const url =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const response = await fetch(url);
if (!response.ok) throw new Error(`Map download failed: ${response.status}`);
const data = await response.json();
const country = data.features.find((feature) => feature.properties.ADMIN === "Philippines");
if (!country) throw new Error("Philippines geometry missing");
const project = ([lon, lat]) => [100 + (lon - 116.5) * 43, 130 + (21.4 - lat) * 39];
const polygons =
  country.geometry.type === "MultiPolygon"
    ? country.geometry.coordinates
    : [country.geometry.coordinates];
const paths = polygons
  .map((rings) =>
    rings
      .map(
        (ring) =>
          ring
            .map(
              (point, i) =>
                `${i ? "L" : "M"}${project(point)
                  .map((n) => n.toFixed(1))
                  .join(",")}`,
            )
            .join(" ") + "Z",
      )
      .join(" "),
  )
  .join(" ");
const [cx, cy] = project([123.8854, 10.3157]);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="860" viewBox="0 0 640 860">
<defs><pattern id="grid" width="43" height="39" patternUnits="userSpaceOnUse"><path d="M43 0H0V39" fill="none" stroke="#9b977f" stroke-opacity=".2"/></pattern></defs>
<rect width="640" height="860" fill="#e7dfc7"/><rect x="18" y="18" width="604" height="824" fill="none" stroke="#a39b80"/>
<text x="45" y="69" font-family="monospace" font-size="15" fill="#71634c" letter-spacing="3">CASE 404 / LOCATION RECORD</text>
<text x="45" y="111" font-family="Georgia,serif" font-size="33" fill="#3f493e">PHILIPPINES</text>
<path d="M45 128H595" stroke="#864339" stroke-width="3"/>
<rect x="45" y="148" width="550" height="625" fill="url(#grid)"/>
<path d="${paths}" fill="#798571" stroke="#4e5d4c" stroke-width="1" fill-rule="evenodd"/>
<circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="#963d32" stroke-width="2"/>
<circle cx="${cx}" cy="${cy}" r="4" fill="#963d32"/>
<path d="M${cx + 16} ${cy}l55 -25h85" fill="none" stroke="#963d32" stroke-width="2"/>
<text x="${cx + 72}" y="${cy - 33}" font-family="monospace" font-size="19" fill="#84362c">CEBU</text>
<text x="58" y="799" font-family="monospace" font-size="15" fill="#514b3b">SUBJECT BASE / CEBU, PHILIPPINES</text>
<text x="58" y="823" font-family="monospace" font-size="11" fill="#77715f">Natural Earth / geographic reference</text>
</svg>`;
await writeFile(new URL("../public/images/dossier/philippines.svg", import.meta.url), svg);
console.log(`Generated Philippines map (${polygons.length} island polygons).`);
