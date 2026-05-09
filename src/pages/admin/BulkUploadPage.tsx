import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePageStore } from '../../stores/pageStore';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { getErrorMessage, normalizeText } from '../../lib/api';
import { toast } from '../../components/ui/Toast';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, ChevronDown, Download } from 'lucide-react';
import Papa from 'papaparse';
import type { Difficulty, QuestionType } from '../../types/database';

interface UploadResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

const QUESTION_TYPES = new Set<QuestionType>(['single_choice', 'multiple_choice', 'numerical']);
const DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const OPTION_KEYS = ['a', 'b', 'c', 'd'];

function isQuestionType(value: string): value is QuestionType {
  return QUESTION_TYPES.has(value as QuestionType);
}

function isDifficulty(value: string): value is Difficulty {
  return DIFFICULTIES.has(value as Difficulty);
}

export default function BulkUploadPage() {
  const setPage = usePageStore((s) => s.setPage);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showFormat, setShowFormat] = useState(false);

  useEffect(() => { setPage('Bulk Upload', 'Import questions from CSV'); }, []);

  function downloadTemplate() {
    const headers = ['exam', 'subject', 'chapter', 'topic', 'question_text', 'question_type', 'difficulty', 'marks', 'negative_marks', 'year', 'explanation', 'option_a', 'explanation_a', 'option_b', 'explanation_b', 'option_c', 'explanation_c', 'option_d', 'explanation_d', 'correct_answer'];
const sampleRow = ['JEE Main', 'Physics', 'Mechanics', 'Newton Laws', 'What is Newton\'s second law?', 'single_choice', 'medium', '4', '1', '2024', 'Newton\'s second law states F=ma', 'F = ma', 'This is the correct formula relating force, mass and acceleration', 'E = mc^2', 'This is Einstein\'s mass-energy equivalence formula', 'P = mv', 'This is the formula for momentum', 'F = mg', 'This is the formula for weight', 'a'];
    const csv = Papa.unparse([headers, sampleRow]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'questions_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const processFile = useCallback(async (file: File) => {
    setUploading(true);
    setResult(null);

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Upload a CSV file.');
        return;
      }

      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const rows = parsed.data as Record<string, string>[];

      const parseErrors = parsed.errors.map((err) => `Row ${err.row ?? '?'}: ${err.message}`);
      const total = rows.length;
      let success = 0;
      const errors: string[] = [...parseErrors];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const examName = normalizeText(row.exam || '');
          const subjectName = normalizeText(row.subject || '');
          const chapterName = normalizeText(row.chapter || '');
          const topicName = normalizeText(row.topic || '');
          const questionText = row.question_text?.trim();
          const questionType = row.question_type?.trim() || 'single_choice';
          const difficulty = row.difficulty?.trim() || 'medium';
          const correctAnswer = row.correct_answer?.trim().toLowerCase();
          const yearValue = row.year?.trim() ? Number(row.year) : null;
          const marks = row.marks?.trim() ? Number(row.marks) : 1;
          const negativeMarks = row.negative_marks?.trim() ? Number(row.negative_marks) : 0;

          if (!examName || !subjectName || !chapterName || !topicName || !questionText) {
            errors.push(`Row ${i + 2}: Missing required fields`);
            continue;
          }
          if (!isQuestionType(questionType)) {
            errors.push(`Row ${i + 2}: Invalid question_type`);
            continue;
          }
          if (!isDifficulty(difficulty)) {
            errors.push(`Row ${i + 2}: Invalid difficulty`);
            continue;
          }
          if (!Number.isFinite(marks) || marks < 0 || !Number.isFinite(negativeMarks) || negativeMarks < 0) {
            errors.push(`Row ${i + 2}: Marks must be non-negative numbers`);
            continue;
          }
          if (yearValue != null && (!Number.isInteger(yearValue) || yearValue < 1900 || yearValue > 2100)) {
            errors.push(`Row ${i + 2}: Year must be between 1900 and 2100`);
            continue;
          }
          if (!correctAnswer || !OPTION_KEYS.includes(correctAnswer)) {
            errors.push(`Row ${i + 2}: correct_answer must be one of a, b, c, or d`);
            continue;
          }

          const optionRows = OPTION_KEYS
            .map((letter, idx) => ({
              option_text: row[`option_${letter}`]?.trim() || '',
              is_correct: correctAnswer === letter,
              explanation: row[`explanation_${letter}`]?.trim() || null,
              sort_order: idx,
            }))
            .filter((o) => o.option_text);

          if (optionRows.length < 2) {
            errors.push(`Row ${i + 2}: Add at least two options`);
            continue;
          }
          if (!optionRows.some((option) => option.is_correct)) {
            errors.push(`Row ${i + 2}: Correct option is blank`);
            continue;
          }

          let { data: exam, error: examLookupError } = await supabase.from('exams').select('id').eq('name', examName).single();
          if (examLookupError && examLookupError.message !== 'No rows returned in demo mode.') {
            exam = null;
          }
          if (!exam) {
            const { data: newExam, error: examCreateError } = await supabase.from('exams').insert({ name: examName }).select().single();
            if (examCreateError) throw examCreateError;
            exam = newExam;
          }
          if (!exam) { errors.push(`Row ${i + 2}: Failed to find/create exam`); continue; }

          let { data: subject } = await supabase.from('subjects').select('id').eq('exam_id', exam.id).eq('name', subjectName).single();
          if (!subject) {
            const { data: newSub, error: subjectCreateError } = await supabase.from('subjects').insert({ exam_id: exam.id, name: subjectName }).select().single();
            if (subjectCreateError) throw subjectCreateError;
            subject = newSub;
          }
          if (!subject) { errors.push(`Row ${i + 2}: Failed to find/create subject`); continue; }

          let { data: chapter } = await supabase.from('chapters').select('id').eq('subject_id', subject.id).eq('name', chapterName).single();
          if (!chapter) {
            const { data: newCh, error: chapterCreateError } = await supabase.from('chapters').insert({ subject_id: subject.id, name: chapterName }).select().single();
            if (chapterCreateError) throw chapterCreateError;
            chapter = newCh;
          }
          if (!chapter) { errors.push(`Row ${i + 2}: Failed to find/create chapter`); continue; }

          let { data: topic } = await supabase.from('topics').select('id').eq('chapter_id', chapter.id).eq('name', topicName).single();
          if (!topic) {
            const { data: newTp, error: topicCreateError } = await supabase.from('topics').insert({ chapter_id: chapter.id, name: topicName }).select().single();
            if (topicCreateError) throw topicCreateError;
            topic = newTp;
          }
          if (!topic) { errors.push(`Row ${i + 2}: Failed to find/create topic`); continue; }

          const { data: question, error: questionCreateError } = await supabase.from('questions').insert({
            topic_id: topic.id,
            question_text: questionText,
            question_type: questionType,
            difficulty: difficulty,
            marks,
            negative_marks: negativeMarks,
            explanation: row.explanation?.trim() || null,
            year: yearValue,
          }).select().single();

          if (questionCreateError) throw questionCreateError;
          if (!question) { errors.push(`Row ${i + 2}: Failed to create question`); continue; }

          const { error: optionsError } = await supabase.from('options').insert(optionRows.map((option) => ({
            question_id: question.id,
            ...option,
          })));
          if (optionsError) throw optionsError;
          success++;
        } catch (err) {
          errors.push(`Row ${i + 2}: ${getErrorMessage(err, 'Unexpected error')}`);
        }
      }

      setResult({ total, success, failed: total - success, errors });
      if (success > 0) {
        toast.success(`Imported ${success} question${success === 1 ? '' : 's'}.`);
      }
    } catch (err) {
      setResult({ total: 0, success: 0, failed: 1, errors: [getErrorMessage(err, 'Could not process CSV.')] });
    } finally {
      setUploading(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--fg)]">Bulk Upload</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">Import questions from CSV files in bulk.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={downloadTemplate}>
          <Download className="h-3.5 w-3.5" /> Download Template
        </Button>
      </div>

      {/* Upload Zone */}
      <Card>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed rounded-xl transition-all',
            dragOver ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.01]' : 'border-[var(--border)] hover:border-[var(--fg-muted)]'
          )}
        >
        <div className={cn('h-14 w-14 rounded-lg flex items-center justify-center transition-colors', dragOver ? 'bg-[var(--primary)]/10' : 'bg-[var(--bg-body)]')}>
            <Upload className={cn('h-7 w-7 transition-colors', dragOver ? 'text-[var(--primary)]' : 'text-[var(--fg-muted)]')} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--fg)]">
              {uploading ? 'Uploading...' : 'Drop CSV file here or click to browse'}
            </p>
            <p className="text-xs text-[var(--fg-muted)] mt-1">
              Supports CSV files with exam, subject, chapter, topic, and question columns
            </p>
          </div>
          {!uploading && (
            <label>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
              <Button size="sm" variant="secondary" className="cursor-pointer mt-1">
                Browse Files
              </Button>
            </label>
          )}
        </div>
      </Card>

      {/* CSV Format Reference */}
      <Card>
        <button onClick={() => setShowFormat(!showFormat)} className="flex items-center justify-between w-full text-left">
          <span className="text-[15px] font-semibold text-[var(--fg)]">CSV Format Reference</span>
          <ChevronDown className={cn('h-4 w-4 text-[var(--fg-muted)] transition-transform', showFormat && 'rotate-180')} />
        </button>
        {showFormat && (
        <div className="overflow-x-auto mt-3 pt-3 border-t border-[var(--border)]">
          <table className="text-[10px] text-[var(--fg)]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['exam', 'subject', 'chapter', 'topic', 'question_text', 'option_a', 'explanation_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'difficulty', 'marks', 'negative_marks', 'year'].map((h) => (
                  <th key={h} className="px-2 py-1 text-left text-[var(--fg-muted)] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {['JEE', 'Physics', 'Mechanics', 'Newton Laws', 'What is F=ma?', 'Force eq', 'Correct formula', 'Energy eq', 'Mass eq', 'None', 'a', 'F=ma means...', 'medium', '4', '1', '2024'].map((v, i) => (
                  <td key={i} className="px-2 py-1 whitespace-nowrap">{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader><CardTitle>Upload Results</CardTitle></CardHeader>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-body)]">
              <FileText className="h-4 w-4 text-[var(--fg-muted)]" />
              <div>
                <p className="text-[10px] text-[var(--fg-muted)]">Total</p>
                <p className="text-sm font-bold text-[var(--fg)]">{result.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-[10px] text-[var(--fg-muted)]">Success</p>
                <p className="text-sm font-bold text-green-500">{result.success}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
              <XCircle className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-[10px] text-[var(--fg-muted)]">Failed</p>
                <p className="text-sm font-bold text-red-400">{result.failed}</p>
              </div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1 text-[10px] text-red-400">
                  <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  {err}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
