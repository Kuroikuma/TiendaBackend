import { WebClient } from '@slack/web-api';


export const sendChannelMessage = async (channel: string, message: string): Promise<void> => {
  try {

    const slackToken = process.env.SLACK_BOT_TOKEN;
    const slackClient = new WebClient(slackToken);

    console.log(process.env.SLACK_BOT_TOKEN);
    console.log(slackToken);
    console.log("dadad");
    
    
    await slackClient.chat.postMessage({
      text: message,
      channel,
    });
    console.log(`Mensaje enviado al canal ${channel} con éxito.`);
  } catch (error) {
    console.error('Error enviando mensaje al canal de Slack:', error);
  }
};

export const sendDirectMessage = async (username: string, message: string): Promise<void> => {
  try {
    
    const slackToken = process.env.SLACK_BOT_TOKEN;
    const slackClient = new WebClient(slackToken);

    const users = await slackClient.users.list({});
    const user = users.members?.find((member) => member.name === username);

    if (!user || !user.id) {
      console.error('Usuario no encontrado o no tiene un ID válido.');
      return;
    }

    const im = await slackClient.conversations.open({ users: user.id });
    const channelId = im.channel?.id;

    if (channelId) {
      await slackClient.chat.postMessage({
        text: message,
        channel: channelId,
      });
      console.log(`Mensaje enviado a ${username} con éxito.`);
    }
  } catch (error) {
    console.error('Error enviando mensaje directo en Slack:', error);
  }
};
