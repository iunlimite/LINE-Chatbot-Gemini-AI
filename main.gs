var LINE_CHANNEL_TOKEN = 'LINE_CHANNEL_TOKEN';
var GEMINI_API_KEY = 'GEMINI_API_KEY';

function doPost(e) {
  try {
    const eventData = JSON.parse(e.postData.contents).events[0];
    const replyToken = eventData.replyToken;
    const messageType = eventData.message.type;
    const messageId = eventData.message.id;

    switch (messageType) {
      case 'text':
        handleTextMessage(replyToken, eventData.message.text);
        break;
      case 'image':
        handleImageMessage(replyToken, messageId);
        break;
      case 'file':
        replyToLine(replyToken, 'ขออภัยไม่รองรับไฟล์ประเภทนี้ รองรับเฉพาะข้อความและรูปภาพเท่านั้น');
        break;
      default:
        replyToLine(replyToken, 'ประเภทข้อความไม่ถูกต้อง');
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    replyToLine(replyToken, 'เกิดข้อผิดพลาด');
  }
}

function handleTextMessage(replyToken, messageText) {
  const replyMessage = callTextGenerativeLanguageAPI(messageText);
  replyToLine(replyToken, replyMessage);
}

function handleImageMessage(replyToken, messageId) {
  const replyMessage = callImageGenerativeLanguageAPI(messageId);
  replyToLine(replyToken, replyMessage);
}

function replyToLine(replyToken, message) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + LINE_CHANNEL_TOKEN,
  };
  const data = {
    'replyToken': replyToken,
    'messages': [{ 'type': 'text', 'text': message }],
  };

  const options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(data),
  };

  UrlFetchApp.fetch(url, options);
}

function callTextGenerativeLanguageAPI(message) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY;
  const contentType = 'application/json';

  const requestData = {
    contents: [
      {
        parts: [
          {
            text: message + '\nFrom the above questions, when answering question, please format them in an easy-to-read format and thai language for use in the LINE application.',
          },
        ],
      },
    ],
  };

  const requestOptions = {
    method: 'post',
    contentType: contentType,
    payload: JSON.stringify(requestData),
  };

  const response = UrlFetchApp.fetch(apiUrl, requestOptions);

  if (response.getResponseCode() === 200) {
    const responseData = JSON.parse(response.getContentText());
    const generatedText = responseData.candidates[0]?.content?.parts[0]?.text || 'ไม่พบข้อมูล';
    return generatedText;
  } else {
    return 'เกิดข้อผิดพลาดในการเรียกใช้ API: ' + response.getResponseCode();
  }
}

function callImageGenerativeLanguageAPI(messageId) {
  var url = "https://api-data.line.me/v2/bot/message/" + messageId + "/content";
  var headers = {
    "headers": { "Authorization": "Bearer " + LINE_CHANNEL_TOKEN }
  };

  try {
    var getcontent = UrlFetchApp.fetch(url, headers);
    var blob = getcontent.getBlob();
    var fileBlob = Utilities.newBlob(blob.getBytes(), 'image/jpeg', messageId + '.jpg');
    var base64EncodedImage = Utilities.base64Encode(fileBlob.getBytes());

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + GEMINI_API_KEY;

    const requestData = {
      contents: [
        {
          parts: [
            { text: 'Please Analyze this picture.\nWhen answering, please format them in an easy-to-read format and thai language for use in the LINE application.' },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64EncodedImage,
              },
            },
          ],
        },
      ],
    };

    const requestOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestData),
    };

    const response = UrlFetchApp.fetch(apiUrl, requestOptions);

    if (response.getResponseCode() === 200) {
      const responseData = JSON.parse(response.getContentText());
      const generatedText = responseData.candidates[0]?.content?.parts[0]?.text || 'ไม่พบข้อมูล';
      return generatedText;
    } else {
      return 'เกิดข้อผิดพลาดในการเรียกใช้ API: ' + response.getResponseCode();
    }

  } catch (error) {
    return 'เกิดข้อผิดพลาดในการเรียกใช้ API: ' + error;
  }
}
