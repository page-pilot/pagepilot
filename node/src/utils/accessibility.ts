import { Page } from 'playwright';

interface AXNode {
    role: string;
    name?: string;
    value?: string | number;
    description?: string;
    keyshortcuts?: string;
    focused?: boolean;
    disabled?: boolean;
    children?: AXNode[];
}

/**
 * Fetches the specific accessibility snapshot that PagePilot expects,
 * using CDP since Playwright removed page.accessibility.
 */
export async function getAccessibilityTree(page: Page): Promise<AXNode | null> {
    try {
        const client = await page.context().newCDPSession(page);
        const { nodes } = await client.send('Accessibility.getFullAXTree');

        // Map to store nodes by ID for tree construction
        const nodeMap = new Map<string, any>();
        let root: any = null;

        // 1. Create all nodes first
        for (const node of nodes) {
            const role = node.role ? node.role.value : 'generic';
            const name = node.name ? node.name.value : undefined;
            const description = node.description ? node.description.value : undefined;
            const value = node.value ? node.value.value : undefined;

            // Simplified node object expected by AI
            const axNode: AXNode = {
                role,
                name: name || undefined,
                value: value || undefined,
                description: description || undefined,
                children: []
            };

            // Clean up undefineds
            if (!axNode.name) delete axNode.name;
            if (!axNode.value) delete axNode.value;
            if (!axNode.description) delete axNode.description;

            nodeMap.set(node.nodeId, { ...axNode, _raw: node });
        }

        // 2. Build Tree
        for (const node of nodes) {
            const axNode = nodeMap.get(node.nodeId);
            if (!axNode) continue;

            if (node.parentId) {
                const parent = nodeMap.get(node.parentId);
                if (parent) {
                    parent.children.push(axNode);
                }
            } else {
                if (!root) root = axNode; // First node without parent is essentially root
            }
        }

        // Cleanup internal properties
        for (const node of nodeMap.values()) {
            delete node._raw;
            if (node.children.length === 0) {
                delete node.children;
            }
        }

        return root;

    } catch (error) {
        console.error("Failed to get CDP accessibility tree:", error);
        return null;
    }
}
