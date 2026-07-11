import type {
    CacheType,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';

/**
 * Discord に登録できる定義。
 * SlashCommandBuilder 系と ContextMenuCommandBuilder の両方がこの形を満たす。
 */
export interface CommandDefinition {
    readonly name: string;
    toJSON(): RESTPostAPIApplicationCommandsJSONBody;
}

/** Guild でのみ動くスラッシュコマンド */
export interface GuildChatInputCommand {
    kind: 'chatInput';
    guildOnly: true;
    definition: CommandDefinition;
    execute: (interaction: ChatInputCommandInteraction<'cached'>) => Promise<unknown>;
}

/** DM でも Guild でも動くスラッシュコマンド */
export interface GlobalChatInputCommand {
    kind: 'chatInput';
    guildOnly: false;
    definition: CommandDefinition;
    execute: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<unknown>;
}

export type ChatInputCommand = GuildChatInputCommand | GlobalChatInputCommand;

/** メッセージのコンテキストメニューコマンド */
export interface MessageContextMenuCommand {
    kind: 'contextMenu';
    definition: CommandDefinition;
    execute: (
        interaction: MessageContextMenuCommandInteraction<'cached' | 'raw'>,
    ) => Promise<unknown>;
}

/**
 * コマンドは定義(Discord への登録内容)と実行関数をセットで1ファイルに持つ。
 * registry/command_registry.ts がこれらを集約する。
 */
export type CommandModule = ChatInputCommand | MessageContextMenuCommand;
