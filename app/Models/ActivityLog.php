<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $table = 'activity_logs';
    protected $primaryKey = 'log_id';

    protected $fillable = [
        'user_id',
        'action',
        'timestamp',
        'ip_address',
        'additional_details',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}