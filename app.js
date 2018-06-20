/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

// import dependencies
const bodyParser = require('body-parser'),
      express = require('express'),
      app = express();

// import helper libs
const sendQuickReply = require('./utils/quick-reply'),
      HandoverProtocol = require('./utils/handover-protocol'),
      env = require('./env');

// webhook setup
app.listen(process.env.PORT || env.PORT || 1337, () => console.log('webhook is listening'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Se ha desplegado de manera exitosa BetoBot :D!!!");
});

// webhook verification
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
});

// webhook
app.post('/webhook', (req, res) => {

  // parse messaging array
  const webhook_events = req.body.entry[0];

  // initialize quick reply properties
  let text, title, payload;

  // Secondary Receiver is in control - listen on standby channel
  if (webhook_events.standby) {

    // iterate webhook events from standby channel
    webhook_events.standby.forEach(event => {

      const psid = event.sender.id;
      const message = event.message;

      if (message && message.quick_reply && message.quick_reply.payload == 'take_from_inbox') {
        // quick reply to take from Page inbox was clicked
        text = 'The Primary Receiver is taking control back. \n\n Tap "Pass to Inbox" to pass thread control to the Page Inbox.';
        title = 'Pass to Inbox';
        payload = 'pass_to_inbox';

        sendQuickReply(psid, text, title, payload);
        HandoverProtocol.takeThreadControl(psid);
      }

    });
  }

  // Bot is in control - listen for messages
  if (webhook_events.messaging) {

    // iterate webhook events
    webhook_events.messaging.forEach(event => {
      // parse sender PSID and message
      const psid = event.sender.id;
      const message = event.message;

      if (message && message.quick_reply && message.quick_reply.payload == 'pass_to_inbox') {

        // quick reply to pass to Page inbox was clicked
        let page_inbox_app_id = 263902037430900;
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

  // respond to all webhook events with 200 OK
  res.sendStatus(200);
});
// // Importar las dependencias para configurar el servidor
// var express = require("express");
// var request = require("request");
// var bodyParser = require("body-parser");
//
// var app = express();
// app.use(bodyParser.urlencoded({extended: false}));
// app.use(bodyParser.json());
// // configurar el puerto y el mensaje en caso de exito
// app.listen((process.env.PORT || 5000), () => console.log('El servidor webhook esta eschando por el puerto 5000!'));
//
// // Ruta de la pagina index
// app.get("/", function (req, res) {
//     res.send("Se ha desplegado de manera exitosa BetoBot :D!!!");
// });
//
// // Facebook Webhook
//
// // Usados para la verificacion
// app.get("/webhook", function (req, res) {
//     // Verificar la coincidendia del token
//     if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
//         // Mensaje de exito y envio del token requerido
//         console.log("webhook verificado!");
//         res.status(200).send(req.query["hub.challenge"]);
//     } else {
//         // Mensaje de fallo
//         console.error("La verificacion ha fallado, porque los tokens no coinciden");
//         res.sendStatus(403);
//     }
// });
//
// // Todos eventos de mesenger sera apturados por esta ruta
// app.post("/webhook", function (req, res) {
//     // Verificar si el vento proviene del pagina asociada
//     console.log(req.body);
//     if (req.body.object == "page") {
//         // Si existe multiples entradas entraas
//         req.body.entry.forEach(function(entry) {
//             // Iterara todos lo eventos capturados
//             entry.messaging.forEach(function(event) {
//                 if (event.message) {
//                     process_event(event);
//                 }
//             });
//         });
//         res.sendStatus(200);
//     }
// });
//
//
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
