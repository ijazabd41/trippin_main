const fs = require('fs');
const path = require('path');

// Mock translation data for demonstration
// In production, this would be replaced with Google Cloud Translation API calls
const mockTranslations = {
  ar: {
    "common": {
      "loading": "جارٍ التحميل...",
      "error": "حدث خطأ",
      "success": "نجح",
      "cancel": "إلغاء",
      "confirm": "تأكيد",
      "save": "حفظ",
      "delete": "حذف",
      "edit": "تحرير",
      "back": "رجوع",
      "next": "التالي",
      "previous": "السابق",
      "close": "إغلاق",
      "search": "بحث",
      "filter": "تصفية",
      "sort": "ترتيب",
      "select": "اختيار",
      "all": "الكل",
      "none": "لا شيء",
      "yes": "نعم",
      "no": "لا"
    }
  },
  de: {
    "common": {
      "loading": "Wird geladen...",
      "error": "Ein Fehler ist aufgetreten",
      "success": "Erfolgreich",
      "cancel": "Abbrechen",
      "confirm": "Bestätigen",
      "save": "Speichern",
      "delete": "Löschen",
      "edit": "Bearbeiten",
      "back": "Zurück",
      "next": "Weiter",
      "previous": "Vorherige",
      "close": "Schließen",
      "search": "Suchen",
      "filter": "Filter",
      "sort": "Sortieren",
      "select": "Auswählen",
      "all": "Alle",
      "none": "Keine",
      "yes": "Ja",
      "no": "Nein"
    }
  },
  es: {
    "common": {
      "loading": "Cargando...",
      "error": "Ocurrió un error",
      "success": "Éxito",
      "cancel": "Cancelar",
      "confirm": "Confirmar",
      "save": "Guardar",
      "delete": "Eliminar",
      "edit": "Editar",
      "back": "Atrás",
      "next": "Siguiente",
      "previous": "Anterior",
      "close": "Cerrar",
      "search": "Buscar",
      "filter": "Filtrar",
      "sort": "Ordenar",
      "select": "Seleccionar",
      "all": "Todo",
      "none": "Ninguno",
      "yes": "Sí",
      "no": "No"
    }
  },
  fr: {
    "common": {
      "loading": "Chargement...",
      "error": "Une erreur s'est produite",
      "success": "Succès",
      "cancel": "Annuler",
      "confirm": "Confirmer",
      "save": "Enregistrer",
      "delete": "Supprimer",
      "edit": "Modifier",
      "back": "Retour",
      "next": "Suivant",
      "previous": "Précédent",
      "close": "Fermer",
      "search": "Rechercher",
      "filter": "Filtrer",
      "sort": "Trier",
      "select": "Sélectionner",
      "all": "Tout",
      "none": "Aucun",
      "yes": "Oui",
      "no": "Non"
    }
  },
  hi: {
    "common": {
      "loading": "लोड हो रहा है...",
      "error": "एक त्रुटि हुई",
      "success": "सफल",
      "cancel": "रद्द करें",
      "confirm": "पुष्टि करें",
      "save": "सहेजें",
      "delete": "हटाएं",
      "edit": "संपादित करें",
      "back": "वापस",
      "next": "अगला",
      "previous": "पिछला",
      "close": "बंद करें",
      "search": "खोजें",
      "filter": "फ़िल्टर",
      "sort": "क्रमबद्ध करें",
      "select": "चुनें",
      "all": "सभी",
      "none": "कोई नहीं",
      "yes": "हाँ",
      "no": "नहीं"
    }
  },
  id: {
    "common": {
      "loading": "Memuat...",
      "error": "Terjadi kesalahan",
      "success": "Berhasil",
      "cancel": "Batal",
      "confirm": "Konfirmasi",
      "save": "Simpan",
      "delete": "Hapus",
      "edit": "Edit",
      "back": "Kembali",
      "next": "Selanjutnya",
      "previous": "Sebelumnya",
      "close": "Tutup",
      "search": "Cari",
      "filter": "Filter",
      "sort": "Urutkan",
      "select": "Pilih",
      "all": "Semua",
      "none": "Tidak ada",
      "yes": "Ya",
      "no": "Tidak"
    }
  },
  it: {
    "common": {
      "loading": "Caricamento...",
      "error": "Si è verificato un errore",
      "success": "Successo",
      "cancel": "Annulla",
      "confirm": "Conferma",
      "save": "Salva",
      "delete": "Elimina",
      "edit": "Modifica",
      "back": "Indietro",
      "next": "Avanti",
      "previous": "Precedente",
      "close": "Chiudi",
      "search": "Cerca",
      "filter": "Filtra",
      "sort": "Ordina",
      "select": "Seleziona",
      "all": "Tutto",
      "none": "Nessuno",
      "yes": "Sì",
      "no": "No"
    }
  },
  ko: {
    "common": {
      "loading": "로딩 중...",
      "error": "오류가 발생했습니다",
      "success": "성공",
      "cancel": "취소",
      "confirm": "확인",
      "save": "저장",
      "delete": "삭제",
      "edit": "편집",
      "back": "뒤로",
      "next": "다음",
      "previous": "이전",
      "close": "닫기",
      "search": "검색",
      "filter": "필터",
      "sort": "정렬",
      "select": "선택",
      "all": "모두",
      "none": "없음",
      "yes": "예",
      "no": "아니오"
    }
  },
  nl: {
    "common": {
      "loading": "Laden...",
      "error": "Er is een fout opgetreden",
      "success": "Succesvol",
      "cancel": "Annuleren",
      "confirm": "Bevestigen",
      "save": "Opslaan",
      "delete": "Verwijderen",
      "edit": "Bewerken",
      "back": "Terug",
      "next": "Volgende",
      "previous": "Vorige",
      "close": "Sluiten",
      "search": "Zoeken",
      "filter": "Filter",
      "sort": "Sorteren",
      "select": "Selecteren",
      "all": "Alles",
      "none": "Geen",
      "yes": "Ja",
      "no": "Nee"
    }
  },
  pl: {
    "common": {
      "loading": "Ładowanie...",
      "error": "Wystąpił błąd",
      "success": "Sukces",
      "cancel": "Anuluj",
      "confirm": "Potwierdź",
      "save": "Zapisz",
      "delete": "Usuń",
      "edit": "Edytuj",
      "back": "Wstecz",
      "next": "Dalej",
      "previous": "Poprzedni",
      "close": "Zamknij",
      "search": "Szukaj",
      "filter": "Filtruj",
      "sort": "Sortuj",
      "select": "Wybierz",
      "all": "Wszystko",
      "none": "Brak",
      "yes": "Tak",
      "no": "Nie"
    }
  },
  pt: {
    "common": {
      "loading": "Carregando...",
      "error": "Ocorreu um erro",
      "success": "Sucesso",
      "cancel": "Cancelar",
      "confirm": "Confirmar",
      "save": "Salvar",
      "delete": "Excluir",
      "edit": "Editar",
      "back": "Voltar",
      "next": "Próximo",
      "previous": "Anterior",
      "close": "Fechar",
      "search": "Pesquisar",
      "filter": "Filtrar",
      "sort": "Ordenar",
      "select": "Selecionar",
      "all": "Tudo",
      "none": "Nenhum",
      "yes": "Sim",
      "no": "Não"
    }
  },
  ru: {
    "common": {
      "loading": "Загрузка...",
      "error": "Произошла ошибка",
      "success": "Успешно",
      "cancel": "Отмена",
      "confirm": "Подтвердить",
      "save": "Сохранить",
      "delete": "Удалить",
      "edit": "Редактировать",
      "back": "Назад",
      "next": "Далее",
      "previous": "Предыдущий",
      "close": "Закрыть",
      "search": "Поиск",
      "filter": "Фильтр",
      "sort": "Сортировать",
      "select": "Выбрать",
      "all": "Все",
      "none": "Нет",
      "yes": "Да",
      "no": "Нет"
    }
  },
  sv: {
    "common": {
      "loading": "Laddar...",
      "error": "Ett fel uppstod",
      "success": "Framgång",
      "cancel": "Avbryt",
      "confirm": "Bekräfta",
      "save": "Spara",
      "delete": "Ta bort",
      "edit": "Redigera",
      "back": "Tillbaka",
      "next": "Nästa",
      "previous": "Föregående",
      "close": "Stäng",
      "search": "Sök",
      "filter": "Filtrera",
      "sort": "Sortera",
      "select": "Välj",
      "all": "Alla",
      "none": "Ingen",
      "yes": "Ja",
      "no": "Nej"
    }
  },
  th: {
    "common": {
      "loading": "กำลังโหลด...",
      "error": "เกิดข้อผิดพลาด",
      "success": "สำเร็จ",
      "cancel": "ยกเลิก",
      "confirm": "ยืนยัน",
      "save": "บันทึก",
      "delete": "ลบ",
      "edit": "แก้ไข",
      "back": "กลับ",
      "next": "ถัดไป",
      "previous": "ก่อนหน้า",
      "close": "ปิด",
      "search": "ค้นหา",
      "filter": "กรอง",
      "sort": "เรียงลำดับ",
      "select": "เลือก",
      "all": "ทั้งหมด",
      "none": "ไม่มี",
      "yes": "ใช่",
      "no": "ไม่"
    }
  },
  tr: {
    "common": {
      "loading": "Yükleniyor...",
      "error": "Bir hata oluştu",
      "success": "Başarılı",
      "cancel": "İptal",
      "confirm": "Onayla",
      "save": "Kaydet",
      "delete": "Sil",
      "edit": "Düzenle",
      "back": "Geri",
      "next": "İleri",
      "previous": "Önceki",
      "close": "Kapat",
      "search": "Ara",
      "filter": "Filtrele",
      "sort": "Sırala",
      "select": "Seç",
      "all": "Tümü",
      "none": "Hiçbiri",
      "yes": "Evet",
      "no": "Hayır"
    }
  },
  ur: {
    "common": {
      "loading": "لوڈ ہو رہا ہے...",
      "error": "ایک خرابی ہوئی",
      "success": "کامیاب",
      "cancel": "منسوخ",
      "confirm": "تصدیق",
      "save": "محفوظ",
      "delete": "حذف",
      "edit": "ترمیم",
      "back": "واپس",
      "next": "اگلا",
      "previous": "پچھلا",
      "close": "بند",
      "search": "تلاش",
      "filter": "فلٹر",
      "sort": "ترتیب",
      "select": "منتخب",
      "all": "سب",
      "none": "کوئی نہیں",
      "yes": "ہاں",
      "no": "نہیں"
    }
  },
  vi: {
    "common": {
      "loading": "Đang tải...",
      "error": "Đã xảy ra lỗi",
      "success": "Thành công",
      "cancel": "Hủy",
      "confirm": "Xác nhận",
      "save": "Lưu",
      "delete": "Xóa",
      "edit": "Chỉnh sửa",
      "back": "Quay lại",
      "next": "Tiếp theo",
      "previous": "Trước",
      "close": "Đóng",
      "search": "Tìm kiếm",
      "filter": "Lọc",
      "sort": "Sắp xếp",
      "select": "Chọn",
      "all": "Tất cả",
      "none": "Không có",
      "yes": "Có",
      "no": "Không"
    }
  },
  zh: {
    "common": {
      "loading": "加载中...",
      "error": "发生错误",
      "success": "成功",
      "cancel": "取消",
      "confirm": "确认",
      "save": "保存",
      "delete": "删除",
      "edit": "编辑",
      "back": "返回",
      "next": "下一步",
      "previous": "上一步",
      "close": "关闭",
      "search": "搜索",
      "filter": "筛选",
      "sort": "排序",
      "select": "选择",
      "all": "全部",
      "none": "无",
      "yes": "是",
      "no": "否"
    }
  }
};

// Function to get mock translation for a key
function getMockTranslation(key, language) {
  const keys = key.split('.');
  let current = mockTranslations[language];
  
  for (const k of keys) {
    if (current && current[k]) {
      current = current[k];
    } else {
      return null;
    }
  }
  
  return typeof current === 'string' ? current : null;
}

// Function to translate text (mock implementation)
async function translateText(text, targetLanguage) {
  // In a real implementation, this would call Google Cloud Translation API
  // For now, we'll use mock translations for common keys
  const mockTranslation = getMockTranslation(text, targetLanguage);
  
  if (mockTranslation) {
    return mockTranslation;
  }
  
  // For keys not in mock data, return empty string with TODO comment
  return '';
}

// Function to recursively process translation object
async function processTranslationObject(obj, targetLanguage, languageName) {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const translation = await translateText(value, targetLanguage);
      if (translation) {
        result[key] = `"${translation}", // AUTO: translated from Japanese`;
      } else {
        result[key] = `"", // TODO: translate to ${languageName}`;
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await processTranslationObject(value, targetLanguage, languageName);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Function to generate translation file content
function generateTranslationFileContent(translations, languageCode) {
  const content = `const translation = ${JSON.stringify(translations, null, 2)};
export default translation;`;
  
  return content;
}

// Main function to generate all translation files
async function generateAllTranslations() {
  const masterFilePath = path.join(__dirname, 'src', 'i18n', 'translations', 'ja.ts');
  const outputDir = path.join(__dirname, 'src', 'i18n', 'translations');
  
  const targetLanguages = [
    { code: 'ar', name: 'Arabic' },
    { code: 'de', name: 'German' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'hi', name: 'Hindi' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ko', name: 'Korean' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'sv', name: 'Swedish' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ur', name: 'Urdu' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'zh', name: 'Chinese (Simplified)' }
  ];
  
  try {
    // Read the Japanese master file
    const masterContent = fs.readFileSync(masterFilePath, 'utf-8');
    
    // Extract the translation object from the file
    // Remove the export statement and evaluate the object
    const objectContent = masterContent.replace(/^export const ja = /, '').replace(/;$/, '');
    const masterTranslations = eval(`(${objectContent})`);
    
    console.log(`Processing ${Object.keys(masterTranslations).length} top-level keys from Japanese master file...`);
    
    let totalFiles = 0;
    let totalKeys = 0;
    let totalTranslated = 0;
    let totalTodo = 0;
    
    for (const { code, name } of targetLanguages) {
      console.log(`\nGenerating ${code}.ts (${name})...`);
      
      const outputFilePath = path.join(outputDir, `${code}.ts`);
      
      // Process the translation object
      const translations = await processTranslationObject(masterTranslations, code, name);
      
      // Generate file content
      const fileContent = generateTranslationFileContent(translations, code);
      
      // Write the file
      fs.writeFileSync(outputFilePath, fileContent, 'utf-8');
      
      // Count statistics
      const stats = countTranslationStats(translations);
      totalFiles++;
      totalKeys += stats.totalKeys;
      totalTranslated += stats.translated;
      totalTodo += stats.todo;
      
      console.log(`  ✓ Generated ${outputFilePath}`);
      console.log(`  ✓ Keys: ${stats.totalKeys}, Translated: ${stats.translated}, TODO: ${stats.todo}`);
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total files generated: ${totalFiles}`);
    console.log(`Total keys processed: ${totalKeys}`);
    console.log(`Total translated: ${totalTranslated}`);
    console.log(`Total TODO entries: ${totalTodo}`);
    console.log(`Translation coverage: ${((totalTranslated / totalKeys) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error generating translations:', error);
  }
}

// Function to count translation statistics
function countTranslationStats(obj) {
  let totalKeys = 0;
  let translated = 0;
  let todo = 0;
  
  function countRecursive(current) {
    for (const [key, value] of Object.entries(current)) {
      if (typeof value === 'string') {
        totalKeys++;
        if (value.includes('// AUTO: translated from Japanese')) {
          translated++;
        } else if (value.includes('// TODO: translate to')) {
          todo++;
        }
      } else if (typeof value === 'object' && value !== null) {
        countRecursive(value);
      }
    }
  }
  
  countRecursive(obj);
  
  return { totalKeys, translated, todo };
}

// Run the script
generateAllTranslations().catch(console.error);
