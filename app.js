// Importar las dependencias para configurar el servidor
var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var text, title, payload;
var app = express();

const sendQuickReply = require('./utils/quick-reply'),
      HandoverProtocol = require('./utils/handover-protocol');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// configurar el puerto y el mensaje en caso de exito
app.listen((process.env.PORT || 5000), () => console.log('El servidor webhook esta eschando por el puerto 5000!'));

// Ruta de la pagina index
app.get("/", function (req, res) {
    res.send("Se ha desplegado de manera exitosa BetoBot :D!!!");
});

// Facebook Webhook

// Usados para la verificacion
app.get("/webhook", function (req, res) {
    // Verificar la coincidendia del token
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        // Mensaje de exito y envio del token requerido
        console.log("webhook verificado!");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        // Mensaje de fallo
        console.error("La verificacion ha fallado, porque los tokens no coinciden");
        res.sendStatus(403);
    }
});

// Todos eventos de mesenger sera apturados por esta ruta
app.post("/webhook", function (req, res) {
    // Verificar si el vento proviene del pagina asociada
    const webhook_events = req.body.entry[0];

    if(webhook_events.messaging){
      webhook_events.messaging.forEach(event => {
      // parse sender PSID and message
      const psid = event.sender.id;
      const message = event.message.text;

      if (message == 'Pass to Inbox') {

        // quick reply to pass to Page inbox was clicked
        let page_inbox_app_id = 183425035694882;
        text = 'The Primary Receiver is passing control to the Page Inbox. \n\n Tap "Take From Inbox" to have the Primary Receiver take control back.';
        title = 'Take From Inbox';
        payload = 'take_from_inbox';

        sendQuickReply(psid, text, title, payload);
        HandoverProtocol.passThreadControl(psid, page_inbox_app_id);

      } else if (event.pass_thread_control) {

        // thread control was passed back to bot manually in Page inbox
        text = 'You passed control back to the Primary Receiver by marking "Done" in the Page Inbox. \n\n Tap "Pass to Inbox" to pass control to the Page Inbox.';
        title = 'Pass to Inbox';
        payload = 'pass_to_inbox';

        sendQuickReply(psid, text, title, payload);

      } else if (message && !message.is_echo) {

        // default
        text = 'Welcome! The bot is currently in control. \n\n Tap "Pass to Inbox" to pass control to the Page Inbox.';
        title = 'Pass to Inbox';
        payload = 'pass_to_inbox';

        sendQuickReply(psid, text, title, payload);
      }

    });
    }

    // if (req.body.object == "page") {
    //     // Si existe multiples entradas entraas
    //     req.body.entry.forEach(function(entry) {
    //         // Iterara todos lo eventos capturados
    //         entry.messaging.forEach(function(event) {
    //             if (event.message) {
    //                 process_event(event);
    //             }
    //         });
    //     });
     res.sendStatus(200);
    // }
});


// // Funcion donde se procesara el evento
// function process_event(event){
//     // Capturamos los datos del que genera el evento y el mensaje
//     var senderID = event.sender.id;
//     var message = event.message;
//
//     // Si en el evento existe un mensaje de tipo texto
//     if(message.text){
//         // Crear un payload para un simple mensaje de texto
//         var response = {
//             "text": 'Enviaste este mensaje: ' + message.text
//         }
//     }
//
//     // Enviamos el mensaje mediante SendAPI
//     enviar_texto(senderID, response);
// }
//
// // Funcion donde el chat respondera usando SendAPI
// function enviar_texto(senderID, response){
//     // Construcicon del cuerpo del mensaje
//     let request_body = {
//         "recipient": {
//           "id": senderID
//         },
//         "message": response
//     }
//
//     // Enviar el requisito HTTP a la plataforma de messenger
//     request({
//         "uri": "https://graph.facebook.com/v2.6/me/messages",
//         "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
//         "method": "POST",
//         "json": request_body
//     }, (err, res, body) => {
//         if (!err) {
//           console.log('Mensaje enviado!')
//         } else {
//           console.error("No se puedo enviar el mensaje:" + err);
//         }
//     });
// }
