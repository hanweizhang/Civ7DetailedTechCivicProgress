// Hook up to original tree-card component. Inspired by @craimasjien.

import { getProgressCostDiv } from '../utilities/dtcp-utilities-tech-civic-progress.js';

export class DTCP_TreeCardDecorator {

    constructor(component) {
        this.component = component;
        this.componentRoot = component.Root;

        this.observerConfig = { attributes: true, attributeFilter: ['unlocks-by-depth', 'progress'] };
        this.observer = new MutationObserver(this.onAttributeMutated.bind(this));
    }

    beforeAttach() {
        this.observer.observe(this.componentRoot, this.observerConfig);
    }

    afterAttach() {
    }

    beforeDetach() {
    }

    afterDetach() {
        this.observer.disconnect();
    }

    onAttributeMutated(mutationList, _observer) {
        for(let mutation of mutationList) {
            if (mutation.type === 'attributes') {
                // nodeType
                const type = Number.parseInt(this.component.type);
                // progress
                const progressPercentage = this.component.progress;
                // unlocksByDepth
                const unlocksByDepth = this.component.unlocksByDepth;
                // Update all cards
                const cards = mutation.target.querySelectorAll('.tree-card-hitbox');
                for (let card of cards) {
                    const attrLevel = card.getAttribute('level');
                    const level = attrLevel != null ? +attrLevel : 0;
                    const unifiedNode = {
                        nodeType: type,
                        progressPercentage: progressPercentage,
                        unlocksByDepth: unlocksByDepth,
                        isMastery: level > 0
                    };
                    // Modify the UI
                    let progressCostContainer = card.querySelector('.progress-cost-text');
                    if (progressCostContainer == null) {
                        progressCostContainer = getProgressCostDiv(unifiedNode);
                        progressCostContainer.classList.add('grow', 'mx-4');
                    } else {
                        progressCostContainer.textContent = getProgressCostStr(unifiedNode);
                    }
                    const nameText = card.querySelector('.tree-card-name');
                    // When the card is completed, nameText will have a padding pr-6. Remove it for better alignment.
                    nameText.classList.remove("pr-6");
                    nameText.insertAdjacentElement('afterend', progressCostContainer);
                }
            }
        }
    }
}

Controls.decorate('tree-card', (component) => new DTCP_TreeCardDecorator(component));