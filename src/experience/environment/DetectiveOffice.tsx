import { Grid } from "@react-three/drei";
import { environmentConfig } from "./environmentConfig";

/**
 * Phase 0: deliberately near-empty. Real geometry (desk, evidence board,
 * dossier, workstation, props) is introduced in Phase 1 after the GLB
 * audit — nothing here is procedurally recreated in the meantime.
 */
export function DetectiveOffice() {
  return (
    <group name="detective-office">
      {environmentConfig.showDevGrid && (
        <Grid
          args={[environmentConfig.groundSize, environmentConfig.groundSize]}
          cellColor="#3a332c"
          sectionColor="#5f7a85"
          fadeDistance={25}
          position={[0, 0, 0]}
        />
      )}
    </group>
  );
}
