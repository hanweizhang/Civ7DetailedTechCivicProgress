// Hook up to original tree-chooser-item component. Inspired by @craimasjien.

import { getProgressCostDiv } from '../utilities/utilities-tech-civic-progress.js';

export class DTCP_TreeChooserItemDecorator {

    constructor(component) {
        this.component = component;
        this.componentRoot = component.Root;
    }

    beforeAttach() {
        const node = this.component.treeChooserNode;
        const chooserItemNode = this.componentRoot.querySelector('.tree-chooser-item__node');
        const turnsContainer = chooserItemNode.firstChild;
        if (turnsContainer != null) {
            const unifiedNode = {
                nodeType: node.id,
                progress: node.percentComplete,
                unlocksByDepth: node.unlocksByDepth,
                isMastery: node.currentDepthUnlocked > 0
            };
            const progressCostContainer = getProgressCostDiv(unifiedNode);
            turnsContainer.firstChild.insertAdjacentElement('afterend', progressCostContainer);
        }
    }

    afterAttach() {
    }

    beforeDetach() {
    }

    afterDetach() {
    }
}

Controls.decorate('tree-chooser-item', (component) => new DTCP_TreeChooserItemDecorator(component));