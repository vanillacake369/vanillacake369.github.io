export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'post', 'style',
      'docs', 'test', 'chore', 'ci', 'perf', 'revert',
    ]],
    'subject-max-length': [1, 'always', 120],
    'subject-case': [0],
  },
};
