const monokaiDeepDark = {
  name: 'monokai-deep-dark',
  type: 'dark',
  colors: {
    'editor.background': '#000000',
    'editor.foreground': '#f8f8f2',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#75715e', fontStyle: 'italic' },
    },
    {
      scope: ['string', 'constant.other.symbol'],
      settings: { foreground: '#e6db74' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character.escape'],
      settings: { foreground: '#ae81ff' },
    },
    {
      scope: ['keyword', 'storage', 'storage.modifier'],
      settings: { foreground: '#f92672' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'variable.function'],
      settings: { foreground: '#66d9ef' },
    },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type'],
      settings: { foreground: '#a6e22e' },
    },
    {
      scope: ['variable.parameter'],
      settings: { foreground: '#fd971f', fontStyle: 'italic' },
    },
    {
      scope: ['variable', 'meta.object-literal.key', 'support.variable'],
      settings: { foreground: '#f8f8f2' },
    },
    {
      scope: ['punctuation', 'meta.brace', 'meta.delimiter'],
      settings: { foreground: '#f8f8f2' },
    },
    {
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: '#000000', background: '#f92672' },
    },
  ],
};

export default monokaiDeepDark;
