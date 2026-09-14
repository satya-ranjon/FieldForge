/* global jest */
module.exports = {
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images'
  },
  requestCameraPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: 'granted'
  })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: 'granted'
  })),
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [
      {
        uri: 'file:///data/user/0/app/cache/camera_photo.jpg',
        fileName: 'camera_photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024 * 100,
        width: 1080,
        height: 1920
      }
    ]
  })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [
      {
        uri: 'file:///data/user/0/app/cache/library_photo.jpg',
        fileName: 'library_photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024 * 100,
        width: 1080,
        height: 1920
      }
    ]
  }))
};
