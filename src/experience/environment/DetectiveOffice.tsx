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
 * The window on the left wall lets cool moonlight in. Filing cabinet,
 * suitcase and the evidence prop set are registered in the manifest and the
 * source library; they are simply not part of this frame. The right side is
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
