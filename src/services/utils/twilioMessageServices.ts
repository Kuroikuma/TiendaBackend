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

  const currentDate = new Date().toLocaleString();
  const totalQuantity = productList.reduce((total, product) => total + product.quantity, 0);
  const totalProduct = productList.length

  const templateParams = [
    username, // {{1}} - ID o nombre del usuario
    branchName, // {{2}} - Nombre de la sucursal
    currentDate, // {{3}} - Fecha del envío
    orderId, // {{4}} - ID del pedido
    originBranch, // {{5}} - Sucursal de origen
    productList, // {{6}} - Detalles del pedido
    totalProduct, // {{7}} - Total de artículos
    totalQuantity, // {{8}} - Cantidad total de productos
  ];

  client.messages
    .create({
          from: 'whatsapp:+14155238886',
          contentSid: 'HX2132887ac453819cef448bd31d4b1bf3',
          // contentVariables: '{"1":"Junior Hurtado","2":"Audifonos","3":"Juigalpa", "4":"10", "5":"20"}',
          templateParams: templateParams,
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

  const templateParams = [
    branchName, // {{1}} - ID o nombre del usuario
    username, // {{2}} - Nombre de la sucursal
    productList, // {{3}} - Fecha del envío
  ];

  client.messages
    .create({
          from: 'whatsapp:+14155238886',
          contentSid: 'HX9ef6ee663e504074313eaacce2056b1b',
          // contentVariables: '{"1":"Junior Hurtado","2":"Audifonos","3":"Juigalpa", "4":"10", "5":"20"}',
          templateParams: templateParams,
          to: 'whatsapp:+50558851605',
        })
    .then((message) => console.log(`Mensaje enviado con SID: ${message.sid}`))
    .catch((error) => console.error(`Error al enviar el mensaje: ${error}`));
};
