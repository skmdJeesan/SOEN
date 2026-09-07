
export const collectDescendantPaths = (fileTree, targetPath) => {
    return Object.keys(fileTree).filter(
        (path) => path === targetPath || path.startsWith(`${targetPath}/`)
    )
}