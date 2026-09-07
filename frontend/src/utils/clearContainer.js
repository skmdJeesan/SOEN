
export const clearContainer = async (webContainer) => {
    const entries = await webContainer.fs.readdir('.')
    await Promise.all(
        entries.map((entry) => webContainer.fs.rm(entry, { recursive: true, force: true }))
    )
}