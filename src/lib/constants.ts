export const PRIMARY = {
  50: '#e8f7fc',
  100: '#c8ecf7',
  200: '#9ddcf0',
  300: '#6CC3E0',
  400: '#4ab0d0',
  500: '#3a9cc0',
  600: '#2d84a8',
  700: '#236b8a',
  800: '#1a526b',
  900: '#11394d',
} as const;

export const CHART_COLORS = [
  '#6CC3E0',
  '#4ab0d0',
  '#9ddcf0',
  '#3a9cc0',
  '#2d84a8',
  '#236b8a',
  '#c8ecf7',
  '#1a526b',
] as const;

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export const APP_NAME = 'allExamsPYQ';

export const REPORT_REASONS = [
  'Incorrect answer marked as correct',
  'Question text has errors',
  'Options are incomplete or wrong',
  'Explanation is incorrect',
  'Question is outdated',
  'Duplicate question',
  'Image/diagram is missing',
  'Other',
] as const;
