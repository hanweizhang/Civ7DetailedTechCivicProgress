/**
 * Provides helper method for calculating tech and civic detailed progress/cost.
 */

// Helper method for checking whether the node is tech or civic.
function getTreeNodeSystemType(nodeType) {
    const nodeInfo = GameInfo.ProgressionTreeNodes.lookup(nodeType);
    if (nodeInfo != null) {
        const treeInfo = GameInfo.ProgressionTrees.lookup(nodeInfo.ProgressionTree);
        if (treeInfo != null) {
            return treeInfo.SystemType;
        }
    }
    return "UNKNOWN";
}

/**
 * Return a progress/cost string for a given tech or civic tree node.
 * @param unifiedNode A unified tree node, containing following fields.
 *      nodeType: type/id of the node
 *      progress: current progress of the node
 *      progressPercentage: current progress percentage of the node
 *      unlocksByDepth: unlockByDepth array of the node
 *      isMastery: is it a mastery node or not
 */
export function getProgressCostStr(unifiedNode) {
    const player = Players.get(GameContext.localPlayerID);
    if (player == null) {
        return "";
    }
    // node.cost only returns the cost defined in the database, however the real cost is scaled based on difficulty.
    // Is Tech or Civic
    const systemType = getTreeNodeSystemType(unifiedNode.nodeType);
    let baseCost = 0;
    switch (systemType) {
        case "SYSTEM_TECH":
            baseCost = player.Techs ? player.Techs.getNodeCost(unifiedNode.nodeType) : 0
            break;
        case "SYSTEM_CULTURE":
            baseCost = player.Culture ? player.Culture.getNodeCost(unifiedNode.nodeType) : 0
            break;
    }
    // Below is a hack to calculate correct cost, which assumes there's only one level of mastery.
    // Hope Firaxis can provide a better interface later.
    if (unifiedNode.unlocksByDepth && unifiedNode.unlocksByDepth.length <= 0) {
        return;
    }
    const mainToMasteryRatio = 0.75;
    const mainDepth = unifiedNode.unlocksByDepth[0];
    let costValue = 0;
    let progressValue = 0;
    if (mainDepth.isCompleted) {
        // Main node is completed, the baseCost is mastery's cost.
        if (unifiedNode.isMastery) {
            costValue = baseCost;
            const masteryDepth = unifiedNode.unlocksByDepth[1];
            const progress = (unifiedNode.progress != null) ? unifiedNode.progress : Math.round(costValue * unifiedNode.progressPercentage / 100);
            progressValue = masteryDepth.isCompleted ? costValue : masteryDepth.isLocked ? 0 : progress;
        } else {
            // baseCost is mastery's cost after completion, use the ratio to calculate main's cost.
            costValue = Math.round(baseCost / mainToMasteryRatio);
            progressValue = costValue;
        }
    } else {
        if (unifiedNode.isMastery) {
            // Main node is not completed, the baseCost is main's cost, use the ratio to calculate mastery's cost.
            costValue = Math.round(baseCost * mainToMasteryRatio);
            const masteryDepth = unifiedNode.unlocksByDepth[1];
            const progress = (unifiedNode.progress != null) ? unifiedNode.progress : Math.round(costValue * unifiedNode.progressPercentage / 100);
            progressValue = masteryDepth.isCompleted ? costValue : masteryDepth.isLocked ? 0 : progress;
        } else {
            costValue = baseCost;
            const progress = (unifiedNode.progress != null) ? unifiedNode.progress : Math.round(costValue * unifiedNode.progressPercentage / 100);
            progressValue = mainDepth.isLocked ? 0 : progress;
        }
    }
    return progressValue + "/" + costValue;
}

/**
 * Return a html div that includes progress/cost string for a given tech or civic tree node.
 * @param unifiedNode A unified tree node, containing following fields.
 *      nodeType: type/id of the node
 *      progress: current progress of the node
 *      unlocksByDepth: unlockByDepth array of the node
 *      isMastery: is it a mastery node or not
 */
export function getProgressCostDiv(unifiedNode) {
    const progressCostContainer = document.createElement('div');
    progressCostContainer.classList.add('progress-cost-text', 'text-xs', 'font-body');
    progressCostContainer.textContent = getProgressCostStr(unifiedNode);
    return progressCostContainer;
}