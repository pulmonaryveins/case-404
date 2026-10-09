import { Model } from "../models/Model";
import { DeskProps } from "./DeskProps";
import { Dossier } from "./Dossier";
import { EvidenceBoard } from "./EvidenceBoard";
import { MoonWindow } from "./MoonWindow";
import { RoomShell } from "./RoomShell";

/**
 * Opening composition: a dark room, the working desk, and the board — read
 * as one workspace from the front.
 *
 * The window on the left wall lets cool moonlight in. The right side is
 * reserved for the IBM PCjr evidence station (on hold).
 */
export function DetectiveOffice() {
  return (
    <group name="detective-office">
      <RoomShell />
      <MoonWindow />

      <group name="main-desk">
        <Model id="desk" />
        <Dossier />
        <DeskProps />
      </group>

      <group name="evidence-board">
        <EvidenceBoard />
      </group>
    </group>
  );
}
