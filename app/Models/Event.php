<?php

namespace App\Models;

use App\Support\QrUrl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Models\EventAttendance;  // ← DAGDAG ITO

class Event extends Model
{
    protected $fillable = [
    'title',
    'description',
    'location',
    'event_date',
    'event_time',
    'status',
    'created_by',
    'ml_recommendation_decision_id',
    'qr_token',
];

    protected $casts = [
        'event_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function ($event) {
            $event->qr_token = Str::uuid();
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attendances()
    {
        return $this->hasMany(EventAttendance::class);
    }

    public function mlRecommendationDecision()
    {
        return $this->belongsTo(MlRecommendationDecision::class);
    }

    public function getScanUrlAttribute(): string
{
    return QrUrl::baseUrl() . '/attendance/scan/' . $this->qr_token;
}
}  // ← DAGDAG ITO
