import { Member } from '@prisma/client';
import {
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    User,
} from 'discord.js';
import fetch from 'node-fetch';

import { getGuildByInteraction } from '@/app/common/manager/guild_manager';
import { searchDBMemberById } from '@/app/common/manager/member_manager';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { ErrorTexts } from '@/config/constants/error_texts';
import { log4js_obj } from '@/log4js_settings';
import { exists } from '@/shared/assert';
import { randomSelect } from '@/shared/random';
const weaponsUrl = 'https://stat.ink/api/v3/weapon';

const logger = log4js_obj.getLogger('interaction');

type Weapon = {
    key: string;
    aliases: string[];
    type: {
        key: string;
        aliases: [];
        name: {
            en_US: string;
            ja_JP: string;
        };
    };
    name: {
        en_US: string;
        ja_JP: string;
    };
    main: string;
    sub: {
        key: string;
        aliases: [];
        name: {
            en_US: string;
            ja_JP: string;
        };
    };
    special: {
        key: string;
        aliases: [];
        name: {
            en_US: string;
            ja_JP: string;
        };
    };
    reskin_of: string;
};

export async function handleBuki(interaction: ChatInputCommandInteraction<CacheType>) {
    const { options } = interaction;
    const bukiType = options.getString('ブキ種');
    const amount = options.getInteger('ブキの数') ?? 1;
    if (amount > 10) {
        return await interaction.reply({
            content: '一度に指定できるのは10個まででし！',
            flags: MessageFlags.Ephemeral,
        });
    }
    if (amount <= 0) {
        return await interaction.reply({
            content: '1以上の数を指定するでし！',
            flags: MessageFlags.Ephemeral,
        });
    }

    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();

    try {
        const response = await fetch(weaponsUrl);
        const weapons = (await response.json()) as Weapon[];

        let member: User | Member | null;
        if (interaction.inGuild()) {
            const guild = await getGuildByInteraction(interaction);
            member = await searchDBMemberById(guild, interaction.member.user.id);
        } else {
            member = interaction.user;
        }

        const bukis = weapons.filter(function (value: Weapon) {
            if (exists(bukiType)) {
                // 特定のbukiTypeが指定されているとき
                return bukiType === value.type.key;
            } else if (!~value.name.ja_JP.indexOf('ヒーロー')) {
                return true;
            }
        });
        const bukiNames = bukis.map(function (value: Weapon) {
            const embed = new EmbedBuilder()
                .setColor(0xf02d7d)
                .setTitle(value.name.ja_JP)
                .addFields({
                    value: value.name.en_US,
                    name: value.sub.name.ja_JP + ' / ' + value.special.name.ja_JP,
                });
            if (member instanceof User) {
                embed.setAuthor({
                    name: member.displayName + 'のブキ',
                    iconURL: member.displayAvatarURL(),
                });
            } else if (exists(member) && exists(member.displayName) && exists(member.iconUrl)) {
                embed.setAuthor({
                    name: member.displayName + 'のブキ',
                    iconURL: member.iconUrl,
                });
            }
            return embed;
        }) as EmbedBuilder[];

        if (amount) {
            const length = bukiNames.length;
            const embeds = [];
            for (let i = 0; i < amount; i++) {
                embeds.push(bukiNames[Math.floor(Math.random() * length)]);
            }
            await interaction.followUp({
                embeds: embeds,
            });
        } else {
            const buki = randomSelect(bukiNames, 1)[0];
            await interaction.followUp({ embeds: [buki] });
        }
    } catch (error) {
        await interaction.followUp(ErrorTexts.UndefinedError);
        await sendErrorLogs(logger, error);
    }
}
