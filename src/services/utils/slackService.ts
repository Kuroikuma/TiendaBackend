import { WebClient } from '@slack/web-api';

const getUserId = async (username: string): Promise<string | null> => {

  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackClient = new WebClient(slackToken);

  try {
    const result = await slackClient.users.list({});
    const user = result.members?.find((member) => member.real_name === username);

    return user ? user.id as string : null;
  } catch (error) {
    console.error('Error obteniendo el ID de usuario:', error);
    return null;
  }
};

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

type Product = {
  name: string;
  quantity: number;
};

export const notifyManagerOfIncomingProducts = async (
  channel: string,
  branchName: string,
  productList: Product[],
  orderId: string,
  originBranch: string
) => {

  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackClient = new WebClient(slackToken);

  // let userId = await getUserId(username);

  const currentDate = new Date().toLocaleString();

  const productDetails = productList
    .map((product, index) => `• ${index + 1}. ${product.name} - Cantidad: ${product.quantity}`)
    .join('\n');

  const totalQuantity = productList.reduce((total, product) => total + product.quantity, 0);

  const message = {
    text: `:package: *Notificación de Envío de Productos*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Hola , un nuevo pedido ha sido enviado a la sucursal de ${branchName}.*`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `:calendar: *Fecha del envío:* ${currentDate}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*ID de Pedido:* ${orderId}\n*Origen del Envío:* ${originBranch}`
        }
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Detalles del Envío:*\n${productDetails}\n\n*Total de Productos:* ${productList.length}\n*Cantidad Total:* ${totalQuantity}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `:truck: _Este mensaje es una notificación automática._`
          }
        ]
      }
    ]
  };

  try {
    await slackClient.chat.postMessage({
      channel: channel,
      ...message
    });
    console.log(`Notificación enviada a  sobre el envío de productos a ${branchName}.`);
  } catch (error) {
    console.error('Error enviando notificación al encargado de la sucursal:', error);
  }
};
