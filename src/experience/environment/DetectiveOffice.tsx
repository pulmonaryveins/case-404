import { Model } from "../models/Model";
import { DeskProps } from "./DeskProps";
import { ArchiveStation } from "./ArchiveStation";
import { Carpet } from "./Carpet";
import { MusketDisplay } from "./MusketDisplay";
import { WallSconces } from "./WallSconces";
import { LampPoint } from "./LampSpot";
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
      {/* An old musket on two brass pegs above the board, as a display piece. */}
      <MusketDisplay />
      {/* The sconces' bounce: the light they throw comes back off the walls
          and ceiling as a soft fill, out in the room (so it makes no pool on
          any wall), one on each side, a little in from the sconces so the
          board stays readable: the merch cabinets and mannequin on the left,
          the computer, shelf and design posters on the right, the desk between.
          Dark when the lamps are off, leaving the moonlight and its window
          shadows as they were. */}
      {([-1, 1] as const).map((side) => (
        <LampPoint
          key={side}
          lamp="wall"
          at={[side * 1.0, 2.3, -2.65]}
          // A little more on the left, where the cabinet fronts face away.
          intensity={side < 0 ? 1.8 : 1.5}
          distance={0}
          decay={2}
          dimWithDossier
        />
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
