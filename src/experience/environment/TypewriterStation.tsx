import { Model } from "../models/Model";
import { DeskLampLight } from "../lighting/DeskLampLight";
import { DeskProp } from "./DeskProps";
import { Gramophone } from "./Gramophone";
import { MedievalPaintings } from "./MedievalPaintings";
import { ResumePrint } from "./ResumePrint";
import { DESK_TOP, STATION_SLIDE, TYPEWRITER_STATION } from "./worldAnchors";

/**
 * The last desk: the archive station's corner, mirrored into the back-left
 * corner, against the angled wall there (RoomShell's left corner wall). The
 * same desk and banker's lamp; on it, the typewriter in the middle, which
 * types out the subject's resume when the case is closed (ResumePrint), and
 * the gramophone at the far end. Everything below is in the station's own
 * frame (desk centre at the origin, its front toward +Z).
 */
/**
 * Footprint centres (station frame, x/z) and turns: the lamp at the right
 * end, beside the cabinet, as on the archive desk; the gramophone at the left
 * end, turned toward the middle.
 */
const LAMP_AT: [number, number] = [0.52, -0.15];
const LAMP_YAW = 5.5;
const LAMP_AIM: [number, number, number] = [0.02, -0.12, 0.4];
const TYPEWRITER_AT: [number, number] = [0.02, 0.0];
const TYPEWRITER_YAW = 0;
const GRAMOPHONE_AT: [number, number] = [-0.56, -0.14];
const GRAMOPHONE_YAW = Math.PI + 0.4;
/** A little smaller than on its own: it shares the desk with the typewriter. */
const GRAMOPHONE_SIZE = 0.72;

export function TypewriterStation() {
  return (
    <group
      name="typewriter-station"
      position={TYPEWRITER_STATION.position}
      rotation={[0, TYPEWRITER_STATION.yaw, 0]}
    >
      <Model id="archiveDesk" />
      {/* On the wall, not the desk: back to the wall's own centre (the desk is
          slid toward the side wall, its own -X). */}
      <group position={[STATION_SLIDE, 0, 0]}>
        <MedievalPaintings />
      </group>
      <DeskProp id="deskLamp" lamp="typewriter" at={LAMP_AT} yaw={LAMP_YAW}>
        <DeskLampLight lamp="typewriter" shadowSize={512} strength={0.6} aim={LAMP_AIM} />
      </DeskProp>
      <DeskProp id="typewriter" at={TYPEWRITER_AT} yaw={TYPEWRITER_YAW}>
        <ResumePrint />
      </DeskProp>
      <Gramophone
        position={[GRAMOPHONE_AT[0], DESK_TOP, GRAMOPHONE_AT[1]]}
        yaw={GRAMOPHONE_YAW}
        size={GRAMOPHONE_SIZE}
      />
    </group>
  );
}
