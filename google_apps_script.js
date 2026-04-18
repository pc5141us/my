const botToken = "8023396787:AAEmT-NyUHKWHQgzZsgeji2BpYkN0fNQjJI";
const telegramUrl = "https://api.telegram.org/bot" + botToken;

// 1. وظيفة لجلب البيانات للموقع (GET)
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var result = [];
  
  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
        result.push({
          id: data[i][0],
          title: data[i][1],
          description: data[i][2],
          price: data[i][3],
          thumbnail: data[i][4],
          previewUrl: data[i][5]
        });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. معالجة الرسائل والضغط على الأزرار (POST)
function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  
  // معالجة الضغط على أزرار الكيبورد أونلاين
  if (update.callback_query) {
    handleCallback(update.callback_query);
    return;
  }
  
  // معالجة الرسائل النصية
  if (update.message) {
    handleMessage(update.message);
  }
}

// معالجة الرسائل
function handleMessage(msg) {
  var chatId = msg.chat.id;
  var text = msg.text || "";
  
  if (text == "/start") {
    sendMainKeyboard(chatId);
  } else if (text.startsWith("/add")) {
     // استخدام نفس المنطق القديم للإضافة السريعة إذا أردت
     processAddRequest(chatId, text);
  } else {
    sendMessage(chatId, "استخدم الأزرار أدناه للتحكم:");
    sendMainKeyboard(chatId);
  }
}

// معالجة الضغط على الأزرار
function handleCallback(query) {
  var chatId = query.message.chat.id;
  var data = query.data;
  
  if (data == "main_menu") {
    sendMainKeyboard(chatId);
  } 
  
  else if (data == "list_projects") {
    listProjectsForControl(chatId);
  } 
  
  else if (data == "add_project_info") {
    sendMessage(chatId, "➕ لإضافة موقع جديد، أرسل البيانات بهذا التنسيق في رسالة واحدة:\n\n`/add الاسم السعر الوصف رابط_الصورة رابط_المعاينة`\n\n*(تأكد من وجود مسافة واحدة بين كل معلومة)*");
  } 
  
  else if (data.startsWith("del_")) {
    var id = data.replace("del_", "");
    deleteProjectById(chatId, id);
  }
  
  // لإراحة المستخدم، نقوم بمسح حالة التحميل من الزر
  answerCallbackQuery(query.id);
}

// القائمة الرئيسية (Inline Keyboard)
function sendMainKeyboard(chatId) {
  var keyboard = {
    inline_keyboard: [
      [{ text: "➕ إضافة موقع جديد", callback_data: "add_project_info" }],
      [{ text: "📋 عرض وحذف المواقع", callback_data: "list_projects" }],
      [{ text: "🔄 تحديث الصفحة", callback_data: "main_menu" }]
    ]
  };
  sendKeyboard(chatId, "🎮 لوحة تحكم Doma Designs\nأهلاً بك! ماذا تريد أن تفعل اليوم؟", keyboard);
}

// عرض المواقع مع أزرار الحذف
function listProjectsForControl(chatId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    sendMessage(chatId, "📭 لا توجد مواقع معروضة حالياً.");
    sendMainKeyboard(chatId);
    return;
  }

  sendMessage(chatId, "🔎 إليك قائمة بكل المواقع المعروضة:");

  for (var i = 1; i < data.length; i++) {
    var id = data[i][0];
    var title = data[i][1];
    var price = data[i][3];
    
    var keyboard = {
      inline_keyboard: [
        [{ text: "🗑 حذف هذا الموقع", callback_data: "del_" + id }]
      ]
    };
    
    sendKeyboard(chatId, "📍 *" + title + "*\n💰 السعر: " + price + "\n🔢 ID: " + id, keyboard);
  }
}

// حذف موقع
function deleteProjectById(chatId, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      found = true;
      break;
    }
  }
  
  if (found) {
    sendMessage(chatId, "✅ تم حذف الموقع بنجاح.");
    listProjectsForControl(chatId); // عرض القائمة المحدثة
  } else {
    sendMessage(chatId, "❌ لم يتم العثور على هذا الموقع.");
  }
}

// تشغيل إضافة موقع
function processAddRequest(chatId, text) {
  var parts = text.split(" ");
  if (parts.length < 6) {
    sendMessage(chatId, "❌ خطأ! التنسيق الصحيح:\n/add الاسم السعر الوصف رابط_الصورة رابط_المعاينة");
  } else {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var id = "D" + Math.floor(Math.random() * 10000);
    sheet.appendRow([id, parts[1], parts[3], parts[2], parts[4], parts[5]]);
    sendMessage(chatId, "✅ ممتاز! الموقع الآن متاح على صفحتك.");
    sendMainKeyboard(chatId);
  }
}

// --- وظائف مساعدة لتليجرام ---

function sendKeyboard(chatId, text, keyboard) {
  var url = telegramUrl + "/sendMessage";
  var payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown",
    reply_markup: JSON.stringify(keyboard)
  };
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(url, options);
}

function sendMessage(chatId, text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURIComponent(text);
  UrlFetchApp.fetch(url);
}

function answerCallbackQuery(callbackQueryId) {
  UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery?callback_query_id=" + callbackQueryId);
}

function setWebhook() {
  var webAppUrl = "رابط_الـ_Web_App_الخاص_بك_هنا";
  UrlFetchApp.fetch(telegramUrl + "/setWebhook?url=" + webAppUrl);
}
