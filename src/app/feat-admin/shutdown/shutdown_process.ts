import { ChatInputCommandInteraction, MessageFlags, PermissionsBitField } from 'discord.js';

export async function shutdown(interaction: ChatInputCommandInteraction<'cached'>) {
    const member = interaction.member;
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return await interaction.reply({
            content: '操作を実行する権限がないでし！',
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.reply({
        content: 'BOTをシャットダウンするでし！\n再起動までしばらく待つでし！',
    });

    await interaction.client.destroy().then(
        () => process.exit(0), // クライアントの切断に成功したらプロセスを終了する
        () => interaction.editReply('クライアントの切断に失敗したでし！'), // クライアントの切断に失敗したらエラーメッセージを送信する
    );
}
