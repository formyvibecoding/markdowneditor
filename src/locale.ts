export type SupportedLocale = 'en' | 'fr' | 'de' | 'it' | 'ja' | 'zh-CN' | 'zh-TW';

export interface LocaleMessages {
  APP: {
    TITLE: string;
    PREVIEW_TITLE: string;
    PREVIEW_FALLBACK_TITLE: string;
  };
  BUTTONS: {
    PREVIEW: string;
    SPLIT_PREVIEW: string;
    EDIT_ONLY: string;
    NEW_TAB_PREVIEW: string;
    DOWNLOAD_MARKDOWN: string;
    DOWNLOAD_MARKDOWN_TOOLTIP: (modifier: string) => string;
    PREVIEW_TOOLTIP: (modifier: string) => string;
    OPEN_SPLIT_TOOLTIP: string;
    NEW_TAB_PREVIEW_TOOLTIP: (minWidth: number) => string;
    PAGED_PDF: string;
    SINGLE_PAGE_PDF: string;
    COPY_RICH_TEXT: string;
    COPY_RICH_TEXT_COPIED: string;
    EXPORT_LONG_IMAGE: string;
    HISTORY: string;
    CLEAR_ALL: string;
    CLOSE_HISTORY: string;
  };
  EDITOR: {
    ARIA_LABEL: string;
    PLACEHOLDER: string;
    PREVIEW_FRAME_TITLE: string;
    SPLIT_ACTIONS_ARIA: string;
    SPLIT_VIEW_GROUP_ARIA: string;
    HISTORY_PANEL_ARIA: string;
  };
  SPLIT_VIEW: {
    BALANCED_LABEL: string;
    PREVIEW_FOCUS_LABEL: string;
    BALANCED_TITLE: string;
    PREVIEW_FOCUS_TITLE: string;
    PREVIEW_FOCUS_UNAVAILABLE: (minWidth: number) => string;
    SPLIT_EXITED: (minWidth: number) => string;
    PREVIEW_FOCUS_RESET: (minWidth: number) => string;
    FORCED_NEW_TAB: (minWidth: number) => string;
    PREVIEW_FOCUS_TOO_NARROW: (minWidth: number) => string;
  };
  HISTORY: {
    TITLE: string;
    EMPTY: string;
    DRAFT: string;
    RESTORE: string;
    DELETE: string;
    DELETE_TITLE: string;
    DELETE_MESSAGE: string;
    DELETE_CONFIRM: string;
    RESTORE_TITLE: string;
    RESTORE_MESSAGE: string;
    RESTORE_CONFIRM: string;
    CLEAR_TITLE: string;
    CLEAR_MESSAGE: string;
    CLEAR_CONFIRM: string;
  };
  FEEDBACK: {
    TOAST_INFO: string;
    TOAST_SUCCESS: string;
    TOAST_ERROR: string;
    CLOSE_NOTIFICATION: string;
    DEFAULT_CONFIRM_TITLE: string;
    DEFAULT_CONFIRM_TEXT: string;
    DEFAULT_CANCEL_TEXT: string;
    CLOSE: string;
  };
  PDF_BUTTONS: {
    PAGED: string;
    PAGED_LOADING: string;
    SINGLE: string;
    SINGLE_PREPARING: string;
  };
  COPY_BUTTONS: {
    COPY: string;
    COPYING: string;
    COPIED: string;
  };
  LONG_IMAGE_BUTTONS: {
    DEFAULT: string;
    RENDERING: string;
    GENERATING: string;
  };
  PREVIEW_TOOLS: {
    COPY_TABLE: string;
    COPY_CODE: string;
    COPY_COLOR_VALUE_PREFIX: string;
    PDF_GENERATION_FAILED_PREFIX: string;
    PRINT_PREPARATION_FAILED_PREFIX: string;
    IMAGE_GENERATION_FAILED: string;
    LONG_IMAGE_EXPORT_FAILED_PREFIX: string;
  };
  ERRORS: {
    EMPTY_CONTENT: string;
    EMPTY_CONTENT_PREVIEW: string;
    POPUP_BLOCKED: string;
    PDF_GENERATION_FAILED: string;
    PDF_INIT_FAILED: string;
    CORS_ERROR: string;
    COPY_FAILED: string;
    APP_CRASH: string;
    ACTION_FAILED: string;
  };
  GITHUB: {
    LABEL: string;
  };
  PAGE_NUMBER_FORMAT: (current: number, total: number) => string;
}

const ZH_TRADITIONAL_REGIONS = new Set(['TW', 'HK', 'MO']);
const ZH_SIMPLIFIED_REGIONS = new Set(['CN', 'SG']);
const ZH_TRADITIONAL_TIME_ZONES = new Set([
  'Asia/Taipei',
  'Asia/Hong_Kong',
  'Asia/Macau',
]);
const ZH_SIMPLIFIED_TIME_ZONES = new Set([
  'Asia/Shanghai',
  'Asia/Chongqing',
  'Asia/Harbin',
  'Asia/Urumqi',
  'Asia/Singapore',
]);

function normalizeLanguageTag(tag: string): string {
  return tag.trim().replace(/_/g, '-');
}

function getNavigatorLanguages(nav?: Pick<Navigator, 'languages' | 'language'>): string[] {
  if (!nav) {
    return [];
  }

  if (Array.isArray(nav.languages) && nav.languages.length > 0) {
    return nav.languages.filter((value): value is string => typeof value === 'string');
  }

  return typeof nav.language === 'string' ? [nav.language] : [];
}

function detectChineseLocale(tag: string, timeZone: string): SupportedLocale | null {
  const normalized = normalizeLanguageTag(tag).toLowerCase();
  if (!normalized.startsWith('zh')) {
    return null;
  }

  if (normalized.includes('hant')) {
    return 'zh-TW';
  }

  if (normalized.includes('hans')) {
    return 'zh-CN';
  }

  const region = normalized
    .split('-')
    .slice(1)
    .map(part => part.toUpperCase())
    .find(part => part.length === 2);

  if (region && ZH_TRADITIONAL_REGIONS.has(region)) {
    return 'zh-TW';
  }

  if (region && ZH_SIMPLIFIED_REGIONS.has(region)) {
    return 'zh-CN';
  }

  if (ZH_TRADITIONAL_TIME_ZONES.has(timeZone)) {
    return 'zh-TW';
  }

  if (ZH_SIMPLIFIED_TIME_ZONES.has(timeZone)) {
    return 'zh-CN';
  }

  return 'zh-CN';
}

export function resolveLocaleFromPreferences(
  preferredLanguages: readonly string[],
  timeZone = ''
): SupportedLocale {
  let sawChinese = false;

  for (const candidate of preferredLanguages) {
    const normalized = normalizeLanguageTag(candidate);
    if (!normalized) {
      continue;
    }

    const language = normalized.toLowerCase().split('-')[0];

    switch (language) {
      case 'en':
        return 'en';
      case 'fr':
        return 'fr';
      case 'de':
        return 'de';
      case 'it':
        return 'it';
      case 'ja':
        return 'ja';
      case 'zh': {
        sawChinese = true;
        return detectChineseLocale(normalized, timeZone) ?? 'zh-CN';
      }
      default:
        break;
    }
  }

  if (sawChinese) {
    return detectChineseLocale('zh', timeZone) ?? 'zh-CN';
  }

  return 'en';
}

export function detectLocaleFromNavigator(
  nav?: Pick<Navigator, 'languages' | 'language'>,
  timeZone = ''
): SupportedLocale {
  return resolveLocaleFromPreferences(getNavigatorLanguages(nav), timeZone);
}

function getCurrentTimeZone(): string {
  if (typeof Intl === 'undefined') {
    return '';
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
}

function getCurrentNavigator(): Pick<Navigator, 'languages' | 'language'> | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  return navigator;
}

export const APP_LOCALE = detectLocaleFromNavigator(
  getCurrentNavigator(),
  getCurrentTimeZone()
);

const localeMessages: Record<SupportedLocale, LocaleMessages> = {
  en: {
    APP: {
      TITLE: 'Markdown Editor',
      PREVIEW_TITLE: 'Markdown Preview',
      PREVIEW_FALLBACK_TITLE: 'Markdown',
    },
    BUTTONS: {
      PREVIEW: 'Preview',
      SPLIT_PREVIEW: 'Split preview',
      EDIT_ONLY: 'Editor only',
      NEW_TAB_PREVIEW: 'New tab preview',
      DOWNLOAD_MARKDOWN: 'Download Markdown',
      DOWNLOAD_MARKDOWN_TOOLTIP: modifier => `Download Markdown (${modifier}Enter)`,
      PREVIEW_TOOLTIP: modifier => `Preview (${modifier}P)`,
      OPEN_SPLIT_TOOLTIP: 'Open split preview',
      NEW_TAB_PREVIEW_TOOLTIP: minWidth =>
        `The window is too narrow, so preview will open in a new tab (minimum ${minWidth}px for split preview)`,
      PAGED_PDF: 'Export PDF (paged)',
      SINGLE_PAGE_PDF: 'Save PDF (single page)',
      COPY_RICH_TEXT: 'Copy rich text',
      COPY_RICH_TEXT_COPIED: 'Copied',
      EXPORT_LONG_IMAGE: 'Export long image',
      HISTORY: 'History',
      CLEAR_ALL: 'Clear all',
      CLOSE_HISTORY: 'Close history',
    },
    EDITOR: {
      ARIA_LABEL: 'Markdown editor',
      PLACEHOLDER: 'Write Markdown here...',
      PREVIEW_FRAME_TITLE: 'Markdown preview',
      SPLIT_ACTIONS_ARIA: 'Preview actions',
      SPLIT_VIEW_GROUP_ARIA: 'Preview layout',
      HISTORY_PANEL_ARIA: 'History panel',
    },
    SPLIT_VIEW: {
      BALANCED_LABEL: '1:1',
      PREVIEW_FOCUS_LABEL: '1:2',
      BALANCED_TITLE: 'Editor and preview use equal width',
      PREVIEW_FOCUS_TITLE: 'Keep editor width unchanged and expand preview to twice the width',
      PREVIEW_FOCUS_UNAVAILABLE: minWidth =>
        `The window is too narrow. 1:2 layout requires at least ${minWidth}px`,
      SPLIT_EXITED: minWidth =>
        `The window is too narrow, so split preview was closed. Split preview requires at least ${minWidth}px. Use new tab preview instead.`,
      PREVIEW_FOCUS_RESET: minWidth =>
        `The window is too narrow, so the layout returned to 1:1. 1:2 layout requires at least ${minWidth}px.`,
      FORCED_NEW_TAB: minWidth =>
        `The window is too narrow, so preview opened in a new tab. Split preview requires at least ${minWidth}px.`,
      PREVIEW_FOCUS_TOO_NARROW: minWidth =>
        `The window is too narrow. 1:2 layout requires at least ${minWidth}px.`,
    },
    HISTORY: {
      TITLE: 'History',
      EMPTY: 'No history yet.',
      DRAFT: 'Draft',
      RESTORE: 'Restore',
      DELETE: 'Delete',
      DELETE_TITLE: 'Delete entry',
      DELETE_MESSAGE: 'Delete this history entry?',
      DELETE_CONFIRM: 'Delete',
      RESTORE_TITLE: 'Restore draft',
      RESTORE_MESSAGE: 'Restoring this draft will overwrite the current editor content. Continue?',
      RESTORE_CONFIRM: 'Restore',
      CLEAR_TITLE: 'Clear history',
      CLEAR_MESSAGE: 'Clear all history entries?',
      CLEAR_CONFIRM: 'Clear',
    },
    FEEDBACK: {
      TOAST_INFO: 'Notice',
      TOAST_SUCCESS: 'Done',
      TOAST_ERROR: 'Warning',
      CLOSE_NOTIFICATION: 'Close notification',
      DEFAULT_CONFIRM_TITLE: 'Please confirm',
      DEFAULT_CONFIRM_TEXT: 'Confirm',
      DEFAULT_CANCEL_TEXT: 'Cancel',
      CLOSE: 'Close',
    },
    PDF_BUTTONS: {
      PAGED: 'Export PDF (paged)',
      PAGED_LOADING: 'Generating...',
      SINGLE: 'Save PDF (single page)',
      SINGLE_PREPARING: 'Preparing to print...',
    },
    COPY_BUTTONS: {
      COPY: 'Copy preview',
      COPYING: 'Copying...',
      COPIED: 'Copied',
    },
    LONG_IMAGE_BUTTONS: {
      DEFAULT: 'Export long image',
      RENDERING: 'Rendering...',
      GENERATING: 'Generating image...',
    },
    PREVIEW_TOOLS: {
      COPY_TABLE: 'Copy table',
      COPY_CODE: 'Copy code',
      COPY_COLOR_VALUE_PREFIX: 'Copy color value ',
      PDF_GENERATION_FAILED_PREFIX: 'Failed to generate PDF: ',
      PRINT_PREPARATION_FAILED_PREFIX: 'Failed to prepare print: ',
      IMAGE_GENERATION_FAILED: 'Failed to generate image',
      LONG_IMAGE_EXPORT_FAILED_PREFIX: 'Failed to export long image: ',
    },
    ERRORS: {
      EMPTY_CONTENT: 'The editor is empty. Nothing to download.',
      EMPTY_CONTENT_PREVIEW: 'Enter some content before previewing.',
      POPUP_BLOCKED: 'Unable to open a new tab. Check whether the browser blocked pop-ups.',
      PDF_GENERATION_FAILED: 'Failed to generate PDF',
      PDF_INIT_FAILED: 'Failed to initialize PDF generator',
      CORS_ERROR: 'There may be a cross-origin image loading issue. Check the browser console.',
      COPY_FAILED: 'Copy failed. Check browser permissions and try again.',
      APP_CRASH: 'The app encountered an error. Refresh the page and try again. If the problem continues, contact support.',
      ACTION_FAILED: 'The action failed. Please try again.',
    },
    GITHUB: {
      LABEL: 'GitHub repository',
    },
    PAGE_NUMBER_FORMAT: (current, total) => `${current} / ${total}`,
  },
  fr: {
    APP: {
      TITLE: 'Editeur Markdown',
      PREVIEW_TITLE: 'Aperçu Markdown',
      PREVIEW_FALLBACK_TITLE: 'Markdown',
    },
    BUTTONS: {
      PREVIEW: 'Aperçu',
      SPLIT_PREVIEW: 'Aperçu partagé',
      EDIT_ONLY: 'Editeur seul',
      NEW_TAB_PREVIEW: 'Aperçu dans un nouvel onglet',
      DOWNLOAD_MARKDOWN: 'Télécharger le Markdown',
      DOWNLOAD_MARKDOWN_TOOLTIP: modifier => `Télécharger le Markdown (${modifier}Entrée)`,
      PREVIEW_TOOLTIP: modifier => `Aperçu (${modifier}P)`,
      OPEN_SPLIT_TOOLTIP: "Ouvrir l'aperçu partagé",
      NEW_TAB_PREVIEW_TOOLTIP: minWidth =>
        `La fenêtre est trop étroite, l'aperçu s'ouvrira dans un nouvel onglet (${minWidth}px minimum pour l'aperçu partagé)`,
      PAGED_PDF: 'Exporter le PDF (paginé)',
      SINGLE_PAGE_PDF: 'Enregistrer le PDF (page unique)',
      COPY_RICH_TEXT: 'Copier le texte enrichi',
      COPY_RICH_TEXT_COPIED: 'Copié',
      EXPORT_LONG_IMAGE: "Exporter l'image longue",
      HISTORY: 'Historique',
      CLEAR_ALL: 'Tout effacer',
      CLOSE_HISTORY: "Fermer l'historique",
    },
    EDITOR: {
      ARIA_LABEL: 'Editeur Markdown',
      PLACEHOLDER: 'Ecrivez votre Markdown ici...',
      PREVIEW_FRAME_TITLE: 'Aperçu Markdown',
      SPLIT_ACTIONS_ARIA: "Actions d'aperçu",
      SPLIT_VIEW_GROUP_ARIA: "Disposition de l'aperçu",
      HISTORY_PANEL_ARIA: "Panneau d'historique",
    },
    SPLIT_VIEW: {
      BALANCED_LABEL: '1:1',
      PREVIEW_FOCUS_LABEL: '1:2',
      BALANCED_TITLE: "L'éditeur et l'aperçu ont la même largeur",
      PREVIEW_FOCUS_TITLE:
        "Conserver la largeur de l'éditeur et élargir l'aperçu à deux fois sa largeur",
      PREVIEW_FOCUS_UNAVAILABLE: minWidth =>
        `La fenêtre est trop étroite. La vue 1:2 nécessite au moins ${minWidth}px`,
      SPLIT_EXITED: minWidth =>
        `La fenêtre est trop étroite, l'aperçu partagé a été fermé. Il faut au moins ${minWidth}px. Utilisez plutôt un nouvel onglet.`,
      PREVIEW_FOCUS_RESET: minWidth =>
        `La fenêtre est trop étroite, la vue est revenue à 1:1. La vue 1:2 nécessite au moins ${minWidth}px.`,
      FORCED_NEW_TAB: minWidth =>
        `La fenêtre est trop étroite, l'aperçu a été ouvert dans un nouvel onglet. Il faut au moins ${minWidth}px pour l'aperçu partagé.`,
      PREVIEW_FOCUS_TOO_NARROW: minWidth =>
        `La fenêtre est trop étroite. La vue 1:2 nécessite au moins ${minWidth}px.`,
    },
    HISTORY: {
      TITLE: 'Historique',
      EMPTY: "Aucun historique pour l'instant.",
      DRAFT: 'Brouillon',
      RESTORE: 'Restaurer',
      DELETE: 'Supprimer',
      DELETE_TITLE: "Supprimer l'entrée",
      DELETE_MESSAGE: 'Supprimer cet élément de l’historique ?',
      DELETE_CONFIRM: 'Supprimer',
      RESTORE_TITLE: 'Restaurer le brouillon',
      RESTORE_MESSAGE:
        "Restaurer ce brouillon écrasera le contenu actuel de l'éditeur. Continuer ?",
      RESTORE_CONFIRM: 'Restaurer',
      CLEAR_TITLE: "Effacer l'historique",
      CLEAR_MESSAGE: "Effacer tout l'historique ?",
      CLEAR_CONFIRM: 'Effacer',
    },
    FEEDBACK: {
      TOAST_INFO: 'Info',
      TOAST_SUCCESS: 'Terminé',
      TOAST_ERROR: 'Attention',
      CLOSE_NOTIFICATION: 'Fermer la notification',
      DEFAULT_CONFIRM_TITLE: 'Veuillez confirmer',
      DEFAULT_CONFIRM_TEXT: 'Confirmer',
      DEFAULT_CANCEL_TEXT: 'Annuler',
      CLOSE: 'Fermer',
    },
    PDF_BUTTONS: {
      PAGED: 'Exporter le PDF (paginé)',
      PAGED_LOADING: 'Génération...',
      SINGLE: 'Enregistrer le PDF (page unique)',
      SINGLE_PREPARING: "Préparation de l'impression...",
    },
    COPY_BUTTONS: {
      COPY: "Copier l'aperçu",
      COPYING: 'Copie...',
      COPIED: 'Copié',
    },
    LONG_IMAGE_BUTTONS: {
      DEFAULT: "Exporter l'image longue",
      RENDERING: 'Rendu...',
      GENERATING: "Génération de l'image...",
    },
    PREVIEW_TOOLS: {
      COPY_TABLE: 'Copier le tableau',
      COPY_CODE: 'Copier le code',
      COPY_COLOR_VALUE_PREFIX: 'Copier la valeur de couleur ',
      PDF_GENERATION_FAILED_PREFIX: 'Echec de la génération du PDF : ',
      PRINT_PREPARATION_FAILED_PREFIX: "Echec de la préparation de l'impression : ",
      IMAGE_GENERATION_FAILED: "Echec de la génération de l'image",
      LONG_IMAGE_EXPORT_FAILED_PREFIX: "Echec de l'export de l'image longue : ",
    },
    ERRORS: {
      EMPTY_CONTENT: "L'éditeur est vide. Rien à télécharger.",
      EMPTY_CONTENT_PREVIEW: "Saisissez du contenu avant d'ouvrir l'aperçu.",
      POPUP_BLOCKED:
        "Impossible d'ouvrir un nouvel onglet. Vérifiez si le navigateur bloque les fenêtres pop-up.",
      PDF_GENERATION_FAILED: 'Echec de la génération du PDF',
      PDF_INIT_FAILED: 'Echec de l’initialisation du générateur PDF',
      CORS_ERROR:
        "Un problème de chargement d'image cross-origin est possible. Vérifiez la console du navigateur.",
      COPY_FAILED: 'La copie a échoué. Vérifiez les autorisations du navigateur puis réessayez.',
      APP_CRASH:
        "L'application a rencontré une erreur. Actualisez la page et réessayez. Si le problème persiste, contactez le support.",
      ACTION_FAILED: "L'action a échoué. Veuillez réessayer.",
    },
    GITHUB: {
      LABEL: 'Dépôt GitHub',
    },
    PAGE_NUMBER_FORMAT: (current, total) => `${current} / ${total}`,
  },
  de: {
    APP: {
      TITLE: 'Markdown-Editor',
      PREVIEW_TITLE: 'Markdown-Vorschau',
      PREVIEW_FALLBACK_TITLE: 'Markdown',
    },
    BUTTONS: {
      PREVIEW: 'Vorschau',
      SPLIT_PREVIEW: 'Geteilte Vorschau',
      EDIT_ONLY: 'Nur Editor',
      NEW_TAB_PREVIEW: 'Vorschau im neuen Tab',
      DOWNLOAD_MARKDOWN: 'Markdown herunterladen',
      DOWNLOAD_MARKDOWN_TOOLTIP: modifier => `Markdown herunterladen (${modifier}Eingabe)`,
      PREVIEW_TOOLTIP: modifier => `Vorschau (${modifier}P)`,
      OPEN_SPLIT_TOOLTIP: 'Geteilte Vorschau öffnen',
      NEW_TAB_PREVIEW_TOOLTIP: minWidth =>
        `Das Fenster ist zu schmal, daher wird die Vorschau in einem neuen Tab geöffnet (mindestens ${minWidth}px für geteilte Vorschau)`,
      PAGED_PDF: 'PDF exportieren (mit Seiten)',
      SINGLE_PAGE_PDF: 'PDF speichern (eine Seite)',
      COPY_RICH_TEXT: 'Rich-Text kopieren',
      COPY_RICH_TEXT_COPIED: 'Kopiert',
      EXPORT_LONG_IMAGE: 'Langes Bild exportieren',
      HISTORY: 'Verlauf',
      CLEAR_ALL: 'Alles löschen',
      CLOSE_HISTORY: 'Verlauf schließen',
    },
    EDITOR: {
      ARIA_LABEL: 'Markdown-Editor',
      PLACEHOLDER: 'Markdown hier eingeben...',
      PREVIEW_FRAME_TITLE: 'Markdown-Vorschau',
      SPLIT_ACTIONS_ARIA: 'Vorschauaktionen',
      SPLIT_VIEW_GROUP_ARIA: 'Vorschaulayout',
      HISTORY_PANEL_ARIA: 'Verlaufsfenster',
    },
    SPLIT_VIEW: {
      BALANCED_LABEL: '1:1',
      PREVIEW_FOCUS_LABEL: '1:2',
      BALANCED_TITLE: 'Editor und Vorschau sind gleich breit',
      PREVIEW_FOCUS_TITLE:
        'Editorbreite beibehalten und Vorschau auf die doppelte Breite erweitern',
      PREVIEW_FOCUS_UNAVAILABLE: minWidth =>
        `Das Fenster ist zu schmal. Das 1:2-Layout benötigt mindestens ${minWidth}px`,
      SPLIT_EXITED: minWidth =>
        `Das Fenster ist zu schmal, daher wurde die geteilte Vorschau geschlossen. Sie benötigt mindestens ${minWidth}px. Verwenden Sie stattdessen die Vorschau im neuen Tab.`,
      PREVIEW_FOCUS_RESET: minWidth =>
        `Das Fenster ist zu schmal, daher wurde auf 1:1 zurückgesetzt. Das 1:2-Layout benötigt mindestens ${minWidth}px.`,
      FORCED_NEW_TAB: minWidth =>
        `Das Fenster ist zu schmal, daher wurde die Vorschau in einem neuen Tab geöffnet. Die geteilte Vorschau benötigt mindestens ${minWidth}px.`,
      PREVIEW_FOCUS_TOO_NARROW: minWidth =>
        `Das Fenster ist zu schmal. Das 1:2-Layout benötigt mindestens ${minWidth}px.`,
    },
    HISTORY: {
      TITLE: 'Verlauf',
      EMPTY: 'Noch kein Verlauf vorhanden.',
      DRAFT: 'Entwurf',
      RESTORE: 'Wiederherstellen',
      DELETE: 'Löschen',
      DELETE_TITLE: 'Eintrag löschen',
      DELETE_MESSAGE: 'Diesen Verlaufseintrag löschen?',
      DELETE_CONFIRM: 'Löschen',
      RESTORE_TITLE: 'Entwurf wiederherstellen',
      RESTORE_MESSAGE:
        'Beim Wiederherstellen dieses Entwurfs wird der aktuelle Editorinhalt überschrieben. Fortfahren?',
      RESTORE_CONFIRM: 'Wiederherstellen',
      CLEAR_TITLE: 'Verlauf leeren',
      CLEAR_MESSAGE: 'Den gesamten Verlauf löschen?',
      CLEAR_CONFIRM: 'Leeren',
    },
    FEEDBACK: {
      TOAST_INFO: 'Hinweis',
      TOAST_SUCCESS: 'Erledigt',
      TOAST_ERROR: 'Achtung',
      CLOSE_NOTIFICATION: 'Benachrichtigung schließen',
      DEFAULT_CONFIRM_TITLE: 'Bitte bestätigen',
      DEFAULT_CONFIRM_TEXT: 'Bestätigen',
      DEFAULT_CANCEL_TEXT: 'Abbrechen',
      CLOSE: 'Schließen',
    },
    PDF_BUTTONS: {
      PAGED: 'PDF exportieren (mit Seiten)',
      PAGED_LOADING: 'Wird erstellt...',
      SINGLE: 'PDF speichern (eine Seite)',
      SINGLE_PREPARING: 'Druck wird vorbereitet...',
    },
    COPY_BUTTONS: {
      COPY: 'Vorschau kopieren',
      COPYING: 'Wird kopiert...',
      COPIED: 'Kopiert',
    },
    LONG_IMAGE_BUTTONS: {
      DEFAULT: 'Langes Bild exportieren',
      RENDERING: 'Wird gerendert...',
      GENERATING: 'Bild wird erstellt...',
    },
    PREVIEW_TOOLS: {
      COPY_TABLE: 'Tabelle kopieren',
      COPY_CODE: 'Code kopieren',
      COPY_COLOR_VALUE_PREFIX: 'Farbwert kopieren ',
      PDF_GENERATION_FAILED_PREFIX: 'PDF konnte nicht erstellt werden: ',
      PRINT_PREPARATION_FAILED_PREFIX: 'Druck konnte nicht vorbereitet werden: ',
      IMAGE_GENERATION_FAILED: 'Bild konnte nicht erstellt werden',
      LONG_IMAGE_EXPORT_FAILED_PREFIX: 'Langes Bild konnte nicht exportiert werden: ',
    },
    ERRORS: {
      EMPTY_CONTENT: 'Der Editor ist leer. Nichts zum Herunterladen.',
      EMPTY_CONTENT_PREVIEW: 'Geben Sie zuerst Inhalt ein, bevor Sie die Vorschau öffnen.',
      POPUP_BLOCKED:
        'Ein neuer Tab konnte nicht geöffnet werden. Prüfen Sie, ob der Browser Pop-ups blockiert.',
      PDF_GENERATION_FAILED: 'PDF konnte nicht erstellt werden',
      PDF_INIT_FAILED: 'PDF-Generator konnte nicht initialisiert werden',
      CORS_ERROR:
        'Möglicherweise gibt es ein Problem beim laden von Bildern über Cross-Origin. Prüfen Sie die Browser-Konsole.',
      COPY_FAILED: 'Kopieren fehlgeschlagen. Prüfen Sie die Browserberechtigungen und versuchen Sie es erneut.',
      APP_CRASH:
        'Die Anwendung ist auf einen Fehler gestoßen. Laden Sie die Seite neu und versuchen Sie es erneut. Wenn das Problem weiterhin besteht, wenden Sie sich an den Support.',
      ACTION_FAILED: 'Die Aktion ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
    },
    GITHUB: {
      LABEL: 'GitHub-Repository',
    },
    PAGE_NUMBER_FORMAT: (current, total) => `${current} / ${total}`,
  },
  it: {
    APP: {
      TITLE: 'Editor Markdown',
      PREVIEW_TITLE: 'Anteprima Markdown',
      PREVIEW_FALLBACK_TITLE: 'Markdown',
    },
    BUTTONS: {
      PREVIEW: 'Anteprima',
      SPLIT_PREVIEW: 'Anteprima divisa',
      EDIT_ONLY: 'Solo editor',
      NEW_TAB_PREVIEW: 'Anteprima in nuova scheda',
      DOWNLOAD_MARKDOWN: 'Scarica Markdown',
      DOWNLOAD_MARKDOWN_TOOLTIP: modifier => `Scarica Markdown (${modifier}Invio)`,
      PREVIEW_TOOLTIP: modifier => `Anteprima (${modifier}P)`,
      OPEN_SPLIT_TOOLTIP: "Apri l'anteprima divisa",
      NEW_TAB_PREVIEW_TOOLTIP: minWidth =>
        `La finestra è troppo stretta, quindi l'anteprima verrà aperta in una nuova scheda (minimo ${minWidth}px per l'anteprima divisa)`,
      PAGED_PDF: 'Esporta PDF (paginato)',
      SINGLE_PAGE_PDF: 'Salva PDF (pagina singola)',
      COPY_RICH_TEXT: 'Copia testo formattato',
      COPY_RICH_TEXT_COPIED: 'Copiato',
      EXPORT_LONG_IMAGE: 'Esporta immagine lunga',
      HISTORY: 'Cronologia',
      CLEAR_ALL: 'Cancella tutto',
      CLOSE_HISTORY: 'Chiudi cronologia',
    },
    EDITOR: {
      ARIA_LABEL: 'Editor Markdown',
      PLACEHOLDER: 'Scrivi qui il Markdown...',
      PREVIEW_FRAME_TITLE: 'Anteprima Markdown',
      SPLIT_ACTIONS_ARIA: 'Azioni anteprima',
      SPLIT_VIEW_GROUP_ARIA: 'Layout anteprima',
      HISTORY_PANEL_ARIA: 'Pannello cronologia',
    },
    SPLIT_VIEW: {
      BALANCED_LABEL: '1:1',
      PREVIEW_FOCUS_LABEL: '1:2',
      BALANCED_TITLE: "Editor e anteprima hanno la stessa larghezza",
      PREVIEW_FOCUS_TITLE:
        "Mantieni invariata la larghezza dell'editor ed espandi l'anteprima al doppio",
      PREVIEW_FOCUS_UNAVAILABLE: minWidth =>
        `La finestra è troppo stretta. La vista 1:2 richiede almeno ${minWidth}px`,
      SPLIT_EXITED: minWidth =>
        `La finestra è troppo stretta, quindi l'anteprima divisa è stata chiusa. Richiede almeno ${minWidth}px. Usa invece l'anteprima in una nuova scheda.`,
      PREVIEW_FOCUS_RESET: minWidth =>
        `La finestra è troppo stretta, quindi la vista è tornata a 1:1. La vista 1:2 richiede almeno ${minWidth}px.`,
      FORCED_NEW_TAB: minWidth =>
        `La finestra è troppo stretta, quindi l'anteprima è stata aperta in una nuova scheda. L'anteprima divisa richiede almeno ${minWidth}px.`,
      PREVIEW_FOCUS_TOO_NARROW: minWidth =>
        `La finestra è troppo stretta. La vista 1:2 richiede almeno ${minWidth}px.`,
    },
    HISTORY: {
      TITLE: 'Cronologia',
      EMPTY: 'Nessuna cronologia disponibile.',
      DRAFT: 'Bozza',
      RESTORE: 'Ripristina',
      DELETE: 'Elimina',
      DELETE_TITLE: 'Elimina voce',
      DELETE_MESSAGE: 'Eliminare questa voce della cronologia?',
      DELETE_CONFIRM: 'Elimina',
      RESTORE_TITLE: 'Ripristina bozza',
      RESTORE_MESSAGE:
        "Il ripristino di questa bozza sovrascriverà il contenuto attuale dell'editor. Continuare?",
      RESTORE_CONFIRM: 'Ripristina',
      CLEAR_TITLE: 'Cancella cronologia',
      CLEAR_MESSAGE: 'Cancellare tutta la cronologia?',
      CLEAR_CONFIRM: 'Cancella',
    },
    FEEDBACK: {
      TOAST_INFO: 'Avviso',
      TOAST_SUCCESS: 'Fatto',
      TOAST_ERROR: 'Attenzione',
      CLOSE_NOTIFICATION: 'Chiudi notifica',
      DEFAULT_CONFIRM_TITLE: 'Conferma',
      DEFAULT_CONFIRM_TEXT: 'Conferma',
      DEFAULT_CANCEL_TEXT: 'Annulla',
      CLOSE: 'Chiudi',
    },
    PDF_BUTTONS: {
      PAGED: 'Esporta PDF (paginato)',
      PAGED_LOADING: 'Generazione in corso...',
      SINGLE: 'Salva PDF (pagina singola)',
      SINGLE_PREPARING: 'Preparazione della stampa...',
    },
    COPY_BUTTONS: {
      COPY: "Copia l'anteprima",
      COPYING: 'Copia in corso...',
      COPIED: 'Copiato',
    },
    LONG_IMAGE_BUTTONS: {
      DEFAULT: 'Esporta immagine lunga',
      RENDERING: 'Rendering in corso...',
      GENERATING: 'Generazione immagine...',
    },
    PREVIEW_TOOLS: {
      COPY_TABLE: 'Copia tabella',
      COPY_CODE: 'Copia codice',
      COPY_COLOR_VALUE_PREFIX: 'Copia valore colore ',
      PDF_GENERATION_FAILED_PREFIX: 'Errore durante la generazione del PDF: ',
      PRINT_PREPARATION_FAILED_PREFIX: 'Errore durante la preparazione della stampa: ',
      IMAGE_GENERATION_FAILED: "Errore nella generazione dell'immagine",
      LONG_IMAGE_EXPORT_FAILED_PREFIX: "Errore nell'esportazione dell'immagine lunga: ",
    },
    ERRORS: {
      EMPTY_CONTENT: "L'editor è vuoto. Non c'è nulla da scaricare.",
      EMPTY_CONTENT_PREVIEW: "Inserisci del contenuto prima di aprire l'anteprima.",
      POPUP_BLOCKED:
        'Impossibile aprire una nuova scheda. Verifica che il browser non stia bloccando i popup.',
      PDF_GENERATION_FAILED: 'Errore durante la generazione del PDF',
      PDF_INIT_FAILED: "Errore durante l'inizializzazione del generatore PDF",
      CORS_ERROR:
        "Potrebbe esserci un problema di caricamento immagini cross-origin. Controlla la console del browser.",
      COPY_FAILED: 'Copia non riuscita. Controlla i permessi del browser e riprova.',
      APP_CRASH:
        "L'applicazione ha riscontrato un errore. Ricarica la pagina e riprova. Se il problema continua, contatta il supporto.",
      ACTION_FAILED: "L'azione non è riuscita. Riprova.",
    },
    GITHUB: {
      LABEL: 'Repository GitHub',
    },
    PAGE_NUMBER_FORMAT: (current, total) => `${current} / ${total}`,
  },
  ja: {
    APP: {
      TITLE: 'Markdownエディタ',
      PREVIEW_TITLE: 'Markdownプレビュー',
      PREVIEW_FALLBACK_TITLE: 'Markdown',
    },
    BUTTONS: {
      PREVIEW: 'プレビュー',
      SPLIT_PREVIEW: '分割プレビュー',
      EDIT_ONLY: '編集のみ',
      NEW_TAB_PREVIEW: '新しいタブでプレビュー',
      DOWNLOAD_MARKDOWN: 'Markdownをダウンロード',
      DOWNLOAD_MARKDOWN_TOOLTIP: modifier => `Markdownをダウンロード (${modifier}Enter)`,
      PREVIEW_TOOLTIP: modifier => `プレビュー (${modifier}P)`,
      OPEN_SPLIT_TOOLTIP: '分割プレビューを開く',
      NEW_TAB_PREVIEW_TOOLTIP: minWidth =>
        `ウィンドウ幅が足りないため、新しいタブでプレビューします（分割プレビューには最低 ${minWidth}px が必要です）`,
      PAGED_PDF: 'PDFを書き出す（ページ分割）',
      SINGLE_PAGE_PDF: 'PDFを保存（単一ページ）',
      COPY_RICH_TEXT: 'リッチテキストをコピー',
      COPY_RICH_TEXT_COPIED: 'コピーしました',
      EXPORT_LONG_IMAGE: '長い画像を書き出す',
      HISTORY: '履歴',
      CLEAR_ALL: 'すべて削除',
      CLOSE_HISTORY: '履歴を閉じる',
    },
    EDITOR: {
      ARIA_LABEL: 'Markdownエディタ',
      PLACEHOLDER: 'ここにMarkdownを入力してください...',
      PREVIEW_FRAME_TITLE: 'Markdownプレビュー',
      SPLIT_ACTIONS_ARIA: 'プレビュー操作',
      SPLIT_VIEW_GROUP_ARIA: 'プレビュー表示比率',
      HISTORY_PANEL_ARIA: '履歴パネル',
    },
    SPLIT_VIEW: {
      BALANCED_LABEL: '1:1',
      PREVIEW_FOCUS_LABEL: '1:2',
      BALANCED_TITLE: '編集領域とプレビュー領域を同じ幅で表示',
      PREVIEW_FOCUS_TITLE: '編集領域の幅を保ったまま、プレビューを2倍幅に拡張',
      PREVIEW_FOCUS_UNAVAILABLE: minWidth =>
        `ウィンドウ幅が不足しています。1:2レイアウトには最低 ${minWidth}px が必要です`,
      SPLIT_EXITED: minWidth =>
        `ウィンドウ幅が不足しているため、分割プレビューを終了しました。分割プレビューには最低 ${minWidth}px が必要です。新しいタブでのプレビューを利用してください。`,
      PREVIEW_FOCUS_RESET: minWidth =>
        `ウィンドウ幅が不足しているため、1:1表示に戻しました。1:2レイアウトには最低 ${minWidth}px が必要です。`,
      FORCED_NEW_TAB: minWidth =>
        `ウィンドウ幅が不足しているため、新しいタブでプレビューを開きました。分割プレビューには最低 ${minWidth}px が必要です。`,
      PREVIEW_FOCUS_TOO_NARROW: minWidth =>
        `ウィンドウ幅が不足しています。1:2レイアウトには最低 ${minWidth}px が必要です。`,
    },
    HISTORY: {
      TITLE: '履歴',
      EMPTY: '履歴はまだありません。',
      DRAFT: '下書き',
      RESTORE: '復元',
      DELETE: '削除',
      DELETE_TITLE: '履歴を削除',
      DELETE_MESSAGE: 'この履歴を削除しますか？',
      DELETE_CONFIRM: '削除',
      RESTORE_TITLE: '下書きを復元',
      RESTORE_MESSAGE: 'この下書きを復元すると、現在の編集内容が上書きされます。続行しますか？',
      RESTORE_CONFIRM: '復元',
      CLEAR_TITLE: '履歴を消去',
      CLEAR_MESSAGE: 'すべての履歴を消去しますか？',
      CLEAR_CONFIRM: '消去',
    },
    FEEDBACK: {
      TOAST_INFO: 'お知らせ',
      TOAST_SUCCESS: '完了',
      TOAST_ERROR: '注意',
      CLOSE_NOTIFICATION: '通知を閉じる',
      DEFAULT_CONFIRM_TITLE: '確認してください',
      DEFAULT_CONFIRM_TEXT: '確認',
      DEFAULT_CANCEL_TEXT: 'キャンセル',
      CLOSE: '閉じる',
    },
    PDF_BUTTONS: {
      PAGED: 'PDFを書き出す（ページ分割）',
      PAGED_LOADING: '生成中...',
      SINGLE: 'PDFを保存（単一ページ）',
      SINGLE_PREPARING: '印刷を準備中...',
    },
    COPY_BUTTONS: {
      COPY: 'プレビューをコピー',
      COPYING: 'コピー中...',
      COPIED: 'コピーしました',
    },
    LONG_IMAGE_BUTTONS: {
      DEFAULT: '長い画像を書き出す',
      RENDERING: 'レンダリング中...',
      GENERATING: '画像を生成中...',
    },
    PREVIEW_TOOLS: {
      COPY_TABLE: '表をコピー',
      COPY_CODE: 'コードをコピー',
      COPY_COLOR_VALUE_PREFIX: '色コードをコピー ',
      PDF_GENERATION_FAILED_PREFIX: 'PDFの生成に失敗しました: ',
      PRINT_PREPARATION_FAILED_PREFIX: '印刷の準備に失敗しました: ',
      IMAGE_GENERATION_FAILED: '画像の生成に失敗しました',
      LONG_IMAGE_EXPORT_FAILED_PREFIX: '長い画像の書き出しに失敗しました: ',
    },
    ERRORS: {
      EMPTY_CONTENT: 'エディタが空のため、ダウンロードできません。',
      EMPTY_CONTENT_PREVIEW: 'プレビューする前に内容を入力してください。',
      POPUP_BLOCKED: '新しいタブを開けませんでした。ブラウザのポップアップ設定を確認してください。',
      PDF_GENERATION_FAILED: 'PDFの生成中にエラーが発生しました',
      PDF_INIT_FAILED: 'PDF生成機能の初期化に失敗しました',
      CORS_ERROR:
        '画像のクロスオリジン読み込みに問題がある可能性があります。ブラウザのコンソールを確認してください。',
      COPY_FAILED: 'コピーに失敗しました。ブラウザの権限を確認して再試行してください。',
      APP_CRASH:
        'アプリでエラーが発生しました。ページを再読み込みして再試行してください。問題が続く場合はサポートに連絡してください。',
      ACTION_FAILED: '操作に失敗しました。もう一度お試しください。',
    },
    GITHUB: {
      LABEL: 'GitHubリポジトリ',
    },
    PAGE_NUMBER_FORMAT: (current, total) => `${current} / ${total}`,
  },
  'zh-CN': {
    APP: {
      TITLE: 'Markdown 编辑器',
      PREVIEW_TITLE: 'Markdown 预览',
      PREVIEW_FALLBACK_TITLE: 'Markdown',
    },
    BUTTONS: {
      PREVIEW: '预览',
      SPLIT_PREVIEW: '分屏预览',
      EDIT_ONLY: '仅编辑',
      NEW_TAB_PREVIEW: '新窗口预览',
      DOWNLOAD_MARKDOWN: '下载笔记',
      DOWNLOAD_MARKDOWN_TOOLTIP: modifier => `下载 MD（${modifier}Enter）`,
      PREVIEW_TOOLTIP: modifier => `预览（${modifier}P）`,
      OPEN_SPLIT_TOOLTIP: '打开分屏预览',
      NEW_TAB_PREVIEW_TOOLTIP: minWidth =>
        `当前窗口较窄，将使用新窗口预览（至少 ${minWidth}px）`,
      PAGED_PDF: '下载 PDF（分页）',
      SINGLE_PAGE_PDF: '下载 PDF（单页）',
      COPY_RICH_TEXT: '复制富文本',
      COPY_RICH_TEXT_COPIED: '已复制',
      EXPORT_LONG_IMAGE: '导出长图',
      HISTORY: '历史记录',
      CLEAR_ALL: '清空全部',
      CLOSE_HISTORY: '关闭历史记录',
    },
    EDITOR: {
      ARIA_LABEL: 'Markdown 编辑区',
      PLACEHOLDER: '在这里输入 Markdown 内容...',
      PREVIEW_FRAME_TITLE: 'Markdown 预览',
      SPLIT_ACTIONS_ARIA: '预览操作',
      SPLIT_VIEW_GROUP_ARIA: '预览视图比例',
      HISTORY_PANEL_ARIA: '历史记录弹窗',
    },
    SPLIT_VIEW: {
      BALANCED_LABEL: '1:1',
      PREVIEW_FOCUS_LABEL: '1:2',
      BALANCED_TITLE: '编辑区与预览区等宽',
      PREVIEW_FOCUS_TITLE: '保持编辑区不变，扩张预览区到两倍宽',
      PREVIEW_FOCUS_UNAVAILABLE: minWidth =>
        `当前窗口宽度不足，至少 ${minWidth}px 可使用 1:2 视图`,
      SPLIT_EXITED: minWidth =>
        `窗口宽度不足，已退出分屏预览。分屏至少需要 ${minWidth}px，请使用新窗口预览。`,
      PREVIEW_FOCUS_RESET: minWidth =>
        `窗口宽度不足，已切回 1:1 视图。1:2 视图至少需要 ${minWidth}px。`,
      FORCED_NEW_TAB: minWidth =>
        `当前窗口宽度不足，已改为新窗口预览。分屏至少需要 ${minWidth}px。`,
      PREVIEW_FOCUS_TOO_NARROW: minWidth =>
        `当前窗口宽度不足，1:2 视图至少需要 ${minWidth}px。`,
    },
    HISTORY: {
      TITLE: '历史记录',
      EMPTY: '暂无历史记录。',
      DRAFT: '草稿',
      RESTORE: '恢复',
      DELETE: '删除',
      DELETE_TITLE: '删除记录',
      DELETE_MESSAGE: '确定删除这条历史记录吗？',
      DELETE_CONFIRM: '删除',
      RESTORE_TITLE: '恢复草稿',
      RESTORE_MESSAGE: '恢复该草稿将覆盖当前编辑内容，是否继续？',
      RESTORE_CONFIRM: '恢复',
      CLEAR_TITLE: '清空历史记录',
      CLEAR_MESSAGE: '确定清空全部历史记录吗？',
      CLEAR_CONFIRM: '清空',
    },
    FEEDBACK: {
      TOAST_INFO: '提示',
      TOAST_SUCCESS: '完成',
      TOAST_ERROR: '注意',
      CLOSE_NOTIFICATION: '关闭通知',
      DEFAULT_CONFIRM_TITLE: '请确认操作',
      DEFAULT_CONFIRM_TEXT: '确定',
      DEFAULT_CANCEL_TEXT: '取消',
      CLOSE: '关闭',
    },
    PDF_BUTTONS: {
      PAGED: '下载 PDF（分页）',
      PAGED_LOADING: '正在生成...',
      SINGLE: '下载 PDF（单页）',
      SINGLE_PREPARING: '正在准备打印...',
    },
    COPY_BUTTONS: {
      COPY: '复制预览',
      COPYING: '正在复制...',
      COPIED: '已复制',
    },
    LONG_IMAGE_BUTTONS: {
      DEFAULT: '导出长图',
      RENDERING: '正在渲染...',
      GENERATING: '正在生成图片...',
    },
    PREVIEW_TOOLS: {
      COPY_TABLE: '复制表格',
      COPY_CODE: '复制代码',
      COPY_COLOR_VALUE_PREFIX: '复制颜色值 ',
      PDF_GENERATION_FAILED_PREFIX: '生成 PDF 时出错: ',
      PRINT_PREPARATION_FAILED_PREFIX: '准备打印时出错: ',
      IMAGE_GENERATION_FAILED: '图片生成失败',
      LONG_IMAGE_EXPORT_FAILED_PREFIX: '导出长图时出错: ',
    },
    ERRORS: {
      EMPTY_CONTENT: '编辑器内容为空，无法下载。',
      EMPTY_CONTENT_PREVIEW: '请先输入内容，再进行预览。',
      POPUP_BLOCKED: '无法打开新标签页，请检查浏览器设置是否阻止了弹出窗口。',
      PDF_GENERATION_FAILED: '生成 PDF 时出错',
      PDF_INIT_FAILED: '初始化 PDF 生成器出错',
      CORS_ERROR: '可能存在跨域图片加载问题，请检查浏览器控制台。',
      COPY_FAILED: '复制失败，请检查浏览器权限后重试。',
      APP_CRASH: '应用发生错误，请刷新页面重试。如果问题持续存在，请联系技术支持。',
      ACTION_FAILED: '操作失败，请重试。',
    },
    GITHUB: {
      LABEL: 'GitHub 仓库',
    },
    PAGE_NUMBER_FORMAT: (current, total) => `${current} / ${total}`,
  },
  'zh-TW': {
    APP: {
      TITLE: 'Markdown 編輯器',
      PREVIEW_TITLE: 'Markdown 預覽',
      PREVIEW_FALLBACK_TITLE: 'Markdown',
    },
    BUTTONS: {
      PREVIEW: '預覽',
      SPLIT_PREVIEW: '分割預覽',
      EDIT_ONLY: '僅編輯',
      NEW_TAB_PREVIEW: '新分頁預覽',
      DOWNLOAD_MARKDOWN: '下載筆記',
      DOWNLOAD_MARKDOWN_TOOLTIP: modifier => `下載 MD（${modifier}Enter）`,
      PREVIEW_TOOLTIP: modifier => `預覽（${modifier}P）`,
      OPEN_SPLIT_TOOLTIP: '開啟分割預覽',
      NEW_TAB_PREVIEW_TOOLTIP: minWidth =>
        `目前視窗較窄，將改用新分頁預覽（至少需要 ${minWidth}px）`,
      PAGED_PDF: '下載 PDF（分頁）',
      SINGLE_PAGE_PDF: '下載 PDF（單頁）',
      COPY_RICH_TEXT: '複製富文字',
      COPY_RICH_TEXT_COPIED: '已複製',
      EXPORT_LONG_IMAGE: '匯出長圖',
      HISTORY: '歷史紀錄',
      CLEAR_ALL: '清空全部',
      CLOSE_HISTORY: '關閉歷史紀錄',
    },
    EDITOR: {
      ARIA_LABEL: 'Markdown 編輯區',
      PLACEHOLDER: '在這裡輸入 Markdown 內容...',
      PREVIEW_FRAME_TITLE: 'Markdown 預覽',
      SPLIT_ACTIONS_ARIA: '預覽操作',
      SPLIT_VIEW_GROUP_ARIA: '預覽視圖比例',
      HISTORY_PANEL_ARIA: '歷史紀錄視窗',
    },
    SPLIT_VIEW: {
      BALANCED_LABEL: '1:1',
      PREVIEW_FOCUS_LABEL: '1:2',
      BALANCED_TITLE: '編輯區與預覽區等寬',
      PREVIEW_FOCUS_TITLE: '保持編輯區寬度不變，將預覽區擴展為兩倍寬',
      PREVIEW_FOCUS_UNAVAILABLE: minWidth =>
        `目前視窗寬度不足，至少需要 ${minWidth}px 才能使用 1:2 視圖`,
      SPLIT_EXITED: minWidth =>
        `視窗寬度不足，已退出分割預覽。分割預覽至少需要 ${minWidth}px，請改用新分頁預覽。`,
      PREVIEW_FOCUS_RESET: minWidth =>
        `視窗寬度不足，已切回 1:1 視圖。1:2 視圖至少需要 ${minWidth}px。`,
      FORCED_NEW_TAB: minWidth =>
        `目前視窗寬度不足，已改用新分頁預覽。分割預覽至少需要 ${minWidth}px。`,
      PREVIEW_FOCUS_TOO_NARROW: minWidth =>
        `目前視窗寬度不足，1:2 視圖至少需要 ${minWidth}px。`,
    },
    HISTORY: {
      TITLE: '歷史紀錄',
      EMPTY: '目前沒有歷史紀錄。',
      DRAFT: '草稿',
      RESTORE: '還原',
      DELETE: '刪除',
      DELETE_TITLE: '刪除紀錄',
      DELETE_MESSAGE: '確定要刪除這筆歷史紀錄嗎？',
      DELETE_CONFIRM: '刪除',
      RESTORE_TITLE: '還原草稿',
      RESTORE_MESSAGE: '還原此草稿會覆蓋目前的編輯內容，是否繼續？',
      RESTORE_CONFIRM: '還原',
      CLEAR_TITLE: '清空歷史紀錄',
      CLEAR_MESSAGE: '確定要清空全部歷史紀錄嗎？',
      CLEAR_CONFIRM: '清空',
    },
    FEEDBACK: {
      TOAST_INFO: '提示',
      TOAST_SUCCESS: '完成',
      TOAST_ERROR: '注意',
      CLOSE_NOTIFICATION: '關閉通知',
      DEFAULT_CONFIRM_TITLE: '請確認操作',
      DEFAULT_CONFIRM_TEXT: '確認',
      DEFAULT_CANCEL_TEXT: '取消',
      CLOSE: '關閉',
    },
    PDF_BUTTONS: {
      PAGED: '下載 PDF（分頁）',
      PAGED_LOADING: '正在產生...',
      SINGLE: '下載 PDF（單頁）',
      SINGLE_PREPARING: '正在準備列印...',
    },
    COPY_BUTTONS: {
      COPY: '複製預覽',
      COPYING: '正在複製...',
      COPIED: '已複製',
    },
    LONG_IMAGE_BUTTONS: {
      DEFAULT: '匯出長圖',
      RENDERING: '正在渲染...',
      GENERATING: '正在產生圖片...',
    },
    PREVIEW_TOOLS: {
      COPY_TABLE: '複製表格',
      COPY_CODE: '複製程式碼',
      COPY_COLOR_VALUE_PREFIX: '複製顏色值 ',
      PDF_GENERATION_FAILED_PREFIX: '產生 PDF 時發生錯誤: ',
      PRINT_PREPARATION_FAILED_PREFIX: '準備列印時發生錯誤: ',
      IMAGE_GENERATION_FAILED: '圖片產生失敗',
      LONG_IMAGE_EXPORT_FAILED_PREFIX: '匯出長圖時發生錯誤: ',
    },
    ERRORS: {
      EMPTY_CONTENT: '編輯器內容為空，無法下載。',
      EMPTY_CONTENT_PREVIEW: '請先輸入內容，再進行預覽。',
      POPUP_BLOCKED: '無法開啟新分頁，請檢查瀏覽器是否阻擋彈出視窗。',
      PDF_GENERATION_FAILED: '產生 PDF 時發生錯誤',
      PDF_INIT_FAILED: '初始化 PDF 產生器失敗',
      CORS_ERROR: '可能有跨來源圖片載入問題，請檢查瀏覽器主控台。',
      COPY_FAILED: '複製失敗，請檢查瀏覽器權限後再試一次。',
      APP_CRASH: '應用程式發生錯誤，請重新整理頁面後再試。若問題持續，請聯絡技術支援。',
      ACTION_FAILED: '操作失敗，請再試一次。',
    },
    GITHUB: {
      LABEL: 'GitHub 儲存庫',
    },
    PAGE_NUMBER_FORMAT: (current, total) => `${current} / ${total}`,
  },
};

export function getLocaleMessages(locale: SupportedLocale): LocaleMessages {
  return localeMessages[locale];
}
