<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VisitLog extends Model
{
    use HasFactory;

    protected $table = 'visit_logs';
    protected $primaryKey = 'log_id';

    protected $fillable = [
        'user_id',
        'visit_purpose',
        'timestamp',
        'qr_scanned',
        'verification_status',
        'medical_notes',
        'cleared_by',
        'scan_latitude',
        'scan_longitude',
        'scan_accuracy',
        'scan_location_status',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'qr_scanned' => 'boolean',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function clearer()
    {
        return $this->belongsTo(User::class, 'cleared_by');
    }

    public function clearanceRecord()
    {
        return $this->hasOne(ClearanceRecord::class, 'log_id');
    }
}
