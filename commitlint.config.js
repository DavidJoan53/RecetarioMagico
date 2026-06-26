/**
 * Commit message convention for RecetarioMagico.
 *
 * Format:  <type>: :gitmoji: <Subject>
 * Example: feat: :sparkles: Add recipe calendar view
 *
 * Recommended type -> gitmoji map (see CLAUDE.md for the full list):
 *   feat -> :sparkles:   fix -> :bug:        docs -> :memo:
 *   style -> :art:       refactor -> :recycle:  perf -> :zap:
 *   test -> :white_check_mark:  build -> :package:  ci -> :construction_worker:
 *   chore -> :wrench:    revert -> :rewind:
 */

// Matches a leading gitmoji shortcode followed by a space and some text,
// e.g. ":sparkles: Add ...". Shortcodes are lowercase a-z, 0-9, _, +, -.
const GITMOJI_PATTERN = /^:[a-z0-9_+-]+:\s+\S/

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-gitmoji': ({subject}) => [
          GITMOJI_PATTERN.test(subject || ''),
          'subject must start with a gitmoji shortcode, e.g. "feat: :sparkles: Add recipe view"',
        ],
      },
    },
  ],
  rules: {
    // Require the gitmoji right after the type.
    'subject-gitmoji': [2, 'always'],
    // Our subjects are free-form and may start with a capital (e.g. "Redux setup"),
    // so don't enforce a specific subject case.
    'subject-case': [0],
  },
}
