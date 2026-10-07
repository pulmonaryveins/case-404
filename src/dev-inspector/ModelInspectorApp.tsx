import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF, Center, Bounds } from "@react-three/drei";

interface CatalogEntry {
  name: string;
  relPath: string;
  sizeLabel: string;
  meshCount?: number;
  triangleCount?: number;
  materialCount?: number;
  textureCount?: number;
  largestTexture?: string;
  dimensions?: string;
  error?: string;
}

/**
 * Development-only GLB visual inspector. Not part of the CASE 404
 * application — served from inspector.html, excluded from the production
 * build (see vite.config.ts). Lets us actually look at a source model:
 * orbit, zoom, reset, neutral lighting/background.
 */
export function ModelInspectorApp() {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    fetch("/assets-source/case-404/catalog.json")
      .then((res) => res.json())
      .then((data: CatalogEntry[]) => {
        setCatalog(data);
        if (data.length > 0) setSelected(data[0].relPath);
      })
      .catch(() => setCatalog([]));
  }, []);

  const current = catalog.find((c) => c.relPath === selected);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#111",
        color: "#eee",
        fontFamily: "monospace",
      }}
    >
      <div style={{ width: 340, overflowY: "auto", padding: 12, borderRight: "1px solid #333" }}>
        <h2 style={{ fontSize: 14, marginTop: 0 }}>CASE 404 — Model Inspector (dev only)</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
          size={Math.min(catalog.length, 20)}
        >
          {catalog.map((c) => (
            <option key={c.relPath} value={c.relPath}>
              {c.name}
            </option>
          ))}
        </select>
        {current && (
          <dl style={{ fontSize: 12, lineHeight: 1.6 }}>
            <div>path: {current.relPath}</div>
            <div>size: {current.sizeLabel}</div>
            <div>meshes: {current.meshCount ?? "unknown"}</div>
            <div>triangles: {current.triangleCount ?? "unknown"}</div>
            <div>materials: {current.materialCount ?? "unknown"}</div>
            <div>textures: {current.textureCount ?? "unknown"}</div>
            <div>largest texture: {current.largestTexture ?? "unknown"}</div>
            <div>local bounds (untransformed): {current.dimensions ?? "unknown"}</div>
          </dl>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [3, 2, 3], fov: 45 }}>
          <color attach="background" args={["#1a1a1a"]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 3]} intensity={1} />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} />
          <Grid args={[10, 10]} cellColor="#333" sectionColor="#555" fadeDistance={15} />
          <Suspense fallback={null}>
            {current && !current.error && <InspectedModel path={`/${current.relPath}`} />}
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
}

function InspectedModel({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  );
}
