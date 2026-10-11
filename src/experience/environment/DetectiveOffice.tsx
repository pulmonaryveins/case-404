import { Model } from "../models/Model";
import { DeskProps } from "./DeskProps";
import { ArchiveStation } from "./ArchiveStation";
import { Carpet } from "./Carpet";
import { WallLamp } from "./WallLamp";
import { LampPoint, LampSpot } from "./LampSpot";
import { MerchCorner } from "./MerchCorner";
import { Dossier } from "./Dossier";
import { EvidenceBoard } from "./EvidenceBoard";
import { MoonFill } from "./MoonFill";
import { MoonWindow } from "./MoonWindow";
import { RoomShell } from "./RoomShell";

/**
 * Opening composition: a dark room, the working desk, and the board — read
 * as one workspace from the front.
 *
 * The window on the left wall lets cool moonlight in. The right side is
 * taken by the archive desk, turned in the back-right corner.
 */
export function DetectiveOffice() {
  return (
    <group name="detective-office">
      <RoomShell />
      <MoonWindow />
      <MoonFill />

      {/* Rug on the floor, under the main desk. */}
      <Carpet />
      <MerchCorner />
      {/* The wall light: one lamp over the board, flat to the wall (on from the
          start), and its light. */}
      <WallLamp />
      {/* Both of its lights fall off with distance as real light does (inverse
          square) and have no cut-off radius, which showed as a curved edge
          across the desk and floor. The spot is the lamp's own light on the
          board; the soft point is its spill round the room. */}
      <LampSpot
        lamp="wall"
        at={[-0.05, 2.12, -3.55]}
        aim={[-0.05, 1.45, -3.77]}
        intensity={2.9}
        angle={1.3}
        distance={0}
        decay={2}
      />
      {/* Its spill: a neutral, gently warm fill from above the front of the
          room, level with the middle, so it reaches the fronts of the cabinets
          on the left and the computer on the right (both face into the room),
          and the desk, rather than a warm hot spot near the wall. */}
      <LampPoint
        lamp="wall"
        at={[-0.05, 2.4, -1.9]}
        intensity={3.2}
        distance={0}
        decay={2}
        dimWithDossier
      />

      <group name="main-desk">
        <Model id="desk" />
        <Dossier />
        <DeskProps />
      </group>

      <ArchiveStation />

      <group name="evidence-board">
        <EvidenceBoard />
      </group>
    </group>
  );
}
