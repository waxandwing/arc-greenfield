import type { Workspace } from "./domain";
import type { ArcHelpTopicId } from "./arc-help-guidance";

function exploredIds(workspace: Workspace): ArcHelpTopicId[] {
  return (workspace.preferences.exploredHelpIds ?? []) as ArcHelpTopicId[];
}

export function hasExploredHelp(workspace: Workspace, topicId: ArcHelpTopicId): boolean {
  return exploredIds(workspace).includes(topicId);
}

export function shouldShowFirstTimeHelp(workspace: Workspace, topicId: ArcHelpTopicId): boolean {
  return workspace.preferences.firstTimeHelpEnabled !== false && !hasExploredHelp(workspace, topicId);
}

export function markHelpExplored(workspace: Workspace, topicId: ArcHelpTopicId): Workspace {
  const explored = new Set(exploredIds(workspace));
  explored.add(topicId);
  return {
    ...workspace,
    preferences: {
      ...workspace.preferences,
      exploredHelpIds: [...explored]
    }
  };
}

export function resetHelpExploration(workspace: Workspace): Workspace {
  return {
    ...workspace,
    preferences: {
      ...workspace.preferences,
      exploredHelpIds: [],
      exploreWelcomeDismissed: false
    }
  };
}

export function setHelpMarksVisible(workspace: Workspace, visible: boolean): Workspace {
  return {
    ...workspace,
    preferences: {
      ...workspace.preferences,
      helpMarksVisible: visible
    }
  };
}

export function setFirstTimeHelpEnabled(workspace: Workspace, enabled: boolean): Workspace {
  return {
    ...workspace,
    preferences: {
      ...workspace.preferences,
      firstTimeHelpEnabled: enabled
    }
  };
}

export function dismissExploreWelcome(workspace: Workspace): Workspace {
  return {
    ...workspace,
    preferences: {
      ...workspace.preferences,
      exploreWelcomeDismissed: true
    }
  };
}
