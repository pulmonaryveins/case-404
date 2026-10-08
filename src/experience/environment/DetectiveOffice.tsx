import { Model } from "../models/Model";
import { DeskProps } from "./DeskProps";
import { Dossier } from "./Dossier";
import { EvidenceBoard } from "./EvidenceBoard";
import { RoomShell } from "./RoomShell";

/**
 * Opening composition: a dark room, the working desk, and the board — read
 * as one workspace from the front.
 *
 * Window, filing cabinet, suitcase and the evidence prop set are still
 * registered in the manifest and the source library; they are simply not
 * part of this frame.
 */
export function DetectiveOffice() {
  return (
    <group name="detective-office">
      <RoomShell />

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
