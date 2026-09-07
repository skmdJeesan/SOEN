
export const buildWebContainerTree = (flatTree) => {
    const root = {}

    const ensurePath = (parts) => {
        let node = root
        parts.forEach((part) => {
            if (!node[part]) node[part] = { directory: {} }
            node = node[part].directory
        })
        return node
    }

    Object.entries(flatTree).forEach(([path, entry]) => {
        const parts = path.split('/')
        const name = parts.pop()

        if (entry.type === 'folder') {
            ensurePath([...parts, name]) // creates the folder itself, even if empty
            return
        }

        const parentDir = ensurePath(parts)
        parentDir[name] = { file: { contents: entry.file?.contents || '' } }
    })

    return root
}