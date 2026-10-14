import { Model } from "../models/Model";
import { DeskProps } from "./DeskProps";
import { ArchiveStation } from "./ArchiveStation";
import { Carpet } from "./Carpet";
import { RifleDisplay } from "./RifleDisplay";
import { WallSconces } from "./WallSconces";
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
      {/* The wall lights: a brass twin sconce either side of the board (on
          from the start, switched together, click either one). */}
      <WallSconces />
      {/* An M1 Garand on two brass pegs above the board, as a display piece. */}
      <RifleDisplay />
      {/* Its picture light: a narrow soft spot from just above and in front,
          switched with the wall lamps, so the rifle reads instead of sitting
          as a silhouette above the board. Shadowless. */}
      <LampSpot
        lamp="wall"
        at={[0, 2.6, -3.3]}
        aim={[0, 2.22, -3.74]}
        intensity={0.8}
        angle={0.55}
        distance={0}
        decay={2}
      />
      {/* Each sconce's light: a raking spot on its half of the board, from
          just above and in front of the sconce (light from right at the wall
          would only graze it), and a soft spill out over its side of the room:
          the merch cabinets and mannequin on the left, the computer, shelf and
          design posters on the right, and between them the desk. All fall off
          as real light does (inverse square), with no cut-off radius (that
          showed as a curved edge across the desk and floor), and are dark
          when the lamps are off, leaving the moonlight and its window shadows
          as they were. */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <LampSpot
            lamp="wall"
            at={[side * 1.0, 2.1, -3.2]}
            aim={[side * 0.55, 1.45, -3.77]}
            intensity={2.2}
            angle={1.0}
            distance={0}
            decay={2}
          />
          <LampPoint
            lamp="wall"
            at={[side * 1.4, 2.35, -2.5]}
            // A little more on the left, where the cabinet fronts face away.
            intensity={side < 0 ? 1.8 : 1.5}
            distance={0}
            decay={2}
            dimWithDossier
          />
        </group>
      ))}

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
