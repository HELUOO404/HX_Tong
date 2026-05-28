/**
 * @file 权限标签水合
 */

async function hydratePermissionTags(db, permissionTags) {
  let tags = permissionTags || []
  if (!Array.isArray(tags) || tags.length === 0) return []

  const tagsNeedingPermissions = tags.filter(
    t => !t.permissions || Object.keys(t.permissions).length === 0
  )
  if (tagsNeedingPermissions.length === 0) return tags

  try {
    const { data: allTags } = await db.collection('permission_tags').get()
    const tagMap = {}
    allTags.forEach(t => {
      tagMap[t._id] = t
      if (t.tagId) tagMap[t.tagId] = t
    })

    return tags.map(tag => {
      const key = tag.tagId || tag._id
      if ((!tag.permissions || Object.keys(tag.permissions).length === 0) && key && tagMap[key]) {
        const source = tagMap[key]
        return {
          ...tag,
          tagName: tag.tagName || tag.name || source.tagName || source.name || '',
          role: tag.role || source.role || '',
          permissions: source.permissions || {}
        }
      }
      return tag
    })
  } catch (e) {
    console.error('[hydratePermissionTags] 水合失败:', e)
    return tags
  }
}

module.exports = { hydratePermissionTags }
