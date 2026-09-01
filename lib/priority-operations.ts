import type { Priority, PriorityTier, Workspace } from "./domain";

export function renamePriority(workspace: Workspace, id: string, title: string): Workspace {
  const trimmed = title.trim();
  if (!trimmed) return workspace;
  return {
    ...workspace,
    priorities: workspace.priorities.map((priority) => priority.id === id ? { ...priority, title: trimmed } : priority)
  };
}

export function deletePriority(workspace: Workspace, id: string): Workspace {
  return { ...workspace, priorities: workspace.priorities.filter((priority) => priority.id !== id) };
}

export function movePriority(workspace: Workspace, id: string, tier: PriorityTier): Workspace {
  return {
    ...workspace,
    priorities: workspace.priorities.map((priority) => priority.id === id ? { ...priority, tier } : priority)
  };
}

export function reorderPriority(workspace: Workspace, id: string, direction: -1 | 1): Workspace {
  const index = workspace.priorities.findIndex((priority) => priority.id === id);
  if (index < 0) return workspace;
  const priority = workspace.priorities[index];
  const sameTierIndices = workspace.priorities
    .map((item, itemIndex) => item.tier === priority.tier ? itemIndex : -1)
    .filter((itemIndex) => itemIndex >= 0);
  const tierPosition = sameTierIndices.indexOf(index);
  const targetTierPosition = tierPosition + direction;
  if (targetTierPosition < 0 || targetTierPosition >= sameTierIndices.length) return workspace;

  const targetIndex = sameTierIndices[targetTierPosition];
  const priorities = [...workspace.priorities];
  [priorities[index], priorities[targetIndex]] = [priorities[targetIndex], priorities[index]];
  return { ...workspace, priorities };
}

export function priorityCounts(priorities: Priority[]) {
  return priorities.reduce<Record<PriorityTier, number>>((counts, priority) => {
    counts[priority.tier] += 1;
    return counts;
  }, { must: 0, should: 0, could: 0 });
}
