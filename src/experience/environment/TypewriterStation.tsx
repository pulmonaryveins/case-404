import { Model } from "../models/Model";
import { DeskLampLight } from "../lighting/DeskLampLight";
import { DeskProp } from "./DeskProps";
import { LandscapePainting } from "./LandscapePainting";
import { LoosePapers, type Sheet } from "./LoosePapers";
import { ResumePrint } from "./ResumePrint";
import { TYPEWRITER_STATION } from "./worldAnchors";

/**
 * The last desk: the archive station's corner, mirrored into the back-left
 * corner, against the angled wall there (RoomShell's left corner wall), an old
 * landscape hung above it. The same desk and banker's lamp; on it, the
 * typewriter in the middle, which types out the subject's resume when the
 * case is closed (ResumePrint), the lamp at the left end, a globe at the
 * right, and the case's bagged evidence on loose typed sheets in front of
 * them. Everything below is in the station's own frame (desk centre at the
 * origin, its front toward +Z).
 */

/**
 * The manifest turns the desk model 0.035 rad past square (the main desk's
 * slight turn to the camera); against a wall that leaves one back corner ~5 cm
 * further off it than the other, so it is turned back here.
 */
const DESK_SQUARE = -0.035;

/**
 * Footprint centres (station frame, x/z) and turns, each end turned toward the
 * middle: the lamp at the left end (the archive desk's lamp mirrored), its
 * light aimed in toward the typewriter; the globe at the right, its brass
 * meridian turned to the room.
 */
const LAMP_AT: [number, number] = [-0.52, -0.15];
const LAMP_YAW = Math.PI * 2 - 5.5;
const LAMP_AIM: [number, number, number] = [0.1, -0.12, 0.5];
const TYPEWRITER_AT: [number, number] = [0.02, 0.0];
const TYPEWRITER_YAW = 0;
const GLOBE_AT: [number, number] = [0.55, -0.16];
const GLOBE_YAW = -0.5;

/**
 * Loose typed sheets in the two front corners, clear of the typewriter (x
 * -0.19 to 0.23, z to 0.25) and of the lamp's and globe's bases; the
 * right-hand pair overlaps (`level` stacks them).
 */
const SHEETS: Sheet[] = [
  { at: [-0.5, 0.2], yaw: 0.22, kind: "log", level: 1 },
  { at: [0.44, 0.21], yaw: -0.3, kind: "custody", level: 1 },
  { at: [0.6, 0.25], yaw: 0.12, kind: "log", level: 2 },
];

/**
 * Three evidence bags on the sheets, long side along the desk: two overlapping
 * at the left (the second resting on the first), one at the right. `lift`
 * clears the sheets under them. A bag is ~1.2 cm at its puffed middle but
 * thin at the edges, so the one on top sits lower than a full bag's height.
 */
const BAG_ON_PAPER = 0.002;
const BAG_THICKNESS = 0.007;
const BAGS: { at: [number, number]; yaw: number; lift: number }[] = [
  { at: [-0.48, 0.22], yaw: Math.PI / 2 + 0.12, lift: BAG_ON_PAPER },
  { at: [-0.38, 0.27], yaw: Math.PI / 2 - 0.25, lift: BAG_ON_PAPER + BAG_THICKNESS },
  { at: [0.5, 0.23], yaw: Math.PI / 2 + 0.28, lift: BAG_ON_PAPER },
];

export function TypewriterStation() {
  return (
    <group
      name="typewriter-station"
      position={TYPEWRITER_STATION.position}
      rotation={[0, TYPEWRITER_STATION.yaw, 0]}
    >
      <group rotation={[0, DESK_SQUARE, 0]}>
        <Model id="archiveDesk" />
      </group>
      <DeskProp id="deskLamp" lamp="typewriter" at={LAMP_AT} yaw={LAMP_YAW}>
        <DeskLampLight lamp="typewriter" shadowSize={512} strength={0.6} aim={LAMP_AIM} />
      </DeskProp>
      <DeskProp id="typewriter" at={TYPEWRITER_AT} yaw={TYPEWRITER_YAW}>
        <ResumePrint />
      </DeskProp>
      <DeskProp id="woodenGlobe" at={GLOBE_AT} yaw={GLOBE_YAW} />
      <LandscapePainting />
      <LoosePapers sheets={SHEETS} />
      {BAGS.map((bag, i) => (
        <DeskProp key={i} id="evidenceBag" at={bag.at} yaw={bag.yaw} lift={bag.lift} />
      ))}
    </group>
  );
}
