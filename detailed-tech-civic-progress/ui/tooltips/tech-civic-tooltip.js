/**
 * Tech-Civic Tooltip
 * @copyright 2024-2025, Firaxis Gmaes
 * @description The tooltip for tech/civics information.
 */
import TooltipManager from '/core/ui/tooltips/tooltip-manager.js';
import TechTreeChooser from '/base-standard/ui/tech-tree-chooser/model-tech-tree-chooser.js';
import CultureTreeChooser from '/base-standard/ui/culture-tree-chooser/model-culture-tree-chooser.js';
import CultureTree from '/base-standard/ui/culture-tree/model-culture-tree.js';
import { TreeNodesSupport } from '/base-standard/ui/tree-grid/tree-support.js';
import TechTree from '/base-standard/ui/tech-tree/model-tech-tree.js';
import { RecursiveGetAttribute } from '/core/ui/utilities/utilities-dom.js';
import { AdvisorUtilities } from '/base-standard/ui/tutorial/tutorial-support.js';
// wltk START
import { getProgressCostDiv } from '../utilities/dtcp-utilities-tech-civic-progress.js';
// wltk END
/**
 * Get the player id of the player that has built a wonder
 *
 * @param wonderType The string type name or hash of the wonder
 */
const getWonderPlayerId = (wonderType) => {
    wonderType = typeof wonderType == 'string' ? Database.makeHash(wonderType) : wonderType;
    const players = Players.getEverAlive();
    for (const player of players) {
        const wonders = player.Constructibles?.getWonders(player.id);
        if (!wonders)
            continue;
        for (const wonder of wonders) {
            const constructible = Constructibles.getByComponentID(wonder);
            if (constructible?.type === wonderType && constructible?.complete) {
                return player.id;
            }
        }
    }
    return null;
};
class TechCivicTooltipType {
    constructor(model) {
        this.fragment = document.createDocumentFragment();
        this.tooltip = null;
        this.hoveredNodeID = null;
        this.model = model;
    }
    getHTML() {
        this.tooltip = document.createElement('fxs-tooltip');
        this.tooltip.classList.add('tech-civic-tooltip');
        this.tooltip.appendChild(this.fragment);
        return this.tooltip;
    }
    reset() {
        this.fragment = document.createDocumentFragment();
        while (this.tooltip?.hasChildNodes()) {
            this.tooltip.removeChild(this.tooltip.lastChild);
        }
    }
    isUpdateNeeded(target) {
        const nodeIDString = RecursiveGetAttribute(target, "node-id") ?? "";
        if (!nodeIDString) {
            this.hoveredNodeID = null;
            if (!this.fragment) {
                return true;
            }
            return false;
        }
        if (nodeIDString != this.hoveredNodeID || (nodeIDString == this.hoveredNodeID && !this.fragment)) {
            this.hoveredNodeID = nodeIDString;
            return true;
        }
        return false;
    }
    update() {
        if (!this.hoveredNodeID) {
            console.error("tech-civic-tooltip: Attempting to update Tech/Civic info tooltip, but unable to get selected node");
            return;
        }
        const node = this.model.findNode(this.hoveredNodeID);
        if (!node) {
            console.error("tech-civic-tooltip: Attempting to update Tech/Civic info tooltip, but unable to get selected node");
            return;
        }
        const headerContainer = document.createElement('div');
        headerContainer.classList.add("tech-civic-tooltip__header-container");
        const headerTooltip = document.createElement("div");
        headerTooltip.classList.add('mb-1', 'text-secondary', 'text-sm', 'font-title', 'uppercase', 'tracking-100');
        headerTooltip.setAttribute("data-l10n-id", node.name);
        const headerTooltipDivider = document.createElement("div");
        headerTooltipDivider.classList.add('w-64', 'h-2', 'img-ornament-thin-center-hex', 'bg-cover', '-my-1\\.25', 'my-2', 'self-center', 'my-4');
        headerContainer.appendChild(headerTooltip);
        // wltk START
        const progressCostContainer = getProgressCostDiv({
            nodeType: node.id,
            progress: node.percentComplete,
            unlocksByDepth: node.unlocksByDepth,
            isMastery: node.currentDepthUnlocked > 0
        });
        headerContainer.appendChild(progressCostContainer);
        // wltk END
        headerContainer.appendChild(headerTooltipDivider);
        const unlocksContainer = document.createElement("div");
        unlocksContainer.classList.add("tech-civic-tooltip__unlocks-container");
        node.unlocksByDepth?.forEach(unlockDepth => {
            // Display only current unlocks
            if (!unlockDepth.isCurrent) {
                return;
            }
            unlockDepth.unlocks.forEach(unlock => {
                const unlockItem = document.createElement("div");
                unlockItem.classList.add("unlock-item");
                const unlockItemIcon = document.createElement("div");
                unlockItemIcon.classList.add("unlock-item-icon");
                const unlockItemIconBG = document.createElement("div");
                unlockItemIconBG.classList.add("unlock-item-icon-bg");
                unlockItemIcon.appendChild(unlockItemIconBG);
                const unlockItemIconImg = document.createElement("img");
                unlockItemIconImg.classList.add("unlock-item-icon-img");
                unlockItemIconImg.setAttribute('src', unlock.icon);
                unlockItemIcon.appendChild(unlockItemIconImg);
                const unlockItemContent = document.createElement("div");
                unlockItemContent.classList.add("unlock-item-content", "text-xs");
                const unlockNameLine = document.createElement('div');
                unlockNameLine.classList.add('flex');
                const unlockItemName = document.createElement("div");
                unlockItemName.classList.add("unlock-item-name");
                unlockItemName.innerHTML = unlock.name;
                unlockNameLine.appendChild(unlockItemName);
                if (unlock.kind === "KIND_CONSTRUCTIBLE") {
                    const constructible = GameInfo.Constructibles.lookup(unlock.type);
                    if (constructible) {
                        const classTypeHash = Database.makeHash(constructible.ConstructibleClass);
                        if (classTypeHash === ConstructibleClasses.WONDER) {
                            const owningPlayerId = getWonderPlayerId(unlock.type);
                            if (owningPlayerId != null) {
                                const text = owningPlayerId === GameContext.localPlayerID ? "LOC_UI_TREE_WONDER_BUILT_BY_YOU" : "LOC_UI_TREE_WONDER_BUILT_BY_OTHER";
                                const unlockItemNamePlayerBuildText = document.createElement("div");
                                unlockItemNamePlayerBuildText.classList.add('ml-2', 'text-secondary', 'text-uppercase', 'text-xs', 'font-body', 'font-bold', 'tracking-25', 'flex', 'flex-auto');
                                unlockItemNamePlayerBuildText.setAttribute("data-l10n-id", text);
                                unlockNameLine.appendChild(unlockItemNamePlayerBuildText);
                            }
                        }
                    }
                }
                const unlockItemDesc = document.createElement("div");
                unlockItemDesc.innerHTML = unlock.description;
                unlockItemContent.appendChild(unlockNameLine);
                unlockItemContent.appendChild(unlockItemDesc);
                unlockItem.appendChild(unlockItemIcon);
                unlockItem.appendChild(unlockItemContent);
                unlocksContainer.appendChild(unlockItem);
            });
        });
        const gemsContainer = document.createElement("div");
        if (node.recommendations) {
            const headerTooltipDividerGems = document.createElement("div");
            headerTooltipDividerGems.classList.add("subheader__divider--center");
            gemsContainer.appendChild(headerTooltipDividerGems);
            const recommendationTooltipContent = AdvisorUtilities.createAdvisorRecommendationTooltip(node.recommendations);
            recommendationTooltipContent.classList.add("text-xs");
            gemsContainer.appendChild(recommendationTooltipContent);
        }
        this.fragment.appendChild(headerContainer);
        this.fragment.appendChild(unlocksContainer);
        this.fragment.appendChild(gemsContainer);
    }
    isBlank() {
        return false;
    }
}
class TreeTooltipType {
    constructor(model) {
        this.fragment = document.createDocumentFragment();
        this.tooltip = null;
        this.hoveredNodeID = null;
        this.level = null;
        this.model = model;
    }
    getHTML() {
        this.tooltip = document.createElement('fxs-tooltip');
        this.tooltip.classList.add('tech-tree-tooltip');
        this.tooltip.appendChild(this.fragment);
        return this.tooltip;
    }
    reset() {
        this.fragment = document.createDocumentFragment();
        while (this.tooltip?.hasChildNodes()) {
            this.tooltip.removeChild(this.tooltip.lastChild);
        }
    }
    isUpdateNeeded(target) {
        const nodeIDString = target.getAttribute("type");
        const level = target.getAttribute("level");
        let levelNum = 0;
        if (level) {
            levelNum = +level;
        }
        if (!nodeIDString) {
            this.hoveredNodeID = null;
            if (!this.fragment) {
                return true;
            }
            return false;
        }
        if (!level) {
            this.hoveredNodeID = null;
            if (!this.fragment) {
                return true;
            }
            return false;
        }
        if (nodeIDString != this.hoveredNodeID || (nodeIDString == this.hoveredNodeID && !this.fragment)) {
            this.hoveredNodeID = nodeIDString;
            return true;
        }
        if (levelNum != this.level || (levelNum == this.level && !this.fragment)) {
            this.level = levelNum;
            return true;
        }
        return false;
    }
    update() {
        if (!this.hoveredNodeID) {
            console.error("tech-tree-tooltip: Attempting to update Tech/Civic info tooltip, but unable to get selected node");
            return;
        }
        const node = this.model.findNode(this.hoveredNodeID);
        if (!node) {
            console.error("tech-tree-tooltip: Attempting to update Tech/Civic info tooltip, but unable to get selected node");
            return;
        }
        let index = 0;
        if (this.level) {
            index = this.level;
        }
        const headerContainer = document.createElement('div');
        headerContainer.classList.add("tech-tree-tooltip__header-container");
        const headerTooltip = document.createElement("div");
        headerTooltip.classList.add('mb-1', 'text-secondary', 'text-sm', 'font-title', 'uppercase', 'tracking-100');
        headerTooltip.setAttribute("data-l10n-id", index > 0 ? "LOC_UI_TREE_MASTERY" : node.name);
        const stateText = document.createElement("div");
        stateText.classList.add('mb-1', 'text-secondary', 'text-xs', 'font-body', 'tracking-100');
        const headerTooltipDivider = document.createElement("div");
        headerTooltipDivider.classList.add('w-64', 'h-2', 'img-ornament-thin-center-hex', 'bg-cover', '-my-1\\.25', 'my-2', 'self-center', 'my-4');
        headerContainer.appendChild(headerTooltip);
        // wltk START
        const progressCostContainer = getProgressCostDiv({
            nodeType: node.nodeType,
            progress: node.progress,
            unlocksByDepth: node.unlocksByDepth,
            isMastery: index > 0
        });
        headerContainer.appendChild(progressCostContainer);
        // wltk END
        headerContainer.appendChild(stateText);
        headerContainer.appendChild(headerTooltipDivider);
        const unlocksContainer = document.createElement("div");
        unlocksContainer.classList.add("tech-tree-tooltip__unlocks-container");
        if (!node.unlocksByDepth) {
            console.error("tech-tree-tooltip: No unlocks for node: " + this.hoveredNodeID);
            return;
        }
        const depth = node.unlocksByDepth[index];
        if (depth) {
            stateText.textContent = TreeNodesSupport.getUnlocksByDepthStateText(depth);
            depth.unlocks.forEach(unlock => {
                const unlockItem = document.createElement("div");
                unlockItem.classList.add("unlock-item");
                const unlockItemIcon = document.createElement("div");
                unlockItemIcon.classList.add("unlock-item-icon");
                const unlockItemIconBG = document.createElement("div");
                unlockItemIconBG.classList.add("unlock-item-icon-bg");
                unlockItemIcon.appendChild(unlockItemIconBG);
                const unlockItemIconImg = document.createElement("img");
                unlockItemIconImg.classList.add("unlock-item-icon-img");
                unlockItemIconImg.setAttribute('src', unlock.icon);
                unlockItemIcon.appendChild(unlockItemIconImg);
                const unlockItemContent = document.createElement("div");
                unlockItemContent.classList.add("unlock-item-content", "text-xs");
                const unlockNameLine = document.createElement('div');
                unlockNameLine.classList.add('flex');
                const unlockItemName = document.createElement("div");
                unlockItemName.classList.add("unlock-item-name");
                unlockItemName.innerHTML = unlock.name;
                unlockNameLine.appendChild(unlockItemName);
                if (unlock.kind === "KIND_CONSTRUCTIBLE") {
                    const constructible = GameInfo.Constructibles.lookup(unlock.type);
                    if (constructible) {
                        const classTypeHash = Database.makeHash(constructible.ConstructibleClass);
                        if (classTypeHash === ConstructibleClasses.WONDER) {
                            const owningPlayerId = getWonderPlayerId(unlock.type);
                            if (owningPlayerId != null) {
                                const text = owningPlayerId === GameContext.localPlayerID ? "LOC_UI_TREE_WONDER_BUILT_BY_YOU" : "LOC_UI_TREE_WONDER_BUILT_BY_OTHER";
                                const unlockItemNamePlayerBuildText = document.createElement("div");
                                unlockItemNamePlayerBuildText.classList.add('ml-2', 'text-secondary', 'text-uppercase', 'text-xs', 'font-body', 'font-bold', 'tracking-25', 'flex', 'flex-auto');
                                unlockItemNamePlayerBuildText.setAttribute("data-l10n-id", text);
                                unlockNameLine.appendChild(unlockItemNamePlayerBuildText);
                            }
                        }
                    }
                }
                const unlockItemDesc = document.createElement("div");
                unlockItemDesc.innerHTML = unlock.description;
                unlockItemContent.appendChild(unlockNameLine);
                unlockItemContent.appendChild(unlockItemDesc);
                unlockItem.appendChild(unlockItemIcon);
                unlockItem.appendChild(unlockItemContent);
                unlocksContainer.appendChild(unlockItem);
            });
        }
        this.fragment.appendChild(headerContainer);
        this.fragment.appendChild(unlocksContainer);
    }
    isBlank() {
        return false;
    }
}
TooltipManager.registerType('tech', new TechCivicTooltipType(TechTreeChooser));
TooltipManager.registerType('culture', new TechCivicTooltipType(CultureTreeChooser));
TooltipManager.registerType('culture-tree', new TreeTooltipType(CultureTree));
TooltipManager.registerType('tech-tree', new TreeTooltipType(TechTree));
//# sourceMappingURL=file:///base-standard/ui/tooltips/tech-civic-tooltip.js.map
