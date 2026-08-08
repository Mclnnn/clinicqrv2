<?php

namespace App\Models;
use App\Models\User;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'user_id', 'appointment_type', 'appointment_date',
        'appointment_time', 'status', 'notes',
        'rejection_reason', 'approved_by', 'admin_comment',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
