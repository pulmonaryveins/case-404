import type { Project } from "../data/projects";

/** A project's cover: its first screenshot, else its first video's poster, else its video. */
export function cover(project: Project) {
  const shot = project.screenshots?.[0]?.src ?? project.videos?.[0]?.poster;
  if (shot) return { kind: "image" as const, src: shot };
  if (project.video) return { kind: "video" as const, src: project.video };
  return null;
}
