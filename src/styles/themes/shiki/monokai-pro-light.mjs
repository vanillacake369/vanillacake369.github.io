const monokaiProLight = {
  name: 'monokai-pro-light',
  type: 'light',
  colors: {
    'editor.background': '#fff9f1',
    'editor.foreground': '#403e41',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#b3a79a', fontStyle: 'italic' },
    },
    {
      scope: ['string', 'constant.other.symbol'],
      settings: { foreground: '#c98a00' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character.escape'],
      settings: { foreground: '#8b63ff' },
    },
    {
      scope: ['keyword', 'storage', 'storage.modifier'],
      settings: { foreground: '#ff5f87' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'variable.function'],
      settings: { foreground: '#2d8fcb' },
    },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type'],
      settings: { foreground: '#7a9a01' },
    },
    {
      scope: ['variable.parameter'],
      settings: { foreground: '#d16d00', fontStyle: 'italic' },
    },
    {
      scope: ['variable', 'meta.object-literal.key', 'support.variable'],
      settings: { foreground: '#5b524d' },
    },
    {
      scope: ['punctuation', 'meta.brace', 'meta.delimiter'],
      settings: { foreground: '#8b8077' },
    },
    {
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: '#ffffff', background: '#ff5f87' },
    },
  ],
};

export default monokaiProLight;
