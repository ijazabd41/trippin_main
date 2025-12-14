const fs = require('fs');
const path = require('path');

const translationsDir = path.join(process.cwd(), 'src', 'i18n', 'translations');

const errorsBlockEn = `  "errors": {
    "boundaryTitle": "Something went wrong",
    "boundaryMessage": "We're sorry, but something unexpected happened.",
    "reloadPage": "Reload page",
    "pages": {
      "notFoundTitle": "Page not found",
      "notFoundDescription": "The page you are looking for might have been removed or temporarily unavailable.",
      "serverErrorTitle": "Server error",
      "serverErrorDescription": "There was a problem on our server. Please try again later.",
      "maintenanceTitle": "Maintenance in progress",
      "maintenanceDescription": "The service is currently undergoing maintenance. Please try again soon.",
      "unexpectedTitle": "An error occurred",
      "unexpectedDescription": "An unexpected error has occurred.",
      "backToPrevious": "Go back to the previous page",
      "errorCode": "Error code: {{code}}"
    },
    "checkout": {
      "generic": "A payment error occurred. Please try again.",
      "sessionCreationFailed": "Failed to create a checkout session.",
      "backendMockInUse": "The backend is using mock data. Please check the backend connection.",
      "mockDataInstructions": "The backend is using mock data. Click the \\"Force Real Backend\\" button in the debug panel.",
      "auth": "Authentication error occurred. Please sign in again.",
      "network": "A network error occurred. Please check your internet connection.",
      "timeout": "The request timed out. Please try again.",
      "rateLimited": "Too many requests. Please wait and try again.",
      "backendConnection": "Backend service is unavailable. Please try again later."
    },
    "forms": {
      "paymentFieldsRequired": "Please complete all payment fields.",
      "paymentProcessingError": "An error occurred while processing the payment."
    },
    "esim": {
      "plansLoadFailed": "Failed to load eSIM plan information.",
      "mockDataNotice": "eSIM service is temporarily unavailable, showing sample plans.",
      "loadFailedFallback": "Failed to load eSIM data. Showing basic fallback information."
    }
  }`;

const errorsBlockJa = `  "errors": {
    "boundaryTitle": "問題が発生しました",
    "boundaryMessage": "予期しないエラーが発生しました。ご不便をおかけして申し訳ありません。",
    "reloadPage": "ページを再読み込み",
    "pages": {
      "notFoundTitle": "ページが見つかりません",
      "notFoundDescription": "お探しのページは存在しないか、一時的に利用できません。",
      "serverErrorTitle": "サーバーエラー",
      "serverErrorDescription": "サーバーで問題が発生しました。しばらくしてから再度お試しください。",
      "maintenanceTitle": "メンテナンス中",
      "maintenanceDescription": "現在メンテナンスを実施しています。少し時間をおいて再度お試しください。",
      "unexpectedTitle": "エラーが発生しました",
      "unexpectedDescription": "予期しないエラーが発生しました。",
      "backToPrevious": "前のページに戻る",
      "errorCode": "エラーコード: {{code}}"
    },
    "checkout": {
      "generic": "決済処理でエラーが発生しました。もう一度お試しください。",
      "sessionCreationFailed": "決済セッションの作成に失敗しました。",
      "backendMockInUse": "バックエンドがモックデータを使用しています。バックエンド接続を確認してください。",
      "mockDataInstructions": "バックエンドがモックデータを使用しています。デバッグパネルの「Force Real Backend」をクリックしてください。",
      "auth": "認証エラーが発生しました。ログインし直してください。",
      "network": "ネットワークエラーが発生しました。インターネット接続を確認してください。",
      "timeout": "リクエストがタイムアウトしました。もう一度お試しください。",
      "rateLimited": "リクエストが多すぎます。しばらく待ってからもう一度お試しください。",
      "backendConnection": "バックエンドサービスを利用できません。時間をおいて再試行してください。"
    },
    "forms": {
      "paymentFieldsRequired": "すべての支払い項目を入力してください。",
      "paymentProcessingError": "決済処理中にエラーが発生しました。"
    },
    "esim": {
      "plansLoadFailed": "eSIMプラン情報の取得に失敗しました。",
      "mockDataNotice": "eSIMサービスが一時的に利用できないため、サンプルプランを表示しています。",
      "loadFailedFallback": "eSIMデータの読み込みに失敗しました。基本情報を表示しています。"
    }
  }`;

for (const file of fs.readdirSync(translationsDir).filter((f) => f.endsWith('.ts'))) {
  const fullPath = path.join(translationsDir, file);
  let text = fs.readFileSync(fullPath, 'utf8');

  if (text.includes('"errors": {')) {
    console.log(`Skipping (already contains errors): ${file}`);
    continue;
  }

  const block = file === 'ja.ts' ? errorsBlockJa : errorsBlockEn;
  const trimmed = text.trimEnd();

  if (!trimmed.endsWith('};')) {
    console.warn(`Unexpected file ending, skipping: ${file}`);
    continue;
  }

  const idx = trimmed.lastIndexOf('};');
  let before = trimmed.slice(0, idx).trimEnd();

  if (!before.endsWith(',')) {
    before += ',';
  }

  const updated = `${before}\n${block.trim()}\n};\n`;
  fs.writeFileSync(fullPath, updated, 'utf8');
  console.log(`Updated translations with errors: ${file}`);
}


