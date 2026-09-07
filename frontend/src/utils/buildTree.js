
export const buildTree = (flatTree) => {
    const root = { children: {} }
    Object.keys(flatTree).forEach((path) => {
        const parts = path.split('/')
        let node = root
        parts.forEach((part, i) => {
            const currentPath = parts.slice(0, i + 1).join('/')
            if (!node.children[part]) {
                node.children[part] = {
                    name: part,
                    path: currentPath,
                    type: flatTree[currentPath]?.type || 'folder',
                    children: {}
                }
            }
            node = node.children[part]
        })
    })
    return root.children
}