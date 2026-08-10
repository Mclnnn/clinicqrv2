<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;


use App\Models\Appointment;
use App\Models\VisitLog;
use App\Models\ClearanceRecord;
use App\Models\ActivityLog;

class User extends Authenticatable
{
   use HasFactory;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'auth_provider',
        'school_portal_id',
        'school_portal_synced_at',
        'student_id',
        'employee_id',
        'user_type',
    'department',
    'contact_number',
    'date_of_birth',
    'gender',
    'address',

    'role',
    'status',
    'rejection_reason',
    'created_by',
    'profile_photo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'school_portal_synced_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relationships
    public function visitLogs()
    {
        return $this->hasMany(VisitLog::class, 'user_id');
    }

    public function clearedVisits()
    {
        return $this->hasMany(VisitLog::class, 'cleared_by');
    }

    public function clearanceRecords()
    {
        return $this->hasMany(ClearanceRecord::class, 'user_id');
    }

    public function signedClearances()
    {
        return $this->hasMany(ClearanceRecord::class, 'signed_by');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    // Who created this account
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function appointments()
{
    return $this->hasMany(Appointment::class);
}
public function userNotifications()
{
    return $this->hasMany(\App\Models\Notification::class);
}
}
