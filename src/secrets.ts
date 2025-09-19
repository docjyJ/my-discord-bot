import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

export const token = required('TOKEN');
export const guildId = required('GUILD_ID');
export const applicationId = required('APPLICATION_ID');
export const channelId = required('CHANNEL_ID');

