<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('ml:export-live-clinic-logs', function () {
    $outDir = base_path('data/ml');
    if (! is_dir($outDir)) {
        mkdir($outDir, 0775, true);
    }

    $path = $outDir.'/live_clinic_logs_for_ml.csv';
    $handle = fopen($path, 'w');

    if ($handle === false) {
        $this->error("Could not write to {$path}");
        return 1;
    }

    $headers = [
        'source_sheet',
        'source_row',
        'visit_date',
        'year',
        'month',
        'month_key',
        'date_adjusted',
        'original_visit_date',
        'age',
        'sex',
        'department',
        'ip_status',
        'purpose',
        'complaint_raw',
        'complaint_category',
        'management_raw',
        'qty',
    ];

    fputcsv($handle, $headers);

    $count = 0;

    DB::table('visit_logs')
        ->leftJoin('users', 'visit_logs.user_id', '=', 'users.id')
        ->select(
            'visit_logs.log_id',
            'visit_logs.visit_purpose',
            'visit_logs.medical_notes',
            'visit_logs.timestamp',
            'users.department',
            'users.gender',
        )
        ->orderBy('visit_logs.timestamp')
        ->chunk(500, function ($logs) use ($handle, &$count) {
            foreach ($logs as $log) {
                if (empty($log->timestamp)) {
                    continue;
                }

                $timestamp = \Carbon\Carbon::parse($log->timestamp);
                $purpose = normalize_ml_text($log->visit_purpose ?? '');
                $notes = normalize_ml_text($log->medical_notes ?? '');
                $complaintRaw = $notes !== '' ? $notes : $purpose;
                $category = categorize_live_clinic_text($purpose.' '.$notes);

                fputcsv($handle, [
                    'ClinicQR Live DB',
                    $log->log_id,
                    $timestamp->toDateString(),
                    $timestamp->format('Y'),
                    $timestamp->format('m'),
                    $timestamp->format('Y-m'),
                    'no',
                    '',
                    '',
                    normalize_live_sex($log->gender ?? ''),
                    normalize_ml_text($log->department ?? ''),
                    '',
                    $purpose,
                    $complaintRaw,
                    $category,
                    '',
                    '',
                ]);

                $count++;
            }
        });

    fclose($handle);

    $this->info("Exported {$count} live ClinicQR visit logs.");
    $this->info("Output: data/ml/live_clinic_logs_for_ml.csv");

    return 0;
})->purpose('Export current ClinicQR visit logs into the ML cleaned-log CSV format');

function normalize_ml_text($value): string
{
    return trim(preg_replace('/\s+/', ' ', (string) $value));
}

function normalize_live_sex($value): string
{
    $text = strtoupper(normalize_ml_text($value));

    return match ($text) {
        'MALE', 'M' => 'M',
        'FEMALE', 'F' => 'F',
        default => '',
    };
}

function categorize_live_clinic_text($value): string
{
    $text = strtoupper(normalize_ml_text($value));

    if ($text === '') {
        return 'Unknown';
    }

    $patterns = [
        'Headache' => ['HEADACHE', 'HEAD ACHE', 'H/A', 'MIGRAINE'],
        'Respiratory' => ['COUGH', 'COLDS', 'COLD', 'SORE THROAT', 'RUNNY NOSE', 'FLU', 'ASTHMA', 'RESPIRATORY'],
        'Fever' => ['FEVER', 'FEBRILE', 'HIGH TEMP', 'TEMPERATURE'],
        'Allergy' => ['ALLERGY', 'ALLERGIES', 'RASHES', 'ITCH', 'URTICARIA'],
        'Body Pain' => ['BODY PAIN', 'BACK PAIN', 'CHEST PAIN', 'MUSCLE PAIN', 'JOINT PAIN', 'LEG PAIN', 'ARM PAIN', 'SHOULDER PAIN', 'NECK PAIN', 'PAIN'],
        'Gastrointestinal' => ['STOMACH', 'ABDOMINAL', 'DIARRHEA', 'DIARRHOEA', 'VOMIT', 'NAUSEA', 'LBM', 'GASTRIC', 'ACIDITY'],
        'Dysmenorrhea' => ['DYSMENORRHEA', 'DYSMENORRHOEA', 'MENSTRUAL'],
        'Wound/Injury' => ['WOUND', 'INJURY', 'CUT', 'ABRASION', 'SPRAIN', 'BURN', 'BLEED', 'FIRST AID'],
        'Dizziness' => ['DIZZY', 'DIZZINESS', 'VERTIGO', 'FAINT'],
        'Dental' => ['DENTAL', 'TOOTH', 'TOOTHACHE'],
        'Blood Pressure' => ['BLOOD PRESSURE', 'HIGH BLOOD', 'HYPERTENSION', 'BP'],
        'Medical Certificate' => ['MEDICAL CERT', 'MED CERT', 'MED-CERT', 'CERTIFICATE'],
        'Physical Assessment' => ['BMI', 'HEIGHT', 'WEIGHT', 'VITAL SIGN', 'H/W'],
        'Check-up/Consultation' => ['CHECK-UP', 'CHECK UP', 'CONSULT', 'ROUTINE CHECK', 'MONITORING'],
        'Enrollment/Requirement' => ['ENROLLMENT', 'CLEARANCE', 'REQUIREMENT', 'ROTC', 'OJT', 'TRAINING'],
        'Supply/Medicine Issuance' => ['SUPPLY', 'ALCOHOL', 'FACE MASK', 'FACEMASK', 'GLOVES', 'VITAMINS', 'MEDICINE', 'MEDS'],
        'Laboratory' => ['LAB', 'LABORATORY'],
    ];

    foreach ($patterns as $category => $terms) {
        foreach ($terms as $term) {
            if (str_contains($text, $term)) {
                return $category;
            }
        }
    }

    return 'Other';
}
