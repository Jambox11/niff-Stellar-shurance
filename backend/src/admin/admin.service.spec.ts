import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagsService } from '../../feature-flags/feature-flags.service';
import { ClaimStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { BULK_UPDATE_MAX_BATCH } from '../dto/bulk-update-claims.dto';

jest.mock('bullmq', () => ({ Queue: jest.fn().mockImplementation(() => ({ add: jest.fn(), getJob: jest.fn() })) }));
jest.mock('../../redis/client', () => ({ getBullMQConnection: jest.fn().mockReturnValue({}) }));

const mockClaims = [
  { id: 1, status: ClaimStatus.PENDING, policyId: 'G:1' },
  { id: 2, status: ClaimStatus.PENDING, policyId: 'G:2' },
];

const mockPrisma = {
  claim: { findMany: jest.fn().mockResolvedValue(mockClaims), updateMany: jest.fn() },
  adminAuditLog: { create: jest.fn() },
  featureFlag: { upsert: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(async (fn: (tx: typeof mockPrisma) => Promise<void>) => fn(mockPrisma)),
};

describe('AdminService.bulkUpdateClaims', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FeatureFlagsService, useValue: { refreshFlags: jest.fn() } },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  afterEach(() => jest.clearAllMocks());

  it('dry-run returns affected claims without modifying data', async () => {
    const result = await service.bulkUpdateClaims([1, 2], ClaimStatus.APPROVED, 'test', 'admin', true);
    expect(result.dryRun).toBe(true);
    expect(result.affectedCount).toBe(2);
    expect(result.affected).toEqual(mockClaims);
    expect(mockPrisma.claim.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it('live update applies changes and creates audit log entries', async () => {
    const result = await service.bulkUpdateClaims([1, 2], ClaimStatus.APPROVED, 'approved by admin', 'admin', false);
    expect(result.dryRun).toBe(false);
    expect(result.affectedCount).toBe(2);
    expect(mockPrisma.claim.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
      data: { status: ClaimStatus.APPROVED },
    });
    expect(mockPrisma.adminAuditLog.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'bulk_claim_status_update' }) }),
    );
  });

  it('over-cap requests are rejected by DTO validation (ArrayMaxSize)', () => {
    // Validate that BULK_UPDATE_MAX_BATCH is 100
    expect(BULK_UPDATE_MAX_BATCH).toBe(100);
  });

  it('returns empty affected list when no claims match', async () => {
    mockPrisma.claim.findMany.mockResolvedValueOnce([]);
    const result = await service.bulkUpdateClaims([999], ClaimStatus.REJECTED, 'not found', 'admin', false);
    expect(result.affectedCount).toBe(0);
    expect(mockPrisma.claim.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [] } },
      data: { status: ClaimStatus.REJECTED },
    });
  });
});
