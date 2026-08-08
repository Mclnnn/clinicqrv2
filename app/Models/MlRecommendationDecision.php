<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MlRecommendationDecision extends Model
{
    protected $fillable = [
        'user_id',
        'source_month',
        'prediction_month',
        'complaint_category',
        'current_cases',
        'predicted_cases',
        'trend_level',
        'priority_score',
        'recommended_action',
        'decision',
        'final_action',
        'remarks',
    ];

    public function decidedBy()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
