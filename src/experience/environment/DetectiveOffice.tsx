import { Model } from "../models/Model";
import { RoomShell } from "./RoomShell";

/**
 * Phase 1B.1 opening composition: a dark room, the desk, and the board —
 * read as one workspace from the front. Everything else is deliberately
 * absent.
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
        <Model id="dossierPrimary" />
      </group>

      <group name="evidence-board">
        <Model id="investigationBoard" />
      </group>
    </group>
  );
}
