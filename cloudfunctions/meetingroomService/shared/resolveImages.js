/**
 * @file 云存储图片 URL 解析
 * @description 将 cloud:// fileID 转为 HTTPS 临时链接，供所有用户访问
 */

function normalizeImageItem(img, index) {
  if (typeof img === 'string') {
    const fileId = img.startsWith('cloud://') ? img : ''
    return { url: img, fileId, isDefault: index === 0 }
  }

  const url = img.url || ''
  const fileId = img.fileId || (url.startsWith('cloud://') ? url : '')
  return {
    url,
    fileId,
    isDefault: img.isDefault === true || index === 0
  }
}

async function resolveImageUrls(cloud, images) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return []
  }

  const normalized = images.map(normalizeImageItem)
  const cloudIndices = []
  const fileList = []

  normalized.forEach((item, index) => {
    if (item.url && item.url.startsWith('cloud://')) {
      cloudIndices.push(index)
      fileList.push(item.url)
    }
  })

  if (fileList.length === 0) {
    return normalized
  }

  try {
    const tempResult = await cloud.getTempFileURL({ fileList })
    if (tempResult.fileList) {
      tempResult.fileList.forEach((fileItem, idx) => {
        const imageIndex = cloudIndices[idx]
        if (fileItem.tempFileURL && fileItem.status === 0) {
          normalized[imageIndex].url = fileItem.tempFileURL
        } else {
          console.warn('[resolveImageUrls] 转换失败:', fileItem.fileID, fileItem.errMsg)
          normalized[imageIndex].url = ''
        }
      })
    }
  } catch (err) {
    console.error('[resolveImageUrls] 获取临时URL失败:', err)
  }

  return normalized
}

async function resolveRoomImages(cloud, room) {
  if (!room) return room
  const images = await resolveImageUrls(cloud, room.images)
  return { ...room, images }
}

async function resolveRoomsImages(cloud, rooms) {
  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
    return rooms || []
  }

  return Promise.all(rooms.map(room => resolveRoomImages(cloud, room)))
}

module.exports = {
  resolveImageUrls,
  resolveRoomImages,
  resolveRoomsImages
}
