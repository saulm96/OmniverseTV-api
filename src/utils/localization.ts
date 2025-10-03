const pendingMessages: {[key: string] :string} = {
    es: 'El contenido se está traduciendo a español. Por favor, inténtelo de nuevo en unos segundos.',
    fr: "Le contenu est en cours de traduction en français. Veuillez réessayer dans quelques instants.",
    de: 'Inhalte werden ins Deutsche übersetzt. Bitte versuchen Sie es in Kürken wieder.',
    it: 'Il contenuto è in fase di traduzione in italiano. Riprova tra qualche istante.',
    jp: 'コンテンツは日本語に翻訳中です。数秒後にもう一度お試しください。',
    // Default message for any other language
    default:
      'Content is being translated. Please try again in a few moments.',
  };

  export const getPendingMessage = (lang: string): string => {
    return pendingMessages[lang.toLowerCase()] || pendingMessages.default;
  }