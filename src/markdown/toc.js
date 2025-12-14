export function buildToc(headings) {
    return headings.map(h => ({
        id: h.id,
        text: h.text,
        level: h.level,
    }))
}
