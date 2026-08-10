<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ClinicAnalytics
{
    public static function dashboard(): array
    {
        return [
            'visitPurpose' => self::visitPurposeBreakdown(),
            'weeklyTrend' => self::weeklyTrend(),
            'monthlyTrend' => self::monthlyTrend(),
            'medicineStock' => self::medicineStock(),
            'commonMedicines' => self::commonMedicines(),
            'todayQueue' => self::todayQueue(),
            'monthlyReport' => self::monthlyReport(),
            'mlPredictions' => self::mlPredictions(),
            'workloadForecast' => self::workloadForecast(),
        ];
    }

    public static function mlPredictions(): array
    {
        $path = base_path('data/ml/health_trend_predictions.csv');

        if (! file_exists($path) || ! is_readable($path)) {
            return [
                'available' => false,
                'sourceMonth' => null,
                'predictionMonth' => null,
            'highestPriority' => null,
            'overallStatus' => 'Prediction file not available',
            'modelInfo' => self::mlModelInfo(),
            'rows' => [],
        ];
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            return [
                'available' => false,
                'sourceMonth' => null,
                'predictionMonth' => null,
                'highestPriority' => null,
                'overallStatus' => 'Prediction file could not be opened',
                'modelInfo' => self::mlModelInfo(),
                'rows' => [],
            ];
        }

        $headers = fgetcsv($handle);
        if (! $headers) {
            fclose($handle);
            return [
                'available' => false,
                'sourceMonth' => null,
                'predictionMonth' => null,
                'highestPriority' => null,
                'overallStatus' => 'Prediction file is empty',
                'modelInfo' => self::mlModelInfo(),
                'rows' => [],
            ];
        }
        $headers = array_map(fn ($header) => trim((string) $header, "\xEF\xBB\xBF \t\n\r\0\x0B"), $headers);

        $rows = [];
        while (($data = fgetcsv($handle)) !== false) {
            if (count(array_filter($data, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $row = array_combine($headers, array_pad($data, count($headers), null));
            if (! $row) {
                continue;
            }

            $rows[] = [
                'source_month' => $row['source_month'] ?? null,
                'prediction_month' => $row['prediction_month'] ?? null,
                'complaint_category' => $row['complaint_category'] ?? 'Unknown',
                'current_cases' => (int) ($row['current_cases'] ?? 0),
                'predicted_cases' => (int) ($row['predicted_cases'] ?? 0),
                'baseline_average' => (float) ($row['baseline_average'] ?? 0),
                'trend_level' => $row['trend_level'] ?? 'Unknown',
                'priority_score' => (int) ($row['priority_score'] ?? 0),
                'recommended_action_type' => $row['recommended_action_type'] ?? 'Review',
                'recommendation' => $row['recommendation'] ?? '',
                'reason' => $row['reason'] ?? '',
            ];
        }

        fclose($handle);

        usort($rows, fn ($a, $b) => $b['priority_score'] <=> $a['priority_score']);

        $highestPriority = $rows[0] ?? null;
        $hasActionableTrend = collect($rows)->contains(fn ($row) => in_array($row['trend_level'], ['Moderate', 'High', 'Critical'], true));

        return [
            'available' => count($rows) > 0,
            'sourceMonth' => $highestPriority['source_month'] ?? null,
            'predictionMonth' => $highestPriority['prediction_month'] ?? null,
            'highestPriority' => $highestPriority,
            'overallStatus' => $hasActionableTrend ? 'Preventive review recommended' : 'Regular monitoring recommended',
            'modelInfo' => self::mlModelInfo(),
            'rows' => array_slice($rows, 0, 8),
        ];
    }

    private static function mlModelInfo(): array
    {
        $path = base_path('data/ml/model_metrics.txt');
        $info = [
            'model' => 'RandomForestRegressor',
            'mae' => null,
            'rmse' => null,
            'r2' => null,
            'trainingRows' => null,
            'testingRows' => null,
            'monthRange' => null,
            'predictionType' => 'Monthly case count forecast',
            'notice' => 'Decision-support forecast only. Final preventive actions remain subject to clinic head review.',
        ];

        if (! file_exists($path) || ! is_readable($path)) {
            return $info;
        }

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            if (str_starts_with($line, 'Model:')) {
                $info['model'] = trim(substr($line, strlen('Model:')));
            } elseif (str_starts_with($line, 'Training rows:')) {
                $info['trainingRows'] = (int) trim(substr($line, strlen('Training rows:')));
            } elseif (str_starts_with($line, 'Testing rows:')) {
                $info['testingRows'] = (int) trim(substr($line, strlen('Testing rows:')));
            } elseif (str_starts_with($line, 'Month range:')) {
                $info['monthRange'] = trim(substr($line, strlen('Month range:')));
            } elseif (str_starts_with($line, 'MAE:')) {
                $info['mae'] = (float) trim(substr($line, strlen('MAE:')));
            } elseif (str_starts_with($line, 'RMSE:')) {
                $info['rmse'] = (float) trim(substr($line, strlen('RMSE:')));
            } elseif (str_starts_with($line, 'R2:')) {
                $info['r2'] = (float) trim(substr($line, strlen('R2:')));
            }
        }

        return $info;
    }

    public static function workloadForecast(): array
    {
        $path = base_path('data/ml/weekly_clinic_workload_predictions.csv');

        if (! file_exists($path) || ! is_readable($path)) {
            return [
                'available' => false,
                'message' => 'Workload forecast file not available',
                'row' => null,
                'modelInfo' => self::workloadModelInfo(),
            ];
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            return [
                'available' => false,
                'message' => 'Workload forecast file could not be opened',
                'row' => null,
                'modelInfo' => self::workloadModelInfo(),
            ];
        }

        $headers = fgetcsv($handle);
        if (! $headers) {
            fclose($handle);

            return [
                'available' => false,
                'message' => 'Workload forecast file is empty',
                'row' => null,
                'modelInfo' => self::workloadModelInfo(),
            ];
        }

        $headers = array_map(fn ($header) => trim((string) $header, "\xEF\xBB\xBF \t\n\r\0\x0B"), $headers);
        $data = fgetcsv($handle);
        fclose($handle);

        if ($data === false) {
            return [
                'available' => false,
                'message' => 'Workload forecast has no prediction row',
                'row' => null,
                'modelInfo' => self::workloadModelInfo(),
            ];
        }

        $row = array_combine($headers, array_pad($data, count($headers), null));
        if (! $row) {
            return [
                'available' => false,
                'message' => 'Workload forecast row could not be parsed',
                'row' => null,
                'modelInfo' => self::workloadModelInfo(),
            ];
        }

        return [
            'available' => true,
            'message' => null,
            'row' => [
                'source_week' => $row['source_week'] ?? null,
                'prediction_week' => $row['prediction_week'] ?? null,
                'source_week_start' => $row['source_week_start'] ?? null,
                'prediction_week_start' => $row['prediction_week_start'] ?? null,
                'current_total_visits' => (int) ($row['current_total_visits'] ?? 0),
                'predicted_total_visits' => (int) ($row['predicted_total_visits'] ?? 0),
                'current_health_visits' => (int) ($row['current_health_visits'] ?? 0),
                'current_non_health_visits' => (int) ($row['current_non_health_visits'] ?? 0),
                'workload_level' => $row['workload_level'] ?? 'Unknown',
                'priority_score' => (int) ($row['priority_score'] ?? 0),
                'main_recent_driver' => $row['main_recent_driver'] ?? 'No dominant driver',
                'recommendation' => $row['recommendation'] ?? '',
                'forecast_method' => $row['forecast_method'] ?? 'Unknown',
                'calendar_event' => $row['calendar_event'] ?? 'Regular',
                'rolling_8_average' => (float) ($row['rolling_8_average'] ?? 0),
            ],
            'modelInfo' => self::workloadModelInfo(),
        ];
    }

    private static function workloadModelInfo(): array
    {
        $path = base_path('data/ml/weekly_clinic_workload_model_metrics.txt');
        $info = [
            'selectedMethod' => null,
            'mae' => null,
            'rmse' => null,
            'r2' => null,
            'inputWeeks' => null,
            'trainingRows' => null,
            'validationRows' => null,
            'predictionType' => 'Weekly total clinic workload forecast',
            'notice' => 'Workload forecast uses all clinic records, including health and non-health clinic activity.',
        ];

        if (! file_exists($path) || ! is_readable($path)) {
            return $info;
        }

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            if (str_starts_with($line, 'Input weeks:')) {
                $info['inputWeeks'] = (int) trim(substr($line, strlen('Input weeks:')));
            } elseif (str_starts_with($line, 'Training rows:')) {
                $info['trainingRows'] = (int) trim(substr($line, strlen('Training rows:')));
            } elseif (str_starts_with($line, 'Validation rows:')) {
                $info['validationRows'] = (int) trim(substr($line, strlen('Validation rows:')));
            } elseif (str_starts_with($line, 'Selected method:')) {
                $info['selectedMethod'] = trim(substr($line, strlen('Selected method:')));
            } elseif (str_starts_with($line, 'MAE:')) {
                $info['mae'] = (float) trim(substr($line, strlen('MAE:')));
            } elseif (str_starts_with($line, 'RMSE:')) {
                $info['rmse'] = (float) trim(substr($line, strlen('RMSE:')));
            } elseif (str_starts_with($line, 'R2:')) {
                $info['r2'] = (float) trim(substr($line, strlen('R2:')));
            }
        }

        return $info;
    }

    public static function visitPurposeBreakdown(int $days = 30): array
    {
        return DB::table('visit_logs')
            ->select('visit_purpose as label', DB::raw('COUNT(*) as value'))
            ->where('timestamp', '>=', now()->subDays($days))
            ->groupBy('visit_purpose')
            ->orderByDesc('value')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['label' => $row->label ?: 'General Check-in', 'value' => (int) $row->value])
            ->values()
            ->all();
    }

    public static function weeklyTrend(): array
    {
        $rows = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $rows[] = [
                'label' => $date->format('D'),
                'date' => $date->toDateString(),
                'value' => DB::table('visit_logs')->whereDate('timestamp', $date->toDateString())->count(),
            ];
        }

        return $rows;
    }

    public static function monthlyTrend(int $months = 6): array
    {
        $rows = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $rows[] = [
                'label' => $date->format('M'),
                'month' => $date->format('Y-m'),
                'value' => DB::table('visit_logs')
                    ->whereYear('timestamp', $date->year)
                    ->whereMonth('timestamp', $date->month)
                    ->count(),
            ];
        }

        return $rows;
    }

    public static function medicineStock(): array
    {
        $total = DB::table('medicines')->count();
        $out = DB::table('medicines')->where('quantity', '<=', 0)->count();
        $critical = DB::table('medicines')->where('quantity', '>', 0)->where('quantity', '<', 10)->count();
        $needOrder = DB::table('medicines')->whereBetween('quantity', [10, 30])->count();

        return [
            'total' => $total,
            'available' => max($total - $out, 0),
            'critical' => $critical,
            'needOrder' => $needOrder,
            'out' => $out,
            'lowest' => DB::table('medicines')
                ->select('name', 'category', 'quantity')
                ->orderBy('quantity')
                ->limit(8)
                ->get(),
        ];
    }

    public static function commonMedicines(): array
    {
        return [
            ['label' => 'Paracetamol', 'value' => self::purposeCount(['Fever', 'Headache'])],
            ['label' => 'ORS / Antacid', 'value' => self::purposeCount(['Stomach Pain'])],
            ['label' => 'Antihistamines', 'value' => self::purposeCount(['Allergy / Rashes'])],
            ['label' => 'Wound care', 'value' => self::purposeCount(['Injury Treatment'])],
            ['label' => 'Cough syrup', 'value' => self::purposeCount(['Cough / Colds'])],
        ];
    }

    public static function todayQueue(): array
    {
        return DB::table('visit_logs')
            ->leftJoin('users', 'visit_logs.user_id', '=', 'users.id')
            ->select('visit_logs.log_id', 'visit_logs.visit_purpose', 'visit_logs.verification_status', 'visit_logs.timestamp', 'users.name', 'users.student_id')
            ->whereDate('visit_logs.timestamp', today())
            ->orderByDesc('visit_logs.timestamp')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->log_id,
                'name' => $row->name,
                'student_id' => $row->student_id,
                'purpose' => $row->visit_purpose,
                'status' => $row->verification_status,
                'time' => Carbon::parse($row->timestamp)->format('g:i A'),
            ])
            ->all();
    }

    public static function monthlyReport(): array
    {
        $currentStart = now()->startOfMonth();
        $previousStart = now()->subMonth()->startOfMonth();
        $previousEnd = now()->subMonth()->endOfMonth();

        $currentTotal = DB::table('visit_logs')->where('timestamp', '>=', $currentStart)->count();
        $previousTotal = DB::table('visit_logs')->whereBetween('timestamp', [$previousStart, $previousEnd])->count();
        $change = $previousTotal > 0 ? round((($currentTotal - $previousTotal) / $previousTotal) * 100) : ($currentTotal > 0 ? 100 : 0);

        $topConcern = DB::table('visit_logs')
            ->select('visit_purpose', DB::raw('COUNT(*) as total'))
            ->where('timestamp', '>=', $currentStart)
            ->whereNotIn('visit_purpose', ['General Check-in', 'Take Medicine', 'Follow-up Checkup'])
            ->groupBy('visit_purpose')
            ->orderByDesc('total')
            ->first();

        $departmentHotspots = DB::table('visit_logs')
            ->join('users', 'visit_logs.user_id', '=', 'users.id')
            ->select('users.department', DB::raw('COUNT(*) as total'))
            ->where('visit_logs.timestamp', '>=', $currentStart)
            ->whereNotNull('users.department')
            ->groupBy('users.department')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => ['label' => $row->department, 'value' => (int) $row->total])
            ->all();

        $recommendations = self::recommendations($topConcern?->visit_purpose, $change);

        return [
            'month' => now()->format('F Y'),
            'currentTotal' => $currentTotal,
            'previousTotal' => $previousTotal,
            'change' => $change,
            'topConcern' => [
                'label' => $topConcern?->visit_purpose ?: 'No dominant trend',
                'value' => (int) ($topConcern?->total ?? 0),
            ],
            'departmentHotspots' => $departmentHotspots,
            'recommendations' => $recommendations,
            'symposium' => self::symposiumPlan($topConcern?->visit_purpose),
        ];
    }

    public static function monthlyIntelligenceReport(): array
    {
        $actual = self::monthlyReport();
        $mlPredictions = self::mlPredictions();
        $workloadForecast = self::workloadForecast();
        $forecast = $mlPredictions['highestPriority'] ?? null;
        $decision = null;
        $event = null;

        if ($forecast && !empty($mlPredictions['sourceMonth']) && !empty($mlPredictions['predictionMonth'])) {
            $decision = DB::table('ml_recommendation_decisions')
                ->leftJoin('users', 'ml_recommendation_decisions.user_id', '=', 'users.id')
                ->where('ml_recommendation_decisions.source_month', $mlPredictions['sourceMonth'])
                ->where('ml_recommendation_decisions.prediction_month', $mlPredictions['predictionMonth'])
                ->where('ml_recommendation_decisions.complaint_category', $forecast['complaint_category'])
                ->select(
                    'ml_recommendation_decisions.id',
                    'ml_recommendation_decisions.decision',
                    'ml_recommendation_decisions.final_action',
                    'ml_recommendation_decisions.remarks',
                    'ml_recommendation_decisions.updated_at as decided_at',
                    'users.name as decided_by',
                )
                ->first();

            if ($decision) {
                $event = DB::table('events')
                    ->where('ml_recommendation_decision_id', $decision->id)
                    ->select('id', 'title', 'event_date', 'event_time', 'status')
                    ->latest('created_at')
                    ->first();
            }
        }

        return [
            'actual' => $actual,
            'actualDataStatus' => $actual['currentTotal'] > 0
                ? 'Recorded ClinicQR activity for this month'
                : 'No clinic visits have been entered in ClinicQR for this month yet',
            'forecast' => $forecast,
            'forecastAvailable' => $mlPredictions['available'] ?? false,
            'sourceMonth' => $mlPredictions['sourceMonth'] ?? null,
            'predictionMonth' => $mlPredictions['predictionMonth'] ?? null,
            'workloadForecast' => $workloadForecast,
            'decision' => $decision,
            'event' => $event,
        ];
    }

    private static function purposeCount(array $purposes): int
    {
        return DB::table('visit_logs')
            ->whereIn('visit_purpose', $purposes)
            ->where('timestamp', '>=', now()->subDays(30))
            ->count();
    }

    private static function recommendations(?string $topConcern, int $change): array
    {
        $base = match ($topConcern) {
            'Fever', 'Cough / Colds' => [
                'Run a respiratory hygiene campaign focused on masks, handwashing, hydration, and early reporting.',
                'Prepare fever and cough medicine stock for the next two weeks.',
            ],
            'Stomach Pain' => [
                'Coordinate with the canteen on food safety reminders and hydration practices.',
                'Post ORS and stomach pain guidance in student common areas.',
            ],
            'Injury Treatment' => [
                'Review PE and campus safety protocols with class advisers and sports groups.',
                'Restock wound dressings, antiseptics, and cold packs.',
            ],
            'Allergy / Rashes' => [
                'Share reminders about allergens, insect bite prevention, and when to visit the clinic.',
                'Check antihistamine and skin care inventory levels.',
            ],
            default => [
                'Continue daily clinic monitoring and compare visit patterns weekly.',
                'Keep health advisories visible in high-traffic campus areas.',
            ],
        };

        if ($change >= 25) {
            array_unshift($base, 'Prioritize a prevention symposium this month because clinic visits are materially higher than last month.');
        }

        return $base;
    }

    private static function symposiumPlan(?string $topConcern): array
    {
        return [
            'title' => match ($topConcern) {
                'Fever', 'Cough / Colds' => 'Respiratory Illness Prevention Symposium',
                'Stomach Pain' => 'Food Safety and Hydration Awareness Session',
                'Injury Treatment' => 'Campus Injury Prevention and First Aid Orientation',
                'Allergy / Rashes' => 'Allergy, Skin Care, and Insect Bite Prevention Talk',
                default => 'Student Wellness and Preventive Health Symposium',
            },
            'audience' => 'Students, class advisers, student leaders, and clinic staff',
            'focus' => $topConcern ?: 'General preventive health',
        ];
    }
}
