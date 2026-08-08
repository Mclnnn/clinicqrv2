<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\MlRecommendationDecision;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MlRecommendationDecisionController extends Controller
{
    public function index()
    {
        $decisions = MlRecommendationDecision::with('decidedBy:id,name')
            ->latest('updated_at')
            ->get()
            ->map(fn (MlRecommendationDecision $decision) => [
                'id' => $decision->id,
                'source_month' => $decision->source_month,
                'prediction_month' => $decision->prediction_month,
                'complaint_category' => $decision->complaint_category,
                'current_cases' => $decision->current_cases,
                'predicted_cases' => $decision->predicted_cases,
                'trend_level' => $decision->trend_level,
                'priority_score' => $decision->priority_score,
                'recommended_action' => $decision->recommended_action,
                'decision' => $decision->decision,
                'final_action' => $decision->final_action,
                'remarks' => $decision->remarks,
                'decided_by' => $decision->decidedBy?->name ?? 'Unavailable account',
                'decided_at' => $decision->updated_at?->toISOString(),
            ]);

        return Inertia::render('SuperAdmin/MlDecisionHistory', [
            'decisions' => $decisions,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'source_month' => ['required', 'date_format:Y-m'],
            'prediction_month' => ['required', 'date_format:Y-m'],
            'complaint_category' => ['required', 'string', 'max:255'],
            'current_cases' => ['required', 'integer', 'min:0'],
            'predicted_cases' => ['required', 'numeric', 'min:0'],
            'trend_level' => ['nullable', 'string', 'max:100'],
            'priority_score' => ['required', 'integer', 'min:0', 'max:100'],
            'recommended_action' => ['nullable', 'string'],
            'decision' => ['required', 'in:Approved,Modified,Rejected'],
            'final_action' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['user_id'] = auth()->id();

        $decision = MlRecommendationDecision::updateOrCreate(
            [
                'source_month' => $data['source_month'],
                'prediction_month' => $data['prediction_month'],
                'complaint_category' => $data['complaint_category'],
            ],
            $data,
        );

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'ml_recommendation_decision',
            'additional_details' => auth()->user()->name . " {$data['decision']} the {$data['complaint_category']} ML recommendation for {$data['prediction_month']}.",
            'timestamp' => now(),
        ]);

        return back()->with('success', "ML recommendation marked as {$decision->decision}.");
    }
}
