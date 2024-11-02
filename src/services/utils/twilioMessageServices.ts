const accountSid = 'AC765fa1004417bf97128e3ca10824aacd';
const authToken = 'f590cfbf94ad7e8c92d2b8538adccfee';
const client = require('twilio')(accountSid, authToken);

type Product = {
  name: string;
  quantity: number;
};

interface ProductReorder {
  name: string;
  currentQuantity: number;
  reorderPoint: number;
}

export const notifyWhatsappManagerOfIncomingProducts = async (
  username: string,
  branchName: string,
  productList: Product[],
  orderId: string,
  originBranch: string,
) => {
  const productDetails = productList
    .map((product, index) => `*${index + 1}.* ${product.name} - *Cantidad:* ${product.quantity}`)
    .join('\n'); 

  const currentDate = new Date().toLocaleString();
  const totalQuantity = productList.reduce((total, product) => total + product.quantity, 0);
  const totalProduct = productList.length;

  // Crear un objeto con las variables de contenido
  const contentVariables = {
    '1': username,              // {{1}} - ID o nombre del usuario
    '2': branchName,            // {{2}} - Nombre de la sucursal
    '3': currentDate,           // {{3}} - Fecha del envío
    '4': orderId,               // {{4}} - ID del pedido
    '5': originBranch,          // {{5}} - Sucursal de origen
    '6': productDetails,        // {{6}} - Detalles del pedido en formato lista
    '7': totalProduct.toString(), // {{7}} - Total de artículos (convertido a string)
    '8': totalQuantity.toString(), // {{8}} - Cantidad total de productos (convertido a string)
  };

  client.messages
    .create({
      from: 'whatsapp:+14155238886',
      contentSid: 'HX6951120bd3833aff5b75c99790f67bba',
      contentVariables: JSON.stringify(contentVariables), // Convierte a cadena JSON
      to: 'whatsapp:+50558851605',
    })
    .then((message) => console.log(`Mensaje enviado con SID: ${message.sid}`))
    .catch((error) => console.error(`Error al enviar el mensaje: ${error}`));
};


export const notifyWhatsappReorderThreshold = async (
  username: string,
  branchName: string,
  productList: ProductReorder[],
) => {
  const productDetails = productList.map((product) => {
    return `• *${product.name}*: Cantidad actual: ${product.currentQuantity}, Punto de reorden: ${product.reorderPoint}`;
  }).join("\n");

  // Crear un objeto con las variables de contenido
  const contentVariables = {
    '1': branchName,         // {{1}} - Nombre de la sucursal
    '2': username,           // {{2}} - ID o nombre del usuario
    '3': productDetails,     // {{3}} - Detalles del pedido
  };

  client.messages
    .create({
      from: 'whatsapp:+14155238886',
      contentSid: 'HX9ef6ee663e504074313eaacce2056b1b',
      contentVariables: JSON.stringify(contentVariables), // Asegúrate de enviar las variables en formato JSON
      to: 'whatsapp:+50558851605',
    })
    .then((message) => console.log(`Mensaje enviado con SID: ${message.sid}`))
    .catch((error) => console.error(`Error al enviar el mensaje: ${error}`));
};

