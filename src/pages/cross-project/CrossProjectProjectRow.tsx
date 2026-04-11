import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import type {
  Member,
  Phase,
  Project,
  ProjectAssignment,
  ProjectEvent,
} from "../../types/project";
import { getProjectPm, type WeekSlot } from "../../utils/projectUtils";
import { formatMemberShortLabel } from "../members/memberFormUtils";
import {
  getProjectInfoClassName,
  getStickyProjectCellClassName,
  type CrossProjectToneIndex,
} from "./crossProjectViewHelpers";
import { CrossProjectTimelineCell } from "./CrossProjectTimelineCell";
import type { CrossProjectTimeScale } from "./useCrossProjectView";
import styles from "./CrossProjectViewPage.module.css";

interface StructureMember {
  assignment: ProjectAssignment;
  member: Member;
}

interface CrossProjectProjectRowProps {
  project: Project;
  timelineSlots: WeekSlot[];
  timeScale: CrossProjectTimeScale;
  isCompactMode: boolean;
  isStructureVisible: boolean;
  isGroupedByPrimarySystem: boolean;
  toneIndex: CrossProjectToneIndex;
  getProjectPhases: (projectId: string) => Phase[];
  getProjectEvents: (projectId: string) => ProjectEvent[];
  getProjectAssignments: (projectId: string) => ProjectAssignment[];
  getMemberById: (memberId: string) => Member | undefined;
  members: Member[];
}

function getStructureMembers(
  projectNumber: string,
  getProjectAssignments: CrossProjectProjectRowProps["getProjectAssignments"],
  getMemberById: CrossProjectProjectRowProps["getMemberById"],
) {
  return getProjectAssignments(projectNumber)
    .map((assignment) => ({
      assignment,
      member: getMemberById(assignment.memberId),
    }))
    .filter((item): item is StructureMember => item.member !== undefined)
    .sort((left, right) => {
      const responsibilityCompare =
        left.assignment.responsibility.localeCompare(
          right.assignment.responsibility,
          "ja",
        );

      if (responsibilityCompare !== 0) {
        return responsibilityCompare;
      }

      return left.member.name.localeCompare(right.member.name, "ja");
    });
}

export function CrossProjectProjectRow({
  project,
  timelineSlots,
  timeScale,
  isCompactMode,
  isStructureVisible,
  isGroupedByPrimarySystem,
  toneIndex,
  getProjectPhases,
  getProjectEvents,
  getProjectAssignments,
  getMemberById,
  members,
}: CrossProjectProjectRowProps) {
  const projectPhases = getProjectPhases(project.projectNumber);
  const projectEvents = getProjectEvents(project.projectNumber);
  const structureMembers = getStructureMembers(
    project.projectNumber,
    getProjectAssignments,
    getMemberById,
  );
  const pm = getProjectPm(project, members);

  return (
    <tr className={styles.projectRow}>
      <td
        className={getStickyProjectCellClassName({
          hasReportItems: project.hasReportItems,
          isGrouped: isGroupedByPrimarySystem,
          toneIndex,
          styles,
        })}
      >
        <div
          className={getProjectInfoClassName(isCompactMode, styles)}
          data-testid={`cross-project-project-info-${project.projectNumber}`}
        >
          <Link
            className={styles.projectLink}
            to={`/projects/${project.projectNumber}`}
          >
            {project.name}
          </Link>
          <div className={styles.metaLine}>{project.projectNumber}</div>
          {!isCompactMode ? (
            <>
              <div className={styles.metaLine}>
                {`PM: ${pm?.name ?? "未設定"}`}
              </div>
              <div className={styles.metaLine}>
                {`体制: ${structureMembers.length}名`}
              </div>
            </>
          ) : null}
          <StatusBadge status={project.status} />
          {isStructureVisible ? (
            <div className={styles.structureList}>
              {structureMembers.map(({ assignment, member }) => (
                <div
                  key={assignment.id}
                  className={styles.structureItem}
                  data-testid={`cross-project-structure-${project.projectNumber}-${assignment.id}`}
                >
                  <span className={styles.structureRole}>
                    {assignment.responsibility}
                  </span>
                  <span className={styles.structureMember}>
                    {formatMemberShortLabel(member)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </td>

      {timelineSlots.map((slot) => (
        <CrossProjectTimelineCell
          key={`${project.projectNumber}-${slot.index}`}
          project={project}
          projectEvents={projectEvents}
          projectPhases={projectPhases}
          slot={slot}
          timeScale={timeScale}
        />
      ))}
    </tr>
  );
}
