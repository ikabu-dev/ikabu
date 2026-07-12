import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    sendErrorLogs: vi.fn(),
    recruit: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
    },
    member: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    uniqueChannel: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    uniqueRole: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/infra/db/prisma', () => ({ prisma: mocks }));
vi.mock('@/infra/logging/send_error_logs', () => ({ sendErrorLogs: mocks.sendErrorLogs }));

import { ChannelKeySet } from '@/config/constants/channel_key';
import { RoleKeySet } from '@/config/constants/role_key';
import { MemberService } from '@/infra/db/repositories/member_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';

describe('DBサービスの例外安全網', () => {
    beforeEach(() => vi.clearAllMocks());

    it('RecruitService は成功結果を返し、例外時はnullまたは空配列を返す', async () => {
        const recruit = { guildId: 'g', messageId: 'm' };
        mocks.recruit.findUnique.mockResolvedValue(recruit);
        await expect(RecruitService.getRecruit('g', 'm')).resolves.toBe(recruit);
        mocks.recruit.findMany.mockResolvedValue([recruit]);
        await expect(RecruitService.getRecruitsByChannelId('g', 'c')).resolves.toEqual([recruit]);
        mocks.recruit.findUnique.mockRejectedValueOnce(new Error('db'));
        await expect(RecruitService.getRecruit('g', 'm')).resolves.toBeNull();
        mocks.recruit.findMany.mockRejectedValueOnce(new Error('db'));
        await expect(RecruitService.getRecruitsByChannelId('g', 'c')).resolves.toEqual([]);
        expect(mocks.sendErrorLogs).toHaveBeenCalledTimes(2);
    });

    it('MemberService は成功結果を返し、例外時はnullまたは空配列を返す', async () => {
        const member = { guildId: 'g', userId: 'u' };
        mocks.member.findUnique.mockResolvedValue(member);
        await expect(MemberService.getMemberByUserId('g', 'u')).resolves.toBe(member as never);
        mocks.member.findMany.mockResolvedValue([{ guildId: 'g1' }, { guildId: 'g2' }]);
        await expect(MemberService.getMemberGuildIdsByUserId('u')).resolves.toEqual(['g1', 'g2']);
        mocks.member.findUnique.mockRejectedValueOnce(new Error('db'));
        await expect(MemberService.getMemberByUserId('g', 'u')).resolves.toBeNull();
        mocks.member.findMany.mockRejectedValueOnce(new Error('db'));
        await expect(MemberService.getMemberGuildIdsByUserId('u')).resolves.toEqual([]);
    });

    it('UniqueChannelService は値を取り出し、例外時はnullまたは空配列を返す', async () => {
        mocks.uniqueChannel.findUnique.mockResolvedValue({ channelId: 'c' });
        await expect(
            UniqueChannelService.getChannelIdByKey('g', ChannelKeySet.Lobby.key),
        ).resolves.toBe('c');
        mocks.uniqueChannel.findMany.mockResolvedValue([
            { guildId: 'g', key: ChannelKeySet.Lobby.key, channelId: 'c' },
        ]);
        await expect(UniqueChannelService.getAllUniqueChannels('g')).resolves.toHaveLength(1);
        mocks.uniqueChannel.findUnique.mockRejectedValueOnce(new Error('db'));
        await expect(
            UniqueChannelService.getChannelIdByKey('g', ChannelKeySet.Lobby.key),
        ).resolves.toBeNull();
        mocks.uniqueChannel.findMany.mockRejectedValueOnce(new Error('db'));
        await expect(UniqueChannelService.getAllUniqueChannels('g')).resolves.toEqual([]);
    });

    it('UniqueRoleService は値を取り出し、例外時はnullまたは空配列を返す', async () => {
        mocks.uniqueRole.findUnique.mockResolvedValue({ roleId: 'r' });
        await expect(UniqueRoleService.getRoleIdByKey('g', RoleKeySet.Developer.key)).resolves.toBe(
            'r',
        );
        mocks.uniqueRole.findMany.mockResolvedValue([
            { guildId: 'g', key: RoleKeySet.Developer.key, roleId: 'r' },
        ]);
        await expect(UniqueRoleService.getAllUniqueRoles('g')).resolves.toHaveLength(1);
        mocks.uniqueRole.findUnique.mockRejectedValueOnce(new Error('db'));
        await expect(
            UniqueRoleService.getRoleIdByKey('g', RoleKeySet.Developer.key),
        ).resolves.toBeNull();
        mocks.uniqueRole.findMany.mockRejectedValueOnce(new Error('db'));
        await expect(UniqueRoleService.getAllUniqueRoles('g')).resolves.toEqual([]);
        expect(mocks.sendErrorLogs).toHaveBeenCalledTimes(2);
    });
});
