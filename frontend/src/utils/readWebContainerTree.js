const IGNORED_DIRECTORIES = new Set(['node_modules', '.git'])

export const readWebContainerTree = async (webContainer, directory = '') => {
    const tree = {}
    const entries = await webContainer.fs.readdir(directory || '/', { withFileTypes: true })

    for (const entry of entries) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue

        const path = directory ? `${directory}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
            tree[path] = { type: 'folder' }
            Object.assign(tree, await readWebContainerTree(webContainer, path))
        } else {
            tree[path] = {
                type: 'file',
                file: { contents: await webContainer.fs.readFile(`/${path}`, 'utf8') }
            }
        }
    }

    return tree
}