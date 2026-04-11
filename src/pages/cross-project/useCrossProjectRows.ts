import { useMemo } from "react";
import type { Project } from "../../types/project";
import {
  getScopedProjects,
  getToneIndex,
  type CrossProjectToneIndex,
} from "./crossProjectViewHelpers";

export interface CrossProjectGroupRow {
  type: "group";
  label: string;
  toneIndex: CrossProjectToneIndex;
}

export interface CrossProjectProjectRowData {
  type: "project";
  project: Project;
  toneIndex: CrossProjectToneIndex;
}

export type CrossProjectRow = CrossProjectGroupRow | CrossProjectProjectRowData;

interface UseCrossProjectRowsParams {
  projects: Project[];
  selectedSystemId: string;
  systemNameById: Map<string, string>;
  isGroupedByPrimarySystem: boolean;
}

export function useCrossProjectRows({
  projects,
  selectedSystemId,
  systemNameById,
  isGroupedByPrimarySystem,
}: UseCrossProjectRowsParams) {
  const scopedProjects = useMemo(
    () => getScopedProjects(projects, selectedSystemId),
    [projects, selectedSystemId],
  );

  const rows = useMemo<CrossProjectRow[]>(() => {
    if (!isGroupedByPrimarySystem) {
      return scopedProjects.map((project) => ({
        type: "project",
        project,
        toneIndex: 0,
      }));
    }

    const groups = new Map<string, Project[]>();

    scopedProjects.forEach((project) => {
      const primarySystemId = project.relatedSystemIds?.[0];
      const groupLabel = primarySystemId
        ? `${primarySystemId} / ${systemNameById.get(primarySystemId) ?? primarySystemId}`
        : "未設定";
      const projectsInGroup = groups.get(groupLabel) ?? [];
      projectsInGroup.push(project);
      groups.set(groupLabel, projectsInGroup);
    });

    return [...groups.entries()]
      .sort((left, right) => left[0].localeCompare(right[0], "ja"))
      .flatMap(([label, projectsInGroup], groupIndex) => {
        const toneIndex = getToneIndex(groupIndex);
        const sortedProjects = [...projectsInGroup].sort((left, right) =>
          left.name.localeCompare(right.name, "ja"),
        );

        return [
          { type: "group", label, toneIndex } as const,
          ...sortedProjects.map((project) => ({
            type: "project" as const,
            project,
            toneIndex,
          })),
        ];
      });
  }, [isGroupedByPrimarySystem, scopedProjects, systemNameById]);

  return {
    rows,
    scopedProjects,
  };
}
