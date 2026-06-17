import { type CSSProperties, useMemo, useRef } from "react";
import { cn } from "@/src/lib/cn";
import type { ActivityPathGraphDayProps } from "./activity-path-graph/activity-path-graph.types";
import { Select } from "@/src/ui";
import { buildGraphEdges, buildEdgePath, buildGraphNodes, buildLaneXByPathId, buildPathMetaForDay, buildVisibleLanePathIds } from "./activity-path-graph/activity-path-graph.graph";
import { buildFallbackGraphLayout, useRenderedGraphLayout } from "./activity-path-graph/activity-path-graph.layout";
import {
  anchorClassName,
  dotClassName,
  dotHitTargetSize,
  dotSize,
  graphClassName,
  pathSelectClassName,
  selectedDotClassName,
} from "./activity-path-graph/activity-path-graph.styles";

export function ActivityPathGraphDay({
  canEdit,
  day,
  dayLabel,
  graphWidth,
  graphItems,
  pathOptions,
  rowItems,
  selectedItemId,
  onMoveItemToPath,
  onSelectItem,
}: ActivityPathGraphDayProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const pathMetaById = buildPathMetaForDay(day, graphItems, pathOptions);
  const pathIds = buildVisibleLanePathIds(rowItems);
  const laneXByPathId = buildLaneXByPathId(pathIds, graphWidth);
  const fallbackLayout = useMemo(() => buildFallbackGraphLayout(rowItems), [rowItems]);
  const measuredLayout = useRenderedGraphLayout(graphRef, day, rowItems, fallbackLayout);
  const graphLayout = measuredLayout ?? fallbackLayout;
  const graphNodes = buildGraphNodes(rowItems, pathMetaById, laneXByPathId, graphWidth, graphLayout.itemYById);
  const graphEdges = buildGraphEdges(graphNodes, graphWidth, graphLayout.startY, graphLayout.endY);

  return (
    <div ref={graphRef} className={graphClassName} role="group" aria-label={`Activity path graph for ${dayLabel}`} style={{ height: fallbackLayout.height }}>
      <svg
        className="pointer-events-none absolute left-0 top-0 z-[1] w-full overflow-visible"
        viewBox={`0 0 ${graphWidth} ${graphLayout.height}`}
        aria-hidden="true"
        style={{ height: graphLayout.height }}
      >
        {graphEdges.map((edge) => (
          <path
            key={edge.id}
            className={cn("activity-path-graph-line", edge.dashed && "activity-path-graph-line--dashed")}
            d={buildEdgePath(edge)}
            data-from-x={edge.from.x}
            data-from-y={edge.from.y}
            data-to-x={edge.to.x}
            data-to-y={edge.to.y}
            fill="none"
            stroke={edge.color}
            strokeDasharray={edge.dashed ? "3 4" : undefined}
            strokeLinecap="round"
            strokeOpacity={0.5}
            strokeWidth={2}
          />
        ))}
      </svg>
      <span aria-label={`Start of ${dayLabel}`} className={anchorClassName} role="img" style={{ top: graphLayout.startY - dotSize / 2 }} />
      <span
        aria-label={`End of ${dayLabel}`}
        className={anchorClassName}
        role="img"
        style={{ top: graphLayout.endY - dotSize / 2 }}
      />
      {graphNodes.map(({ color, item, pathName, sourcePathId, x, y }) => (
        <span key={item.id}>
          <button
            aria-label={`${item.activity} on ${pathName}`}
            className={cn(dotClassName, selectedItemId === item.id && selectedDotClassName)}
            draggable={canEdit}
            style={{ "--activity-path-node-color": color, left: x, top: y - dotHitTargetSize / 2 } as CSSProperties}
            title={`${item.activity} (${pathName})`}
            type="button"
            onClick={() => onSelectItem(item.id)}
            onDragStart={(event) => {
              if (!canEdit) return;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", item.id);
            }}
          />
          <Select
            aria-label={`Move ${item.activity} to path`}
            className={pathSelectClassName}
            disabled={!canEdit || !onMoveItemToPath}
            value={sourcePathId}
            onChange={(event) => onMoveItemToPath?.(item.id, event.target.value)}
          >
            {[...pathMetaById].map(([id, option]) => (
              <option key={id} value={id}>{option.name}</option>
            ))}
          </Select>
        </span>
      ))}
    </div>
  );
}
