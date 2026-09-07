
export const writeEntryToContainer = async (webContainer, path, entry) => {
    if (entry.type === 'folder') {
        await webContainer.fs.mkdir(path, { recursive: true })
    } else {
        const dir = path.split('/').slice(0, -1).join('/')
        if(dir) await webContainer.fs.mkdir(dir, { recursive: true })
        await webContainer.fs.writeFile(path, entry.file?.contents || '')
    }
}