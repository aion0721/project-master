import type { Phase, Project, ProjectEvent } from "../../types/project";
import {
  getActiveEventsForRange,
  getActivePhasesForRange,
  getActivePhasesForWeek,
  isCurrentMonthSlot,
  isDateInWeekSlot,
  type WeekSlot,
} from "../../utils/projectUtils";
import {
  getTimelineCellClassName,
} from "./crossProjectViewHelpers";
import { getPhaseToneKey, type CrossProjectTimeScale } from "./useCrossProjectView";
import styles from "./CrossProjectViewPage.module.css";

interface CrossProjectTimelineCellProps {
  project: Project;
  projectPhases: Phase[];
  projectEvents: ProjectEvent[];
  slot: WeekSlot;
  timeScale: CrossProjectTimeScale;
}

export function CrossProjectTimelineCell({
  project,
  projectPhases,
  projectEvents,
  slot,
  timeScale,
}: CrossProjectTimelineCellProps) {
  const activePhases =
    timeScale === "month"
      ? getActivePhasesForRange(
          project,
          projectPhases,
          slot.startDate,
          slot.endDate,
        )
      : getActivePhasesForWeek(project, projectPhases, slot.startDate);
  const activeEvents =
    timeScale === "month"
      ? getActiveEventsForRange(
          project,
          projectEvents,
          slot.startDate,
          slot.endDate,
        )
      : projectEvents.filter((event) => event.week === slot.index);
  const busy = activePhases.length + activeEvents.length > 1;
  const isCurrentSlot =
    timeScale === "month"
      ? isCurrentMonthSlot(slot.startDate, slot.endDate)
      : isDateInWeekSlot(slot.startDate);

  return (
    <td
      className={getTimelineCellClassName({
        busy,
        isCurrentSlot,
        styles,
      })}
    >
      {activePhases.length > 0 || activeEvents.length > 0 ? (
        <div className={styles.phaseChipList}>
          {activePhases.map((phase) => (
            <span
              key={phase.id}
              className={`${styles.phaseChip} ${styles[getPhaseToneKey(phase.name)]}`}
            >
              {phase.name}
            </span>
          ))}
          {activeEvents.map((event) => (
            <span
              key={event.id}
              className={`${styles.phaseChip} ${styles.eventChip}`}
              data-testid={`cross-project-event-${project.projectNumber}-${event.id}`}
            >
              <span className={styles.eventChipTag}>EV</span>
              <span className={styles.eventChipText}>{event.name}</span>
            </span>
          ))}
        </div>
      ) : (
        <span className={styles.emptyCell}>-</span>
      )}
    </td>
  );
}
