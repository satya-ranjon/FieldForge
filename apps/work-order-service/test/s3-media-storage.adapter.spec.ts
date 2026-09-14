import { S3MediaStorageAdapter } from '../src/modules/deliverables/s3-media-storage.adapter';
import { DeliverableType } from '@fieldforge/contracts';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3MediaStorageAdapter (ISSUE-003A)', () => {
  let mockS3Client: { send: jest.Mock };
  const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client = {
      send: jest.fn()
    };
    mockGetSignedUrl.mockResolvedValue('https://s3.amazonaws.com/test-signed-url');
  });

  describe('configuration & fail-fast startup', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('fails fast at startup if AWS_REGION is missing in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.AWS_REGION;
      delete process.env.AWS_DEFAULT_REGION;
      process.env.S3_DELIVERABLES_BUCKET = 'test-bucket';

      expect(() => new S3MediaStorageAdapter()).toThrow(/AWS_REGION/);
    });

    it('fails fast at startup if S3_DELIVERABLES_BUCKET is missing in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_REGION = 'us-east-1';
      delete process.env.S3_DELIVERABLES_BUCKET;

      expect(() => new S3MediaStorageAdapter()).toThrow(/S3_DELIVERABLES_BUCKET/);
    });

    it('initializes successfully with injected config in test environment', () => {
      const adapter = new S3MediaStorageAdapter({
        bucket: 'my-custom-bucket',
        region: 'us-west-2',
        client: mockS3Client as unknown as S3Client
      });

      expect(adapter.getBucket()).toBe('my-custom-bucket');
      expect(adapter.getRegion()).toBe('us-west-2');
    });
  });

  describe('generatePresignedUploadUrl', () => {
    it('creates PutObjectCommand with server-controlled key and returns signed URL and required headers', async () => {
      const adapter = new S3MediaStorageAdapter({
        bucket: 'deliverables-bucket',
        region: 'us-east-1',
        client: mockS3Client as unknown as S3Client
      });

      const result = await adapter.generatePresignedUploadUrl({
        workOrderId: 'wo-12345',
        type: DeliverableType.PHOTO_BEFORE,
        filename: 'site_initial.png',
        mimeType: 'image/png',
        sizeBytes: 2048576
      });

      expect(result.uploadUrl).toBe('https://s3.amazonaws.com/test-signed-url');
      expect(result.expiresInSeconds).toBe(900);
      expect(result.requiredHeaders).toEqual({
        'Content-Type': 'image/png'
      });
      expect(result.objectKey).toMatch(
        /^work-orders\/wo-12345\/deliverables\/PHOTO_BEFORE\/[a-f0-9-]+\.png$/
      );

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'deliverables-bucket',
          ContentType: 'image/png',
          ContentLength: 2048576,
          Key: result.objectKey
        })
      );
      expect(mockGetSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.any(Object), {
        expiresIn: 900
      });
    });
  });

  describe('generatePresignedDownloadUrl', () => {
    it('creates GetObjectCommand and returns signed URL with requested expiration', async () => {
      const adapter = new S3MediaStorageAdapter({
        bucket: 'deliverables-bucket',
        region: 'us-east-1',
        client: mockS3Client as unknown as S3Client
      });

      const key = 'work-orders/wo-123/deliverables/PHOTO_AFTER/deliv.jpg';
      const url = await adapter.generatePresignedDownloadUrl(key, 600);

      expect(url).toBe('https://s3.amazonaws.com/test-signed-url');
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'deliverables-bucket',
        Key: key
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.any(Object), {
        expiresIn: 600
      });
    });
  });

  describe('headObject', () => {
    it('returns object metadata when object exists in S3', async () => {
      const adapter = new S3MediaStorageAdapter({
        bucket: 'deliverables-bucket',
        region: 'us-east-1',
        client: mockS3Client as unknown as S3Client
      });

      const lastMod = new Date();
      mockS3Client.send.mockResolvedValueOnce({
        ContentLength: 4096,
        ContentType: 'image/jpeg',
        ETag: '"etag-123"',
        LastModified: lastMod
      });

      const meta = await adapter.headObject('work-orders/wo-123/deliverables/PHOTO_BEFORE/img.jpg');

      expect(meta).toEqual({
        contentLength: 4096,
        contentType: 'image/jpeg',
        eTag: '"etag-123"',
        lastModified: lastMod
      });
      expect(HeadObjectCommand).toHaveBeenCalledWith({
        Bucket: 'deliverables-bucket',
        Key: 'work-orders/wo-123/deliverables/PHOTO_BEFORE/img.jpg'
      });
    });

    it('returns null when S3 returns NotFound error (404)', async () => {
      const adapter = new S3MediaStorageAdapter({
        bucket: 'deliverables-bucket',
        region: 'us-east-1',
        client: mockS3Client as unknown as S3Client
      });

      const notFoundError = Object.assign(new Error('NotFound'), {
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 }
      });
      mockS3Client.send.mockRejectedValueOnce(notFoundError);

      const meta = await adapter.headObject('non-existent-key');
      expect(meta).toBeNull();
    });

    it('rethrows unexpected non-404 errors', async () => {
      const adapter = new S3MediaStorageAdapter({
        bucket: 'deliverables-bucket',
        region: 'us-east-1',
        client: mockS3Client as unknown as S3Client
      });

      mockS3Client.send.mockRejectedValueOnce(new Error('AWS internal server error 500'));
      await expect(adapter.headObject('key')).rejects.toThrow('AWS internal server error 500');
    });
  });

  describe('deleteObject', () => {
    it('sends DeleteObjectCommand to S3', async () => {
      const adapter = new S3MediaStorageAdapter({
        bucket: 'deliverables-bucket',
        region: 'us-east-1',
        client: mockS3Client as unknown as S3Client
      });

      mockS3Client.send.mockResolvedValueOnce({});
      await adapter.deleteObject('some-key');

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'deliverables-bucket',
        Key: 'some-key'
      });
    });
  });
});
